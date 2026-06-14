import {
  Injectable,
  ForbiddenException,
  BadRequestException,
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
  SyncDocument,
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
  // Section: pull implementation
  // ---------------------------------------------------------------------------

  private async pullSections(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    // Resolve which storeIds this user has access to. We return sections across
    // all stores in all households the user belongs to — the client filters locally.
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId);

    if (accessibleStoreIds.length === 0) {
      return { documents: [], checkpoint: null };
    }

    // Cursor-based pagination: (updatedAt > cp.updatedAt) OR (updatedAt = cp.updatedAt AND id > cp.id)
    // This matches the composite index @@index([updatedAt, id]) exactly.
    const where = checkpoint
      ? {
          storeId: { in: accessibleStoreIds },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : { storeId: { in: accessibleStoreIds } };

    const rows = await this.prisma.section.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      order: row.order,
      storeId: row.storeId,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // Section: push implementation
  // ---------------------------------------------------------------------------

  private async pushSections(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;

      // Verify the storeId in the document is accessible to this user
      const storeId = newDocumentState.storeId as string;
      if (!storeId) {
        throw new BadRequestException(`Missing storeId in document ${id}`);
      }

      await this.verifyStoreAccess(storeId, userId);

      // Fetch current server state
      const current = await this.prisma.section.findUnique({
        where: { id },
      });

      if (current) {
        // Conflict check: compare assumedMasterState.updatedAt with actual DB updatedAt
        if (assumedMasterState !== null) {
          const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
          const actualAt = current.updatedAt.getTime();

          if (assumedAt !== actualAt) {
            // Conflict — send back the current master state
            conflicts.push(this.sectionToSyncDoc(current));
            continue;
          }
        }
        // No conflict (or client correctly says assumedMasterState = null for existing row
        // which we treat as a force-write — this shouldn't normally happen but is safe to handle)
      }

      // Apply the write
      if (newDocumentState._deleted) {
        // Soft-delete: replicate cascade (null out sectionId on items)
        if (current && !current.deleted) {
          await this.prisma.$transaction(async (tx) => {
            await tx.item.updateMany({
              where: { sectionId: id, deleted: false },
              data: { sectionId: null },
            });
            await tx.section.update({
              where: { id },
              data: { deleted: true, deletedAt: new Date() },
            });
          });
        }
        // Already deleted — no-op, no conflict
      } else if (current) {
        // Update existing
        await this.prisma.section.update({
          where: { id },
          data: {
            name: newDocumentState.name as string,
            order: newDocumentState.order as number,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        // Insert new
        await this.prisma.section.create({
          data: {
            id,
            name: newDocumentState.name as string,
            order: (newDocumentState.order as number) ?? 0,
            storeId,
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Item: pull implementation
  // ---------------------------------------------------------------------------

  private async pullItems(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId);

    if (accessibleStoreIds.length === 0) {
      return { documents: [], checkpoint: null };
    }

    const where = checkpoint
      ? {
          storeId: { in: accessibleStoreIds },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : { storeId: { in: accessibleStoreIds } };

    const rows = await this.prisma.item.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      storeId: row.storeId,
      ...(row.sectionId ? { sectionId: row.sectionId } : {}),
      ...(row.defaultUnit ? { defaultUnit: row.defaultUnit } : {}),
      purchaseCount: row.purchaseCount,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // Item: push implementation
  // ---------------------------------------------------------------------------

  private async pushItems(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;

      const storeId = newDocumentState.storeId as string;
      if (!storeId) {
        throw new BadRequestException(`Missing storeId in document ${id}`);
      }

      await this.verifyStoreAccess(storeId, userId);

      const current = await this.prisma.item.findUnique({
        where: { id },
      });

      if (current) {
        if (assumedMasterState !== null) {
          const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
          const actualAt = current.updatedAt.getTime();

          if (assumedAt !== actualAt) {
            conflicts.push(this.itemToSyncDoc(current));
            continue;
          }
        }
      }

      if (newDocumentState._deleted) {
        if (current && !current.deleted) {
          await this.prisma.item.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() },
          });
        }
      } else if (current) {
        await this.prisma.item.update({
          where: { id },
          data: {
            name: newDocumentState.name as string,
            sectionId: newDocumentState.sectionId as string | null,
            defaultUnit: newDocumentState.defaultUnit as string | null,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.item.create({
          data: {
            id,
            name: newDocumentState.name as string,
            storeId,
            sectionId: newDocumentState.sectionId as string | null,
            defaultUnit: newDocumentState.defaultUnit as string | null,
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // List: pull implementation
  // ---------------------------------------------------------------------------

  private async pullLists(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId);

    if (accessibleStoreIds.length === 0) {
      return { documents: [], checkpoint: null };
    }

    const where = checkpoint
      ? {
          storeId: { in: accessibleStoreIds },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : { storeId: { in: accessibleStoreIds } };

    const rows = await this.prisma.list.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      storeId: row.storeId,
      status: row.status,
      ...(row.assignedTo ? { assignedTo: row.assignedTo } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // List: push implementation
  // ---------------------------------------------------------------------------

  private async pushLists(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;
      const storeId = newDocumentState.storeId as string;

      if (!storeId) {
        throw new BadRequestException(`Missing storeId in document ${id}`);
      }

      await this.verifyStoreAccess(storeId, userId);

      const current = await this.prisma.list.findUnique({ where: { id } });

      if (current && assumedMasterState !== null) {
        const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
        const actualAt = current.updatedAt.getTime();
        if (assumedAt !== actualAt) {
          conflicts.push(this.listToSyncDoc(current));
          continue;
        }
      }

      if (newDocumentState._deleted) {
        if (current && !current.deleted) {
          await this.prisma.list.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() },
          });
        }
      } else if (current) {
        await this.prisma.list.update({
          where: { id },
          data: {
            name: newDocumentState.name as string,
            status: newDocumentState.status as any,
            assignedTo: (newDocumentState.assignedTo as string | undefined) ?? null,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.list.create({
          data: {
            id,
            name: (newDocumentState.name as string) || 'Shopping List',
            storeId,
            status: (newDocumentState.status as any) || 'PLANNING',
            assignedTo: (newDocumentState.assignedTo as string | undefined) ?? null,
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // ListItem: pull implementation
  // ---------------------------------------------------------------------------

  private async pullListItems(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId);

    if (accessibleStoreIds.length === 0) {
      return { documents: [], checkpoint: null };
    }

    const where = checkpoint
      ? {
          list: { storeId: { in: accessibleStoreIds } },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : { list: { storeId: { in: accessibleStoreIds } } };

    const rows = await this.prisma.listItem.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      listId: row.listId,
      itemId: row.itemId,
      isChecked: row.isChecked,
      quantity: row.quantity,
      createdAt: row.createdAt.toISOString(),
      ...(row.unit ? { unit: row.unit } : {}),
      ...(row.purchasedQuantity !== null ? { purchasedQuantity: row.purchasedQuantity } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // ListItem: push implementation
  // ---------------------------------------------------------------------------

  private async pushListItems(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;
      const listId = newDocumentState.listId as string;
      const itemId = newDocumentState.itemId as string;

      if (!listId || !itemId) {
        throw new BadRequestException(`Missing listId or itemId in document ${id}`);
      }

      const list = await this.prisma.list.findFirst({
        where: { id: listId, deleted: false },
        select: { storeId: true },
      });

      if (!list) {
        throw new ForbiddenException(`No access to list ${listId}`);
      }

      await this.verifyStoreAccess(list.storeId, userId);

      const current = await this.prisma.listItem.findUnique({ where: { id } });

      if (current && assumedMasterState !== null) {
        const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
        const actualAt = current.updatedAt.getTime();
        if (assumedAt !== actualAt) {
          conflicts.push(this.listItemToSyncDoc(current));
          continue;
        }
      }

      if (newDocumentState._deleted) {
        if (current && !current.deleted) {
          await this.prisma.listItem.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() },
          });
        }
      } else if (current) {
        await this.prisma.listItem.update({
          where: { id },
          data: {
            isChecked: newDocumentState.isChecked as boolean,
            quantity: newDocumentState.quantity as number,
            unit: (newDocumentState.unit as string | undefined) ?? null,
            purchasedQuantity:
              (newDocumentState.purchasedQuantity as number | undefined) ?? null,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.listItem.create({
          data: {
            id,
            listId,
            itemId,
            isChecked: (newDocumentState.isChecked as boolean) ?? false,
            quantity: (newDocumentState.quantity as number) ?? 1,
            unit: (newDocumentState.unit as string | undefined) ?? null,
            purchasedQuantity:
              (newDocumentState.purchasedQuantity as number | undefined) ?? null,
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Store: pull implementation
  // ---------------------------------------------------------------------------

  private async pullStores(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    const accessibleHouseholdIds = await this.getAccessibleHouseholdIds(userId);

    if (accessibleHouseholdIds.length === 0) {
      return { documents: [], checkpoint: null };
    }

    const where = checkpoint
      ? {
          householdId: { in: accessibleHouseholdIds },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : { householdId: { in: accessibleHouseholdIds } };

    const rows = await this.prisma.store.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      householdId: row.householdId,
      ...(row.location ? { location: row.location } : {}),
      ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // Store: push implementation
  // ---------------------------------------------------------------------------

  private async pushStores(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;
      const householdId = newDocumentState.householdId as string;

      if (!householdId) {
        throw new BadRequestException(`Missing householdId in document ${id}`);
      }

      await this.verifyHouseholdAccess(householdId, userId);

      const current = await this.prisma.store.findUnique({ where: { id } });

      if (current && assumedMasterState !== null) {
        const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
        const actualAt = current.updatedAt.getTime();
        if (assumedAt !== actualAt) {
          conflicts.push(this.storeToSyncDoc(current));
          continue;
        }
      }

      if (newDocumentState._deleted) {
        if (current && !current.deleted) {
          const now = new Date();
          await this.prisma.$transaction(async (tx) => {
            const lists = await tx.list.findMany({
              where: { storeId: id, deleted: false },
              select: { id: true },
            });
            const listIds = lists.map((l) => l.id);
            if (listIds.length > 0) {
              await tx.listItem.updateMany({
                where: { listId: { in: listIds }, deleted: false },
                data: { deleted: true, deletedAt: now },
              });
            }
            await tx.list.updateMany({
              where: { storeId: id, deleted: false },
              data: { deleted: true, deletedAt: now },
            });
            await tx.item.updateMany({
              where: { storeId: id, deleted: false },
              data: { deleted: true, deletedAt: now },
            });
            await tx.section.updateMany({
              where: { storeId: id, deleted: false },
              data: { deleted: true, deletedAt: now },
            });
            await tx.store.update({
              where: { id },
              data: { deleted: true, deletedAt: now },
            });
          });
        }
      } else if (current) {
        await this.prisma.store.update({
          where: { id },
          data: {
            name: newDocumentState.name as string,
            location: (newDocumentState.location as string | undefined) ?? null,
            imageUrl: (newDocumentState.imageUrl as string | undefined) ?? null,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.store.create({
          data: {
            id,
            name: newDocumentState.name as string,
            householdId,
            location: (newDocumentState.location as string | undefined) ?? null,
            imageUrl: (newDocumentState.imageUrl as string | undefined) ?? null,
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Household: pull implementation
  // ---------------------------------------------------------------------------

  private async pullHouseholds(
    checkpoint: SyncCheckpoint | null,
    limit: number,
    userId: string,
  ): Promise<PullResponse> {
    const where = checkpoint
      ? {
          deleted: false,
          users: { some: { id: userId } },
          OR: [
            { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
            {
              updatedAt: { equals: new Date(checkpoint.updatedAt) },
              id: { gt: checkpoint.id },
            },
          ],
        }
      : {
          deleted: false,
          users: { some: { id: userId } },
        };

    const rows = await this.prisma.household.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
      include: { _count: { select: { users: true } } },
    });

    const documents: SyncDocument[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      ...(row.ownerId ? { ownerId: row.ownerId } : {}),
      memberCount: row._count.users,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }));

    const newCheckpoint: SyncCheckpoint | null =
      rows.length > 0
        ? {
            id: rows[rows.length - 1].id,
            updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
          }
        : checkpoint;

    return { documents, checkpoint: newCheckpoint };
  }

  // ---------------------------------------------------------------------------
  // Household: push implementation
  // ---------------------------------------------------------------------------

  private async pushHouseholds(
    rows: PushRow[],
    userId: string,
  ): Promise<PushResponse> {
    const conflicts: SyncDocument[] = [];

    for (const row of rows) {
      const { newDocumentState, assumedMasterState } = row;
      const id = newDocumentState.id as string;
      const current = await this.prisma.household.findUnique({ where: { id } });

      if (current) {
        await this.verifyHouseholdAccess(current.id, userId);
        if (assumedMasterState !== null) {
          const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
          const actualAt = current.updatedAt.getTime();
          if (assumedAt !== actualAt) {
            conflicts.push(this.householdToSyncDoc(current));
            continue;
          }
        }
      }

      if (newDocumentState._deleted) {
        if (current && !current.deleted) {
          const now = new Date();
          await this.prisma.$transaction(async (tx) => {
            const stores = await tx.store.findMany({
              where: { householdId: id, deleted: false },
              select: { id: true },
            });
            const storeIds = stores.map((s) => s.id);
            if (storeIds.length > 0) {
              const lists = await tx.list.findMany({
                where: { storeId: { in: storeIds }, deleted: false },
                select: { id: true },
              });
              const listIds = lists.map((l) => l.id);
              if (listIds.length > 0) {
                await tx.listItem.updateMany({
                  where: { listId: { in: listIds }, deleted: false },
                  data: { deleted: true, deletedAt: now },
                });
              }
              await tx.list.updateMany({
                where: { storeId: { in: storeIds }, deleted: false },
                data: { deleted: true, deletedAt: now },
              });
              await tx.item.updateMany({
                where: { storeId: { in: storeIds }, deleted: false },
                data: { deleted: true, deletedAt: now },
              });
              await tx.section.updateMany({
                where: { storeId: { in: storeIds }, deleted: false },
                data: { deleted: true, deletedAt: now },
              });
              await tx.store.updateMany({
                where: { id: { in: storeIds } },
                data: { deleted: true, deletedAt: now },
              });
            }
            await tx.household.update({
              where: { id },
              data: { deleted: true, deletedAt: now },
            });
          });
        }
      } else if (current) {
        await this.prisma.household.update({
          where: { id },
          data: {
            name: newDocumentState.name as string,
            deleted: false,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.household.create({
          data: {
            id,
            name: newDocumentState.name as string,
            ownerId: userId,
            users: { connect: { id: userId } },
          },
        });
      }
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private sectionToSyncDoc(row: {
    id: string;
    name: string;
    order: number;
    storeId: string;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      name: row.name,
      order: row.order,
      storeId: row.storeId,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
  }

  private itemToSyncDoc(row: {
    id: string;
    name: string;
    storeId: string;
    sectionId: string | null;
    defaultUnit: string | null;
    purchaseCount: number;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      name: row.name,
      storeId: row.storeId,
      ...(row.sectionId ? { sectionId: row.sectionId } : {}),
      ...(row.defaultUnit ? { defaultUnit: row.defaultUnit } : {}),
      purchaseCount: row.purchaseCount,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
  }

  private listToSyncDoc(row: {
    id: string;
    name: string;
    storeId: string;
    status: string;
    assignedTo: string | null;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      name: row.name,
      storeId: row.storeId,
      status: row.status,
      ...(row.assignedTo ? { assignedTo: row.assignedTo } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
  }

  private listItemToSyncDoc(row: {
    id: string;
    listId: string;
    itemId: string;
    isChecked: boolean;
    quantity: number;
    createdAt: Date;
    unit: string | null;
    purchasedQuantity: number | null;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      listId: row.listId,
      itemId: row.itemId,
      isChecked: row.isChecked,
      quantity: row.quantity,
      createdAt: row.createdAt.toISOString(),
      ...(row.unit ? { unit: row.unit } : {}),
      ...(row.purchasedQuantity !== null ? { purchasedQuantity: row.purchasedQuantity } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
  }

  private storeToSyncDoc(row: {
    id: string;
    name: string;
    householdId: string;
    location: string | null;
    imageUrl: string | null;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      name: row.name,
      householdId: row.householdId,
      ...(row.location ? { location: row.location } : {}),
      ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
  }

  private householdToSyncDoc(row: {
    id: string;
    name: string;
    ownerId: string | null;
    memberCount?: number;
    updatedAt: Date;
    deleted: boolean;
  }): SyncDocument {
    return {
      id: row.id,
      name: row.name,
      ...(row.ownerId ? { ownerId: row.ownerId } : {}),
      ...(row.memberCount !== undefined ? { memberCount: row.memberCount } : {}),
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    };
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
