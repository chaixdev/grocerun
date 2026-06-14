import { SyncCheckpoint, SyncDocument, PullResponse } from './sync.types';
import { SyncDeps } from './sync-deps';

export const TOMBSTONE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Build a Prisma WHERE clause that includes:
 *   - The caller-supplied base filter (collection-specific)
 *   - Tombstone window (deleted: false OR recently deleted)
 *   - Checkpoint pagination (if checkpoint provided)
 */
export function buildPullWhere(
  baseFilter: Record<string, unknown>,
  checkpoint: SyncCheckpoint | null,
): Record<string, unknown> {
  const tombstoneWindow = new Date(Date.now() - TOMBSTONE_WINDOW_MS);
  const and: Array<Record<string, unknown>> = [
    {
      OR: [
        { deleted: false },
        { deletedAt: { gte: tombstoneWindow } },
      ],
    },
  ];

  if (checkpoint) {
    and.push({
      OR: [
        { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
        {
          updatedAt: { equals: new Date(checkpoint.updatedAt) },
          id: { gt: checkpoint.id },
        },
      ],
    });
  }

  return { ...baseFilter, AND: and };
}

/**
 * Compute the next checkpoint from the last row in a batch.
 * Returns the fallback checkpoint if rows is empty.
 */
export function computeCheckpoint<T extends { id: string; updatedAt: Date }>(
  rows: T[],
  fallback: SyncCheckpoint | null,
): SyncCheckpoint | null {
  if (rows.length === 0) return fallback;
  const last = rows[rows.length - 1];
  return { id: last.id, updatedAt: last.updatedAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Shared pull handler — eliminates duplicated boilerplate across 6 collections.
// Each collection's pull function becomes a thin wrapper that supplies the
// collection-specific filter and row → document mapper.
// ---------------------------------------------------------------------------

interface PullHandlerOptions<T extends { id: string; updatedAt: Date }> {
  /** SyncDeps from the caller */
  deps: SyncDeps;
  /** Current checkpoint */
  checkpoint: SyncCheckpoint | null;
  /** Batch size */
  limit: number;
  /** Authenticated user */
  userId: string;
  /** Maps a Prisma row to a SyncDocument (collection-specific field mapping) */
  toDoc: (row: T) => SyncDocument;
  /** The Prisma model delegate (e.g. deps.prisma.section) */
  model: {
    findMany(args: { where: Record<string, unknown>; orderBy: Array<Record<string, string>>; take: number; include?: Record<string, unknown> }): Promise<T[]>;
  };
  /** Builds the collection-specific base WHERE clause (without tombstone/checkpoint).
   *  Returns null when the user has no accessible data, causing an empty response. */
  buildBaseFilter: (deps: SyncDeps, userId: string, checkpoint: SyncCheckpoint | null) => Promise<Record<string, unknown> | null>;
  /** Additional Prisma findMany options (e.g. { include: { _count: ... } }) */
  extra?: Record<string, unknown>;
}

export async function pullByAccess<T extends { id: string; updatedAt: Date }>(
  opts: PullHandlerOptions<T>,
): Promise<PullResponse> {
  const { deps, checkpoint, limit, userId, toDoc, model, buildBaseFilter, extra } = opts;

  const baseFilter = await buildBaseFilter(deps, userId, checkpoint);
  if (baseFilter === null) {
    return { documents: [], checkpoint: null };
  }

  const where = buildPullWhere(baseFilter, checkpoint);
  const rows = await model.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
    ...(extra ? extra : {}),
  });

  const documents: SyncDocument[] = rows.map(toDoc);
  return { documents, checkpoint: computeCheckpoint(rows, checkpoint) };
}
