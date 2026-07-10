/**
 * RxDB database singleton for Phase 4 local-first architecture.
 *
 * - One database per browser session, created lazily on first use.
 * - Uses Dexie (IndexedDB) as the storage adapter.
 * - Wires Section replication against /api/v1/sync/section/{pull,push,stream}.
 * - Auth tokens are fetched via oidc-spa (getOidc).
 *
 * Call `getRxDb()` to get the initialised database. It is safe to call from
 * multiple React components — they all get the same promise-cached instance.
 */

import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin, RxReplicationPullStreamItem, RxStorage, removeRxDatabase, RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication'
import { Subject } from 'rxjs'
import { clearInvalidAppAuth, getAppAccessToken, refreshAppAccessToken } from '../auth/session'
import { emitDiagnostic } from '../diagnostics/event-bus'
import {
  sectionSchema,
  SectionDocType,
  itemSchema,
  ItemDocType,
  listSchema,
  ListDocType,
  listItemSchema,
  ListItemDocType,
  householdSchema,
  HouseholdDocType,
  storeSchema,
  StoreDocType,
} from './schema'

// ---------------------------------------------------------------------------
// OIDC token helpers
// ---------------------------------------------------------------------------

const TEST_TOKEN_KEY = '__grocerun_test_token__'

function getTestToken(): string | null {
  if (typeof window === 'undefined') return null
  try { return sessionStorage.getItem(TEST_TOKEN_KEY) } catch { return null }
}

async function getAccessToken(): Promise<string | null> {
  const testToken = getTestToken()
  if (testToken) return testToken

  return getAppAccessToken()
}

async function refreshAndGetToken(): Promise<string | null> {
  const testToken = getTestToken()
  if (testToken) return testToken

  try {
    return await refreshAppAccessToken()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// JWT helpers for diagnostics (decode without verification)
// ---------------------------------------------------------------------------
function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

function decodeJwtExp(token: string | null): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000
}

function decodeJwtSub(token: string | null): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.sub !== 'string') return null
  return payload.sub
}

// ---------------------------------------------------------------------------
// Dev-mode plugin (stripped in production builds via tree-shaking)
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin)
}

/**
 * In dev-mode RxDB requires a schema validator wrapping the storage.
 * In production we skip validation for performance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RxDB storage generics are untyped
function getStorage(): RxStorage<any, any> {
  const base = getRxStorageDexie()
  if (import.meta.env.DEV) {
    return wrappedValidateZSchemaStorage({ storage: base })
  }
  return base
}

// ---------------------------------------------------------------------------
// Database type
// ---------------------------------------------------------------------------

export type GrocerunCollections = {
  sections: RxCollection<SectionDocType>
  items: RxCollection<ItemDocType>
  lists: RxCollection<ListDocType>
  listItems: RxCollection<ListItemDocType>
  households: RxCollection<HouseholdDocType>
  stores: RxCollection<StoreDocType>
}

export type GrocerunDatabase = RxDatabase<GrocerunCollections>

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let dbPromise: Promise<GrocerunDatabase> | null = null
const RXDB_NAME = 'grocerun-v9'
let sharedSyncStreamOpened = false
let periodicResyncTimer: ReturnType<typeof setInterval> | null = null
let visibilityListenerAdded = false
let sharedSyncEventSource: EventSource | null = null

export function getRxDb(): Promise<GrocerunDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase().catch((err) => {
      // Clear the cached promise so the next call retries instead of
      // returning the same rejected promise forever.
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}

export async function resetRxDb(): Promise<void> {
  if (sharedSyncEventSource) {
    sharedSyncEventSource.close()
  }
  sharedSyncEventSource = null
  sharedSyncStreamOpened = false
  stopPeriodicResync()
  sharedPullStreams.clear()

  if (dbPromise) {
    const db = await dbPromise.catch(() => null)
    if (db) {
      await db.close()
    }
  }

  dbPromise = null
  await removeRxDatabase(RXDB_NAME, getStorage())
}

async function initDatabase(): Promise<GrocerunDatabase> {
  const db: GrocerunDatabase = await createRxDatabase<GrocerunCollections>({
    name: RXDB_NAME,
    storage: getStorage(),
    // ignoreDuplicate only allowed in dev-mode; in production RxDB enforces
    // a single instance per name (React StrictMode double-invocation is not
    // an issue in production builds).
    ignoreDuplicate: import.meta.env.DEV,
  })

  await db.addCollections({
    sections: {
      schema: sectionSchema,
    },
    items: {
      schema: itemSchema,
    },
    lists: {
      schema: listSchema,
    },
    listItems: {
      schema: listItemSchema,
    },
    households: {
      schema: householdSchema,
    },
    stores: {
      schema: storeSchema,
    },
  })

  // Start replication for all six collections.
  //
  // All six pull (client caches server data). Only item and listItem
  // push — these are the local-first active shopping writes. Section,
  // list, store, and household are server-authoritative: all mutations
  // go through REST, and the server broadcasts SSE → pull for convergence.
  startSectionReplication(db.sections)
  startItemReplication(db.items)
  startListReplication(db.lists)
  startListItemReplication(db.listItems)
  startHouseholdReplication(db.households)
  startStoreReplication(db.stores)

  // Trigger initial pull across all collections so the database is
  // populated before the first hook query (critical after resetRxDb).
  // Periodic resync runs as a fallback until the SSE stream opens.
  resyncAll()
  startPeriodicResync()

  return db
}

// ---------------------------------------------------------------------------
// Section replication
// ---------------------------------------------------------------------------

// Exposed so mutation hooks can trigger an immediate re-pull after a REST write.
type SectionCheckpoint = { id: string; updatedAt: string }
let sectionPullStream$: Subject<RxReplicationPullStreamItem<SectionDocType, SectionCheckpoint>> | null = null

/**
 * Trigger an immediate RxDB re-pull for the Section collection.
 * Call this after a successful REST mutation (create/update/delete/reorder).
 */
export function resyncSections() {
  if (sectionPullStream$) {
    sectionPullStream$.next('RESYNC' as RxReplicationPullStreamItem<SectionDocType, SectionCheckpoint>)
  }
}

/**
 * Wires the Section collection to the backend sync endpoints.
 *
 * Pull: GET /api/v1/sync/section/pull?updatedAt=…&id=…&batchSize=…
 * Push: POST /api/v1/sync/section/push  (body: PushRow[])
 * Stream: GET /api/v1/sync/section/stream  (SSE — triggers re-pull on RESYNC)
 */
function startSectionReplication(collection: RxCollection<SectionDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<SectionDocType, SectionCheckpoint>>()
  sectionPullStream$ = pullStream$
  startPullReplication({
    collection,
    basePath: '/api/v1/sync/section',
    replicationIdentifier: 'grocerun-section-sync-v1',
    pullStream$,
  })
}

// ---------------------------------------------------------------------------
// Item replication
// ---------------------------------------------------------------------------

type ItemCheckpoint = { id: string; updatedAt: string }
let itemPullStream$: Subject<RxReplicationPullStreamItem<ItemDocType, ItemCheckpoint>> | null = null

export function resyncItems() {
  if (itemPullStream$) {
    itemPullStream$.next('RESYNC' as RxReplicationPullStreamItem<ItemDocType, ItemCheckpoint>)
  }
}

type ListCheckpoint = { id: string; updatedAt: string }
let listPullStream$: Subject<RxReplicationPullStreamItem<ListDocType, ListCheckpoint>> | null = null

export function resyncLists() {
  if (listPullStream$) {
    listPullStream$.next('RESYNC' as RxReplicationPullStreamItem<ListDocType, ListCheckpoint>)
  }
}

type ListItemCheckpoint = { id: string; updatedAt: string }
let listItemPullStream$: Subject<RxReplicationPullStreamItem<ListItemDocType, ListItemCheckpoint>> | null = null

export function resyncListItems() {
  if (listItemPullStream$) {
    listItemPullStream$.next('RESYNC' as RxReplicationPullStreamItem<ListItemDocType, ListItemCheckpoint>)
  }
}

type HouseholdCheckpoint = { id: string; updatedAt: string }
let householdPullStream$: Subject<RxReplicationPullStreamItem<HouseholdDocType, HouseholdCheckpoint>> | null = null

export function resyncHouseholds() {
  if (householdPullStream$) {
    householdPullStream$.next('RESYNC' as RxReplicationPullStreamItem<HouseholdDocType, HouseholdCheckpoint>)
  }
}

type StoreCheckpoint = { id: string; updatedAt: string }
let storePullStream$: Subject<RxReplicationPullStreamItem<StoreDocType, StoreCheckpoint>> | null = null

export function resyncStores() {
  if (storePullStream$) {
    storePullStream$.next('RESYNC' as RxReplicationPullStreamItem<StoreDocType, StoreCheckpoint>)
  }
}

function startItemReplication(collection: RxCollection<ItemDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<ItemDocType, ItemCheckpoint>>()
  itemPullStream$ = pullStream$
  startPullReplication({
    collection,
    basePath: '/api/v1/sync/item',
    replicationIdentifier: 'grocerun-item-sync-v1',
    pullStream$,
    enablePush: true,
  })
}

function startListReplication(collection: RxCollection<ListDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<ListDocType, ListCheckpoint>>()
  listPullStream$ = pullStream$
  startPullReplication({
    collection,
    basePath: '/api/v1/sync/list',
    replicationIdentifier: 'grocerun-list-sync-v1',
    pullStream$,
  })
}

function startListItemReplication(collection: RxCollection<ListItemDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<ListItemDocType, ListItemCheckpoint>>()
  listItemPullStream$ = pullStream$
  startPullReplication({
    collection,
    basePath: '/api/v1/sync/listItem',
    replicationIdentifier: 'grocerun-list-item-sync-v1',
    pullStream$,
    enablePush: true,
  })
}

let householdReplicationState: RxReplicationState<HouseholdDocType, HouseholdCheckpoint> | null = null

function startHouseholdReplication(collection: RxCollection<HouseholdDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<HouseholdDocType, HouseholdCheckpoint>>()
  householdPullStream$ = pullStream$
  householdReplicationState = startPullReplication({
    collection,
    basePath: '/api/v1/sync/household',
    replicationIdentifier: 'grocerun-household-sync-v1',
    pullStream$,
  })
}

function startStoreReplication(collection: RxCollection<StoreDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<StoreDocType, StoreCheckpoint>>()
  storePullStream$ = pullStream$
  startPullReplication({
    collection,
    basePath: '/api/v1/sync/store',
    replicationIdentifier: 'grocerun-store-sync-v1',
    pullStream$,
  })
}

function startPullReplication<DocType, Checkpoint extends { id: string; updatedAt: string }>(args: {
  collection: RxCollection<DocType>
  basePath: string
  replicationIdentifier: string
  pullStream$: Subject<RxReplicationPullStreamItem<DocType, Checkpoint>>
  enablePush?: boolean
}) {
  const { collection, basePath, replicationIdentifier, pullStream$, enablePush = false } = args
  const collectionName = basePath.split('/').pop() ?? basePath

  registerPullStream(collectionName, pullStream$)

  const replicationState = replicateRxCollection<DocType, Checkpoint>({
    collection,
    replicationIdentifier,
    live: true,
    retryTime: 10_000,
    waitForLeadership: false,
    deletedField: '_deleted',
    pull: {
      batchSize: 50,
      async handler(checkpoint, batchSize) {
        const params = new URLSearchParams({ batchSize: String(batchSize) })
        if (checkpoint) {
          params.set('updatedAt', checkpoint.updatedAt)
          params.set('id', checkpoint.id)
        }

        const t0 = Date.now()
        const token = await getAccessToken()
        emitDiagnostic({ type: 'auth', hasToken: !!token, expiresAt: decodeJwtExp(token), userId: decodeJwtSub(token), at: t0 })

        let res = await fetch(`${basePath}/pull?${params}`, {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        // On 401, force-refresh the token and retry once so RxDB
        // doesn't loop with a stale cached token.
        if (res.status === 401) {
          const freshToken = await refreshAndGetToken()
          if (freshToken) {
            res = await fetch(`${basePath}/pull?${params}`, {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${freshToken}` },
            })
          }
        }

        if (!res.ok) {
          if (res.status === 401) clearInvalidAppAuth()
          emitDiagnostic({ type: 'pull', collection: collectionName, status: res.status, docCount: 0, checkpoint: null, durationMs: Date.now() - t0, error: `HTTP ${res.status}`, at: t0 })
          console.error(`[RxDB] pull failed: ${collectionName} HTTP ${res.status}`)
          throw new Error(`Sync pull failed: ${res.status}`)
        }

        const data = await res.json()
        emitDiagnostic({ type: 'pull', collection: collectionName, status: res.status, docCount: data.documents?.length ?? 0, checkpoint: data.checkpoint, durationMs: Date.now() - t0, at: t0 })
        return { documents: data.documents, checkpoint: data.checkpoint }
      },
      stream$: pullStream$.asObservable(),
    },
    ...(enablePush
      ? {
          push: {
            batchSize: 50,
            async handler(rows: RxReplicationWriteToMasterRow<DocType>[]) {
              const t0 = Date.now()
              const token = await getAccessToken()
              let res = await fetch(`${basePath}/push`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(rows),
              })

              // On 401, force-refresh the token and retry once.
              if (res.status === 401) {
                const freshToken = await refreshAndGetToken()
                if (freshToken) {
                  res = await fetch(`${basePath}/push`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${freshToken}`,
                    },
                    body: JSON.stringify(rows),
                  })
                }
              }

              if (!res.ok) {
                if (res.status === 401) clearInvalidAppAuth()
                emitDiagnostic({ type: 'push', collection: collectionName, status: res.status, rowCount: rows.length, conflictCount: 0, durationMs: Date.now() - t0, error: `HTTP ${res.status}`, at: t0 })
                throw new Error(`Sync push failed: ${res.status}`)
              }

              const conflicts = (await res.json()) as WithDeleted<DocType>[]
              emitDiagnostic({ type: 'push', collection: collectionName, status: res.status, rowCount: rows.length, conflictCount: conflicts.length, durationMs: Date.now() - t0, at: t0 })
              return conflicts
            },
          },
        }
      : {}),
  })

  replicationState.error$.subscribe((err) => {
    console.error(`[RxDB] replication error (${collectionName}):`, err)
  })

  return replicationState
}

function getSyncStreamUrl(): string {
  return '/api/v1/sync/stream'
}

/**
 * Opens an SSE connection to the sync stream endpoint and emits 'RESYNC'
 * into the provided Subject whenever the server signals a change.
 *
 * Reconnects automatically after 5 s if the connection drops.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RxDB pull stream generics are untyped
const sharedPullStreams = new Map<string, Subject<RxReplicationPullStreamItem<any, any>>>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RxDB pull stream generics are untyped
const RESYNC_SIGNAL = 'RESYNC' as RxReplicationPullStreamItem<any, any>

function registerPullStream<DocType, Checkpoint>(
  collectionName: string,
  subject: Subject<RxReplicationPullStreamItem<DocType, Checkpoint>>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RxDB pull stream generics are untyped
  sharedPullStreams.set(collectionName, subject as Subject<RxReplicationPullStreamItem<any, any>>)
  if (!visibilityListenerAdded) {
    visibilityListenerAdded = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Tab regained visibility: reopen SSE if it was closed, and
        // trigger an immediate resync to catch up on missed changes.
        emitDiagnostic({ type: 'resync', source: 'visibility', at: Date.now() })
        for (const subject of sharedPullStreams.values()) {
          subject.next(RESYNC_SIGNAL)
        }
        if (!sharedSyncStreamOpened) {
          sharedSyncStreamOpened = true
          void openSharedSyncStream(getSyncStreamUrl())
        }
      } else {
        // Tab hidden: close SSE to free server resources. Mobile browsers
        // will kill background connections anyway — closing proactively
        // avoids stale connections and watchdog reconnect loops fighting
        // the OS's background throttling.
        if (sharedSyncEventSource) {
          sharedSyncEventSource.close()
          sharedSyncEventSource = null
        }
        sharedSyncStreamOpened = false
        // Periodic resync keeps data fresh while SSE is down.
        startPeriodicResync()
      }
    })
  }
  if (!sharedSyncStreamOpened) {
    sharedSyncStreamOpened = true
    void openSharedSyncStream(getSyncStreamUrl())
  }
}

function resyncAll() {
  emitDiagnostic({ type: 'resync', source: 'periodic', at: Date.now() })
  for (const subject of sharedPullStreams.values()) {
    subject.next(RESYNC_SIGNAL)
  }
}

function startPeriodicResync() {
  if (periodicResyncTimer !== null) return
  periodicResyncTimer = setInterval(resyncAll, 5_000)
}

function stopPeriodicResync() {
  if (periodicResyncTimer !== null) {
    clearInterval(periodicResyncTimer)
    periodicResyncTimer = null
  }
}

async function openSharedSyncStream(url: string, forceRefresh = false) {
  const token = forceRefresh ? await refreshAndGetToken() : await getAccessToken()
  // EventSource doesn't support custom headers — token is appended as a
  // query param. The server only accepts query-token auth on SSE endpoints.
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  const src = new EventSource(`${url}?${params.toString()}`)
  sharedSyncEventSource = src

  emitDiagnostic({ type: 'sse', state: 'connecting', at: Date.now() })

  // Watchdog: if no SSE message (including heartbeats) arrives within 20s,
  // force-close and reconnect. The proxy may silently swallow the connection
  // without triggering onerror.
  let watchdog: ReturnType<typeof setTimeout> | null = null

  /** Shared recovery: resets state flags, starts periodic fallback resync,
   *  and schedules reconnection. Does NOT close the EventSource itself —
   *  callers are responsible for closing. */
  function recoverFromSseError() {
    emitDiagnostic({ type: 'sse', state: 'error', at: Date.now() })
    if (sharedSyncEventSource === src) {
      sharedSyncEventSource = null
    }
    sharedSyncStreamOpened = false
    // SSE down: start fallback periodic resync so clients don't go stale.
    startPeriodicResync()
    setTimeout(() => {
      if (!sharedSyncStreamOpened) {
        sharedSyncStreamOpened = true
        void openSharedSyncStream(url)
      }
    }, 5_000)
  }

  function resetWatchdog() {
    if (watchdog) clearTimeout(watchdog)
    watchdog = setTimeout(() => {
      console.warn('[RxDB] SSE watchdog: no message in 20s, forcing reconnect')
      recoverFromSseError()
      src.close()
    }, 20_000)
  }
  function clearWatchdog() {
    if (watchdog) {
      clearTimeout(watchdog)
      watchdog = null
    }
  }

  src.addEventListener('open', () => {
    resetWatchdog()
  })

  src.addEventListener('message', () => {
    resetWatchdog()
  })

  src.addEventListener('RESYNC', () => {
    resetWatchdog()
    emitDiagnostic({ type: 'resync', source: 'sse', at: Date.now() })
    for (const subject of sharedPullStreams.values()) {
      subject.next(RESYNC_SIGNAL)
    }
  })

  src.addEventListener('SYNC_CHANGED', (event) => {
    resetWatchdog()
    emitDiagnostic({ type: 'resync', source: 'sse', at: Date.now() })

    // Parse the collections array from the event payload.
    // Only resync the collections the server indicates changed.
    let collections: string[] | undefined
    try {
      const raw = JSON.parse((event as MessageEvent).data)
      if (raw && typeof raw === 'object' && Array.isArray(raw.collections)) {
        collections = raw.collections.filter((c: unknown): c is string => typeof c === 'string')
      }
    } catch {
      // Malformed payload — fall through to broadcast to all
    }

    if (collections && collections.length > 0) {
      const collectionSet = new Set(collections)
      for (const [name, subject] of sharedPullStreams) {
        if (collectionSet.has(name)) {
          subject.next(RESYNC_SIGNAL)
        }
      }
    } else {
      // Defensive fallback: if we can't parse collections, broadcast to all.
      for (const subject of sharedPullStreams.values()) {
        subject.next(RESYNC_SIGNAL)
      }
    }
  })

  src.addEventListener('HOUSEHOLD_REMOVED', (event) => {
    resetWatchdog()
    try {
      const data = JSON.parse((event as MessageEvent).data) as { householdId?: string }
      if (data.householdId) {
        void removeHouseholdSubtreeFromLocalDb(data.householdId)
      }
    } catch {
      // Ignore malformed payloads
    }
  })

  // SSE open = connection healthy: stop fallback timer.
  src.onopen = () => {
    emitDiagnostic({ type: 'sse', state: 'open', at: Date.now() })
    stopPeriodicResync()
  }

  src.onerror = () => {
    clearWatchdog()
    src.close()
    recoverFromSseError()
  }
}

export async function removeHouseholdSubtreeFromLocalDb(householdId: string) {
  const db = await getRxDb()
  const stores = await db.stores.find({ selector: { householdId: { $eq: householdId } } }).exec()
  const storeIds = stores.map((store) => store.id)

  if (storeIds.length > 0) {
    const [sections, items, lists] = await Promise.all([
      Promise.all(storeIds.map((storeId) => db.sections.find({ selector: { storeId: { $eq: storeId } } }).exec())).then((rows) => rows.flat()),
      Promise.all(storeIds.map((storeId) => db.items.find({ selector: { storeId: { $eq: storeId } } }).exec())).then((rows) => rows.flat()),
      Promise.all(storeIds.map((storeId) => db.lists.find({ selector: { storeId: { $eq: storeId } } }).exec())).then((rows) => rows.flat()),
    ])

    const listIds = lists.map((list) => list.id)
    const listItems = listIds.length > 0
      ? (await Promise.all(listIds.map((listId) => db.listItems.find({ selector: { listId: { $eq: listId } } }).exec()))).flat()
      : []

    // Use allSettled so one document removal failure does not abort the rest.
    // RxDB does not support cross-collection transactions, so a partial
    // failure leaves orphaned data — running the function again (idempotent
    // queries) will clean up the remainder.
    const results = await Promise.allSettled([
      ...listItems.filter((doc) => !doc.deleted).map((doc) => doc.remove()),
      ...lists.filter((doc) => !doc.deleted).map((doc) => doc.remove()),
      ...items.filter((doc) => !doc.deleted).map((doc) => doc.remove()),
      ...sections.filter((doc) => !doc.deleted).map((doc) => doc.remove()),
      ...stores.filter((doc) => !doc.deleted).map((doc) => doc.remove()),
    ])

    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (failures.length > 0) {
      console.error(
        `removeHouseholdSubtreeFromLocalDb: ${failures.length}/${results.length} document removals failed for household ${householdId}`,
        failures.map((f) => f.reason),
      )
    }
  }

  // Always attempt household removal even if subtree removal had failures.
  // Pause household replication first to prevent a concurrent pull from
  // updating the doc between fetch and remove (CONFLICT on stale revision).
  if (householdReplicationState) {
    await householdReplicationState.awaitInSync()
    await householdReplicationState.pause()
  }
  try {
    const household = await db.households.findOne(householdId).exec()
    if (household && !household.deleted) {
      await household.remove()
    }
  } catch (err) {
    console.error(`removeHouseholdSubtreeFromLocalDb: failed to remove household ${householdId}`, err)
  } finally {
    if (householdReplicationState) {
      await householdReplicationState.start()
    }
  }
}
