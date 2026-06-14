import { BadRequestException } from '@nestjs/common';
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

    await deps.verifyStoreAccess(storeId, userId);

    const current = await deps.prisma.item.findUnique({ where: { id } });

    if (current && assumedMasterState !== null) {
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
      await deps.prisma.item.update({
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
      await deps.prisma.item.create({
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
