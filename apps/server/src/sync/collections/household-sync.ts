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
import { pullByAccess } from '../sync-helpers';

export async function pullHouseholds(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  return pullByAccess({
    deps, checkpoint, limit, userId,
    model: deps.prisma.household,
    toDoc: (row: any) => ({
      id: row.id,
      name: row.name,
      ...(row.ownerId ? { ownerId: row.ownerId } : {}),
      memberCount: row._count?.users ?? 0,
      updatedAt: row.updatedAt.toISOString(),
      _deleted: row.deleted,
    }),
    buildBaseFilter: async (_d, _u) => ({ users: { some: { id: userId } } }),
    extra: { include: { _count: { select: { users: true } } } },
  });
}
