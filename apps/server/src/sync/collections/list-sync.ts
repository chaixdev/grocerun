import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullLists(
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

  const rows = await deps.prisma.list.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
  });

  const documents: SyncDocument[] = rows.map(listToSyncDoc);

  const newCheckpoint: SyncCheckpoint | null =
    rows.length > 0
      ? {
          id: rows[rows.length - 1].id,
          updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
        }
      : checkpoint;

  return { documents, checkpoint: newCheckpoint };
}

export async function pushLists(
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
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
      throw err;
    }

    const current = await deps.prisma.list.findUnique({ where: { id } });

    if (current && assumedMasterState != null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(listToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        await deps.prisma.list.update({
          where: { id },
          data: { deleted: true, deletedAt: new Date() },
        });
      }
    } else if (current) {
      await deps.prisma.list.update({
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
      await deps.prisma.list.create({
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

function listToSyncDoc(row: {
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
