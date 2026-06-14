import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullItems(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const accessibleStoreIds = await deps.getAccessibleStoreIds(userId);

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

  const rows = await deps.prisma.item.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
  });

  const documents: SyncDocument[] = rows.map(itemToSyncDoc);

  const newCheckpoint: SyncCheckpoint | null =
    rows.length > 0
      ? {
          id: rows[rows.length - 1].id,
          updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
        }
      : checkpoint;

  return { documents, checkpoint: newCheckpoint };
}

export async function pushItems(
  deps: SyncDeps,
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

    try {
      await deps.verifyStoreAccess(storeId, userId);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        // User no longer has access to this store (e.g. left the household).
        // Return a tombstone conflict so RxDB stops retrying this row.
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
      throw err;
    }

    const current = await deps.prisma.item.findUnique({ where: { id } });

    if (current && assumedMasterState != null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(itemToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        await deps.prisma.item.update({
          where: { id },
          data: { deleted: true, deletedAt: new Date() },
        });
      }
    } else if (current) {
      // Pin updatedAt to what the client sent so assumedMasterState
      // comparison on the next push doesn't false-conflict against
      // Prisma's @updatedAt (which would use server time otherwise).
      const clientUpdatedAt = newDocumentState.updatedAt;
      const updatedAt = typeof clientUpdatedAt === 'string'
        ? new Date(clientUpdatedAt)
        : new Date();

      await deps.prisma.item.update({
        where: { id },
        data: {
          name: newDocumentState.name as string,
          sectionId: newDocumentState.sectionId as string | null,
          defaultUnit: newDocumentState.defaultUnit as string | null,
          deleted: false,
          deletedAt: null,
          updatedAt,
        },
      });
    } else {
      const clientUpdatedAt = newDocumentState.updatedAt;
      const updatedAt = typeof clientUpdatedAt === 'string'
        ? new Date(clientUpdatedAt)
        : new Date();

      try {
        await deps.prisma.item.create({
          data: {
            id,
            name: newDocumentState.name as string,
            storeId,
            sectionId: newDocumentState.sectionId as string | null,
            defaultUnit: newDocumentState.defaultUnit as string | null,
            updatedAt,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // Duplicate (storeId, name) from another offline client —
          // find the canonical server row so the client can reconcile.
          const existing = await deps.prisma.item.findFirst({
            where: { storeId, name: newDocumentState.name as string, deleted: false },
          });
          if (existing) {
            conflicts.push(itemToSyncDoc(existing));
            continue;
          }
          // Edge case: unique constraint hit but item not returned
          // (e.g. soft-deleted with same name). Re-throw.
        }
        throw err;
      }
    }
  }

  return conflicts;
}

function itemToSyncDoc(row: {
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
