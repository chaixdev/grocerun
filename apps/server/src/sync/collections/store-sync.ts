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
import { pullByAccess } from '../sync-helpers';

export async function pullStores(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  return pullByAccess({
    deps, checkpoint, limit, userId,
    model: deps.prisma.store,
    toDoc: storeToSyncDoc,
    buildBaseFilter: async (d, u) => {
      const ids = await d.getAccessibleHouseholdIdsForSync(u);
      return ids.length === 0 ? null : { householdId: { in: ids } };
    },
  });
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
