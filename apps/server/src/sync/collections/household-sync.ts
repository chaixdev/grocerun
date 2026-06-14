/**
 * Household sync — server-authoritative collection.
 *
 * Pull: client caches households for local display (including tombstone delivery
 *       for recently-deleted households to converge cascaded deletes).
 * Push: NOT supported. All household mutations go through REST.
 *       Member removal still uses HOUSEHOLD_REMOVED SSE event.
 */

import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullHouseholds(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const tombstoneWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    users: { some: { id: userId } },
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
