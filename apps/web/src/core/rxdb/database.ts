/**
 * RxDB database singleton for Phase 4 local-first architecture.
 *
 * - One database per browser session, created lazily on first use.
 * - Uses Dexie (IndexedDB) as the storage adapter.
 * - Wires Section replication against /api/v1/sync/section/{pull,push,stream}.
 * - Auth tokens are fetched via the existing auth-token module.
 *
 * Call `getRxDb()` to get the initialised database. It is safe to call from
 * multiple React components — they all get the same promise-cached instance.
 */

import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin, RxReplicationPullStreamItem, RxStorage, removeRxDatabase, RxReplicationWriteToMasterRow, WithDeleted } from 'rxdb'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { Subject } from 'rxjs'
import { getToken, refreshToken as forceTokenRefresh } from '../lib/auth-token'
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
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin)
}

/**
 * In dev-mode RxDB requires a schema validator wrapping the storage.
 * In production we skip validation for performance.
 */
function getStorage(): RxStorage<any, any> {
  const base = getRxStorageDexie()
  if (process.env.NODE_ENV === 'development') {
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
const RXDB_NAME = 'grocerun-v8'
let sharedSyncStreamOpened = false
let periodicResyncTimer: ReturnType<typeof setInterval> | null = null
let visibilityListenerAdded = false
let sseHealthy = false
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
    sharedSyncEventSource = null
  }
  stopPeriodicResync()
  sharedSyncStreamOpened = false
  sseHealthy = false
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
    ignoreDuplicate: process.env.NODE_ENV === 'development',
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

  // Start replication — fire and forget. The calling code subscribes to the
  // collection directly; replication errors are retried automatically.
  startSectionReplication(db.sections)
  startItemReplication(db.items)
  startListReplication(db.lists)
  startListItemReplication(db.listItems)
  startHouseholdReplication(db.households)
  startStoreReplication(db.stores)

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

function startHouseholdReplication(collection: RxCollection<HouseholdDocType>) {
  const pullStream$ = new Subject<RxReplicationPullStreamItem<HouseholdDocType, HouseholdCheckpoint>>()
  householdPullStream$ = pullStream$
  startPullReplication({
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

  registerPullStream(pullStream$)

  replicateRxCollection<DocType, Checkpoint>({
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
        const token = await getToken()
        emitDiagnostic({ type: 'auth', hasToken: !!token, expiresAt: decodeJwtExp(token), userId: decodeJwtSub(token), at: t0 })

        let res = await fetch(`${basePath}/pull?${params}`, {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        // On 401, force-refresh the token and retry once so RxDB
        // doesn't loop with a stale cached token.
        if (res.status === 401) {
          const freshToken = await forceTokenRefresh()
          if (freshToken) {
            res = await fetch(`${basePath}/pull?${params}`, {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${freshToken}` },
            })
          }
        }

        if (!res.ok) {
          emitDiagnostic({ type: 'pull', collection: collectionName, status: res.status, docCount: 0, checkpoint: null, durationMs: Date.now() - t0, error: `HTTP ${res.status}`, at: t0 })
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
              const token = await getToken()
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
                const freshToken = await forceTokenRefresh()
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
}

/**
 * Returns the direct SSE stream URL, bypassing Next.js rewrite buffering.
 *
 * EventSource connects to the NestJS API directly so that streaming
 * chunks are never buffered or dropped by the dev proxy. Normal REST
 * pull/push calls still use the Next.js rewrite path (/api/v1/...).
 */
function getSyncStreamUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api/v1')
  return `${baseUrl.replace(/\/$/, '')}/sync/stream`
}

/**
 * Opens an SSE connection to the sync stream endpoint and emits 'RESYNC'
 * into the provided Subject whenever the server signals a change.
 *
 * Reconnects automatically after 5 s if the connection drops.
 */
const sharedPullStreams = new Set<Subject<RxReplicationPullStreamItem<any, any>>>()

function registerPullStream<DocType, Checkpoint>(
  subject: Subject<RxReplicationPullStreamItem<DocType, Checkpoint>>,
) {
  sharedPullStreams.add(subject as Subject<RxReplicationPullStreamItem<any, any>>)
  if (!visibilityListenerAdded) {
    visibilityListenerAdded = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        emitDiagnostic({ type: 'resync', source: 'visibility', at: Date.now() })
        for (const stream of sharedPullStreams) {
          stream.next('RESYNC' as RxReplicationPullStreamItem<any, any>)
        }
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
  for (const stream of sharedPullStreams) {
    stream.next('RESYNC' as RxReplicationPullStreamItem<any, any>)
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
  const token = forceRefresh ? await forceTokenRefresh() : await getToken()
  // EventSource doesn't support custom headers — token is appended as a
  // query param. The Next.js rewrite proxies /api/v1 to the NestJS server,
  // which then validates it via the AuthGuard.
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  const src = new EventSource(`${url}?${params.toString()}`)
  sharedSyncEventSource = src

  emitDiagnostic({ type: 'sse', state: 'connecting', at: Date.now() })

  src.addEventListener('RESYNC', () => {
    emitDiagnostic({ type: 'resync', source: 'sse', at: Date.now() })
    for (const subject of sharedPullStreams) {
      subject.next('RESYNC' as RxReplicationPullStreamItem<any, any>)
    }
  })

  src.addEventListener('SYNC_CHANGED', () => {
    emitDiagnostic({ type: 'resync', source: 'sse', at: Date.now() })
    for (const subject of sharedPullStreams) {
      subject.next('RESYNC' as RxReplicationPullStreamItem<any, any>)
    }
  })

  src.addEventListener('HOUSEHOLD_REMOVED', (event) => {
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
    sseHealthy = true
    emitDiagnostic({ type: 'sse', state: 'open', at: Date.now() })
    stopPeriodicResync()
  }

  src.onerror = () => {
    src.close()
    sseHealthy = false
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
        void openSharedSyncStream(url, true /* force token refresh on reconnect */)
      }
    }, 5_000)
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

    await Promise.all([
      ...listItems.map((doc) => doc.remove()),
      ...lists.map((doc) => doc.remove()),
      ...items.map((doc) => doc.remove()),
      ...sections.map((doc) => doc.remove()),
      ...stores.map((doc) => doc.remove()),
    ])
  }

  const household = await db.households.findOne(householdId).exec()
  if (household) {
    await household.remove()
  }
}
