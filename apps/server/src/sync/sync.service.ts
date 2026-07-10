import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { pullSections } from './collections/section-sync';
import { pullItems, pushItems } from './collections/item-sync';
import { pullLists } from './collections/list-sync';
import { pullListItems, pushListItems } from './collections/list-item-sync';
import { pullStores } from './collections/store-sync';
import { pullHouseholds } from './collections/household-sync';
import { SyncDeps } from './sync-deps';
import { TOMBSTONE_WINDOW_MS } from './sync-helpers';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
} from './sync.types';

export type SyncCollection = 'section' | 'item' | 'list' | 'listItem' | 'store' | 'household';

const SUPPORTED_COLLECTIONS: readonly SyncCollection[] = ['section', 'item', 'list', 'listItem', 'store', 'household'];

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;

@Injectable()
export class SyncService {
  /** Per-request memo cache for access queries, cleared at the start of each pull/push. */
  private accessCache = new Map<string, Promise<string[]>>();

  constructor(private prisma: PrismaService) {}

  private get deps(): SyncDeps {
    return {
      prisma: this.prisma,
      getAccessibleStoreIds: (userId) => this.getAccessibleStoreIds(userId),
      getAccessibleHouseholdIds: (userId) => this.getAccessibleHouseholdIds(userId),
      getAccessibleStoreIdsForSync: (userId) => {
        const key = `storeIdsForSync:${userId}`;
        if (!this.accessCache.has(key)) {
          this.accessCache.set(key, this.getAccessibleStoreIdsForSync(userId));
        }
        return this.accessCache.get(key)!;
      },
      getAccessibleHouseholdIdsForSync: (userId) => {
        const key = `householdIdsForSync:${userId}`;
        if (!this.accessCache.has(key)) {
          this.accessCache.set(key, this.getAccessibleHouseholdIdsForSync(userId));
        }
        return this.accessCache.get(key)!;
      },
      verifyStoreAccess: (storeId, userId) => this.verifyStoreAccess(storeId, userId),
      verifyHouseholdAccess: (householdId, userId) => this.verifyHouseholdAccess(householdId, userId),
    };
  }

  // ---------------------------------------------------------------------------
  // Pull
  // ---------------------------------------------------------------------------

  async pull(
    collection: SyncCollection,
    checkpoint: SyncCheckpoint | null,
    batchSize: number,
    userId: string,
  ): Promise<PullResponse> {
    this.accessCache.clear();
    this.assertCollection(collection);
    const limit = Math.min(batchSize || DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE);

    switch (collection) {
      case 'section':
        return pullSections(this.deps, checkpoint, limit, userId);
      case 'item':
        return pullItems(this.deps, checkpoint, limit, userId);
      case 'list':
        return pullLists(this.deps, checkpoint, limit, userId);
      case 'listItem':
        return pullListItems(this.deps, checkpoint, limit, userId);
      case 'store':
        return pullStores(this.deps, checkpoint, limit, userId);
      case 'household':
        return pullHouseholds(this.deps, checkpoint, limit, userId);
    }
  }

  // ---------------------------------------------------------------------------
  // Push
  // ---------------------------------------------------------------------------

  async push(
    collection: SyncCollection,
    rows: PushRow[],
    userId: string,
    shoppingLockId?: string,
  ): Promise<PushResponse> {
    this.accessCache.clear();
    this.assertCollection(collection);

    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    switch (collection) {
      // ── Local-first collections (active shopping) ──────────────────
      case 'item':
        return pushItems(this.deps, rows, userId);
      case 'listItem':
        return pushListItems(this.deps, rows, userId, shoppingLockId ?? userId);

      // ── Server-authoritative collections (no local-first writes) ───
      // All mutations for section, list, store, and household go through
      // REST endpoints. The client does not push these collections.
      // Returning [] tells RxDB there are no conflicts (the push is a
      // no-op — local writes to these types are not supported).
      case 'section':
      case 'list':
      case 'store':
      case 'household':
        return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve all household member userIds affected by the given push rows.
   * Used by the controller to notify all active sessions, not just the pusher.
   */
  async getHouseholdMemberIds(collection: SyncCollection, rows: PushRow[]): Promise<string[]> {
    if (rows.length === 0) return [];

    let householdIds: string[] = [];

    if (collection === 'household') {
      householdIds = rows.map((r) => r.newDocumentState.id as string);
    } else if (collection === 'store') {
      householdIds = rows
        .map((r) => r.newDocumentState.householdId as string)
        .filter(Boolean);
    } else if (collection === 'item' || collection === 'section' || collection === 'list') {
      const storeIds = [...new Set(rows.map((r) => r.newDocumentState.storeId as string).filter(Boolean))];
      if (storeIds.length === 0) return [];
      const stores = await this.prisma.store.findMany({
        where: { id: { in: storeIds } },
        select: { householdId: true },
      });
      householdIds = stores.map((s) => s.householdId);
    } else if (collection === 'listItem') {
      const listIds = [...new Set(rows.map((r) => r.newDocumentState.listId as string).filter(Boolean))];
      if (listIds.length === 0) return [];
      const lists = await this.prisma.list.findMany({
        where: { id: { in: listIds } },
        select: { store: { select: { householdId: true } } },
      });
      householdIds = lists.map((l) => l.store.householdId);
    }

    const uniqueHouseholdIds = [...new Set(householdIds)];
    if (uniqueHouseholdIds.length === 0) return [];

    const households = await this.prisma.household.findMany({
      where: { id: { in: uniqueHouseholdIds } },
      select: { users: { select: { id: true } } },
    });

    const userIds = households.flatMap((h) => h.users.map((u) => u.id));
    return [...new Set(userIds)];
  }

  private async getAccessibleStoreIds(userId: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: {
        deleted: false,
        household: {
          deleted: false,
          users: { some: { id: userId } },
        },
      },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  private async getAccessibleHouseholdIds(userId: string): Promise<string[]> {
    const households = await this.prisma.household.findMany({
      where: {
        deleted: false,
        users: { some: { id: userId } },
      },
      select: { id: true },
    });
    return households.map((h) => h.id);
  }

  // Sync-visibility variants that include recently-deleted parents so
  // cascaded-delete child tombstones remain reachable during pull.
  // Tombstones older than TOMBSTONE_WINDOW_MS are presumed settled and excluded.

  private async getAccessibleStoreIdsForSync(userId: string): Promise<string[]> {
    const windowStart = new Date(Date.now() - TOMBSTONE_WINDOW_MS);
    const stores = await this.prisma.store.findMany({
      where: {
        household: { users: { some: { id: userId } } },
        OR: [{ deleted: false }, { deletedAt: { gte: windowStart } }],
      },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  private async getAccessibleHouseholdIdsForSync(userId: string): Promise<string[]> {
    const windowStart = new Date(Date.now() - TOMBSTONE_WINDOW_MS);
    const households = await this.prisma.household.findMany({
      where: {
        users: { some: { id: userId } },
        OR: [{ deleted: false }, { deletedAt: { gte: windowStart } }],
      },
      select: { id: true },
    });
    return households.map((h) => h.id);
  }

  /**
   * Sync access checks intentionally throw ForbiddenException for both
   * "not found" and "access denied" — a single opaque error avoids
   * leaking entity existence information through the sync protocol.
   *
   * REST endpoints (AccessService) distinguish 404/403 for UX, but
   * sync clients should receive a uniform rejection.
   */
  private async verifyHouseholdAccess(householdId: string, userId: string): Promise<void> {
    const household = await this.prisma.household.findFirst({
      where: {
        id: householdId,
        deleted: false,
        users: { some: { id: userId } },
      },
      select: { id: true },
    });

    if (!household) {
      throw new ForbiddenException(`No access to household ${householdId}`);
    }
  }

  private async verifyStoreAccess(storeId: string, userId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deleted: false,
        household: {
          deleted: false,
          users: { some: { id: userId } },
        },
      },
      select: { id: true },
    });

    if (!store) {
      throw new ForbiddenException(`No access to store ${storeId}`);
    }
  }

  private assertCollection(collection: string): asserts collection is SyncCollection {
    if (!SUPPORTED_COLLECTIONS.includes(collection as SyncCollection)) {
      throw new NotFoundException(`Unknown sync collection: ${collection}`);
    }
  }
}
