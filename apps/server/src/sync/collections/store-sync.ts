import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullStores(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const accessibleHouseholdIds = await deps.getAccessibleHouseholdIds(userId);

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

  const rows = await deps.prisma.store.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
  });

  const documents: SyncDocument[] = rows.map(storeToSyncDoc);

  const newCheckpoint: SyncCheckpoint | null =
    rows.length > 0
      ? {
          id: rows[rows.length - 1].id,
          updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
        }
      : checkpoint;

  return { documents, checkpoint: newCheckpoint };
}

export async function pushStores(
  deps: SyncDeps,
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

    try {
      await deps.verifyHouseholdAccess(householdId, userId);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        // User no longer has access to this household (e.g. left it).
        // Return a tombstone conflict so RxDB stops retrying this row.
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
      throw err;
    }

    const current = await deps.prisma.store.findUnique({ where: { id } });

    if (current && assumedMasterState != null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(storeToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        const now = new Date();
        await deps.prisma.$transaction(async (tx) => {
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
      await deps.prisma.store.update({
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
      await deps.prisma.store.create({
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

function storeToSyncDoc(row: {
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
