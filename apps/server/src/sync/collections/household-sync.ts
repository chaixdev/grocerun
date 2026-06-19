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
    toDoc: (row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      ...(row.ownerId ? { ownerId: row.ownerId as string } : {}),
      memberCount: (row as { _count?: { users?: number } })._count?.users ?? 0,
      members: ((row as { users?: Array<{ id: string; name: string | null; image: string | null }> }).users ?? []).map(u => ({
        userId: u.id,
        name: u.name ?? '',
        image: u.image ?? '',
      })),
      updatedAt: (row.updatedAt as Date).toISOString(),
      _deleted: row.deleted as boolean,
    }),
    buildBaseFilter: async () => ({ users: { some: { id: userId } } }),
    extra: { include: { _count: { select: { users: true } }, users: { select: { id: true, name: true, image: true } } } },
  });
}
