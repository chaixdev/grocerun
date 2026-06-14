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
import { pullByAccess } from '../sync-helpers';

export async function pullSections(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  return pullByAccess({
    deps, checkpoint, limit, userId,
    model: deps.prisma.section,
    toDoc: sectionToSyncDoc,
    buildBaseFilter: async (d, u) => {
      const ids = await d.getAccessibleStoreIdsForSync(u);
      return ids.length === 0 ? null : { storeId: { in: ids } };
    },
  });
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
