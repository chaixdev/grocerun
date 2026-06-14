import { ForbiddenException } from '@nestjs/common';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullHouseholds(
  deps: SyncDeps,
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

  const rows = await deps.prisma.household.findMany({
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

export async function pushHouseholds(
  deps: SyncDeps,
  rows: PushRow[],
  userId: string,
): Promise<PushResponse> {
  const conflicts: SyncDocument[] = [];

  for (const row of rows) {
    const { newDocumentState, assumedMasterState } = row;
    const id = newDocumentState.id as string;
    const current = await deps.prisma.household.findUnique({ where: { id } });

    if (current) {
      try {
        await deps.verifyHouseholdAccess(current.id, userId);
      } catch (err) {
        if (err instanceof ForbiddenException) {
          // User no longer has access to this household (e.g. was removed).
          // Return a tombstone conflict so RxDB stops retrying this row.
          conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
          continue;
        }
        throw err;
      }
      if (assumedMasterState != null) {
        const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
        const actualAt = current.updatedAt.getTime();
        if (assumedAt !== actualAt) {
          conflicts.push(householdToSyncDoc(current));
          continue;
        }
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        const now = new Date();
        await deps.prisma.$transaction(async (tx) => {
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
      await deps.prisma.household.update({
        where: { id },
        data: {
          name: newDocumentState.name as string,
          deleted: false,
          deletedAt: null,
        },
      });
    } else {
      await deps.prisma.household.create({
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

function householdToSyncDoc(row: {
  id: string;
  name: string;
  ownerId: string | null;
  updatedAt: Date;
  deleted: boolean;
}): SyncDocument {
  return {
    id: row.id,
    name: row.name,
    ...(row.ownerId ? { ownerId: row.ownerId } : {}),
    updatedAt: row.updatedAt.toISOString(),
    _deleted: row.deleted,
  };
}
