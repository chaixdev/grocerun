/**
 * Store sync — server-authoritative collection.
 *
 * Pull: client caches stores for local display.
 * Push: NOT supported. All store mutations go through REST.
 */

import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullStores(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const accessibleHouseholdIds = await deps.getAccessibleHouseholdIdsForSync(userId);

  if (accessibleHouseholdIds.length === 0) {
    return { documents: [], checkpoint: null };
  }

  const tombstoneWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    householdId: { in: accessibleHouseholdIds },
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
