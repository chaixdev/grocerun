/**
 * Section sync — server-authoritative collection.
 *
 * Pull: client caches sections for local display.
 * Push: NOT supported. All section mutations go through REST.
 */

import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullSections(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const accessibleStoreIds = await deps.getAccessibleStoreIdsForSync(userId);

  if (accessibleStoreIds.length === 0) {
    return { documents: [], checkpoint: null };
  }

  const tombstoneWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    storeId: { in: accessibleStoreIds },
    AND: [
      {
        OR: [
          { deleted: false },
          { deletedAt: { gte: tombstoneWindow } },
        ],
      },
    ],
  };

  if (checkpoint) {
    (where.AND as Array<Record<string, unknown>>).push({
      OR: [
        { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
        {
          updatedAt: { equals: new Date(checkpoint.updatedAt) },
          id: { gt: checkpoint.id },
        },
      ],
    });
  }

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
