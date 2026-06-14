/**
 * List sync — server-authoritative collection.
 *
 * Pull: client caches lists for local display.
 * Push: NOT supported. List lifecycle (create, start, cancel, complete)
 *       and mutations always go through REST.
 */

import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';
import { pullByAccess } from '../sync-helpers';

export async function pullLists(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  return pullByAccess({
    deps, checkpoint, limit, userId,
    model: deps.prisma.list,
    toDoc: listToSyncDoc,
    buildBaseFilter: async (d, u) => {
      const ids = await d.getAccessibleStoreIdsForSync(u);
      return ids.length === 0 ? null : { storeId: { in: ids } };
    },
  });
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
