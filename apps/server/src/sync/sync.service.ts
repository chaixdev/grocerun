import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { pullSections, pushSections } from './collections/section-sync';
import { pullItems, pushItems } from './collections/item-sync';
import { pullLists, pushLists } from './collections/list-sync';
import { pullListItems, pushListItems } from './collections/list-item-sync';
import { pullStores, pushStores } from './collections/store-sync';
import { pullHouseholds, pushHouseholds } from './collections/household-sync';
import { SyncDeps } from './sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
} from './sync.types';

// Supported sync collections. Extend this union as Phase 4b/4c add more.
export type SyncCollection = 'section' | 'item' | 'list' | 'listItem' | 'store' | 'household';

const SUPPORTED_COLLECTIONS: readonly SyncCollection[] = ['section', 'item', 'list', 'listItem', 'store', 'household'];

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  private get deps(): SyncDeps {
    return {
      prisma: this.prisma,
      getAccessibleStoreIds: (userId) => this.getAccessibleStoreIds(userId),
      getAccessibleHouseholdIds: (userId) => this.getAccessibleHouseholdIds(userId),
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
  ): Promise<PushResponse> {
    this.assertCollection(collection);

    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    switch (collection) {
      case 'section':
        return pushSections(this.deps, rows, userId);
      case 'item':
        return pushItems(this.deps, rows, userId);
      case 'list':
        return pushLists(this.deps, rows, userId);
      case 'listItem':
        return pushListItems(this.deps, rows, userId);
      case 'store':
        return pushStores(this.deps, rows, userId);
      case 'household':
        return pushHouseholds(this.deps, rows, userId);
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
