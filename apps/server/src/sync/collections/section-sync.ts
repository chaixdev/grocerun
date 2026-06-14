import { BadRequestException } from '@nestjs/common';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullSections(
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

  const rows = await deps.prisma.section.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
  });

  const documents: SyncDocument[] = rows.map(sectionToSyncDoc);

  const newCheckpoint: SyncCheckpoint | null =
    rows.length > 0
      ? {
          id: rows[rows.length - 1].id,
          updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
        }
      : checkpoint;

  return { documents, checkpoint: newCheckpoint };
}

export async function pushSections(
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

    const current = await deps.prisma.section.findUnique({ where: { id } });

    if (current && assumedMasterState !== null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(sectionToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        await deps.prisma.$transaction(async (tx) => {
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
    } else if (current) {
      await deps.prisma.section.update({
        where: { id },
        data: {
          name: newDocumentState.name as string,
          order: newDocumentState.order as number,
          deleted: false,
          deletedAt: null,
        },
      });
    } else {
      await deps.prisma.section.create({
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

function sectionToSyncDoc(row: {
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
