// Source: apps/server/src/sync/sync-helpers.ts

import { describe, it, expect } from 'vitest';
import {
  TOMBSTONE_WINDOW_MS,
  buildPullWhere,
  computeCheckpoint,
} from '../../src/sync/sync-helpers';
import type { SyncCheckpoint } from '../../src/sync/sync.types';

// ---------------------------------------------------------------------------
// TOMBSTONE_WINDOW_MS
// ---------------------------------------------------------------------------
describe('TOMBSTONE_WINDOW_MS', () => {
  it('equals 30 * 24 * 60 * 60 * 1000', () => {
    expect(TOMBSTONE_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// buildPullWhere
// ---------------------------------------------------------------------------
describe('buildPullWhere', () => {
  it('returns baseFilter + tombstone window but NO pagination AND clause when checkpoint is null', () => {
    const baseFilter = { listId: 'list-1' };
    const result = buildPullWhere(baseFilter, null);

    expect(result).toHaveProperty('listId', 'list-1');
    expect(result).toHaveProperty('AND');
    expect(Array.isArray(result.AND)).toBe(true);

    // Without a checkpoint, there should be exactly 1 clause in AND: the tombstone OR
    expect(result.AND).toHaveLength(1);

    const tombstoneClause = result.AND[0];
    expect(tombstoneClause).toHaveProperty('OR');
    expect(Array.isArray(tombstoneClause.OR)).toBe(true);
    expect(tombstoneClause.OR).toHaveLength(2);
    expect(tombstoneClause.OR[0]).toEqual({ deleted: false });
    expect(tombstoneClause.OR[1]).toHaveProperty('deletedAt');
    expect(tombstoneClause.OR[1].deletedAt).toHaveProperty('gte');
    expect(tombstoneClause.OR[1].deletedAt.gte).toBeInstanceOf(Date);
  });

  it('includes the checkpoint pagination AND clause when checkpoint is provided', () => {
    const baseFilter = { listId: 'list-1' };
    const checkpoint: SyncCheckpoint = {
      id: 'row-5',
      updatedAt: '2025-01-15T10:00:00.000Z',
    };

    const result = buildPullWhere(baseFilter, checkpoint);

    // Now AND should have 2 clauses: tombstone + pagination
    expect(result.AND).toHaveLength(2);

    const paginationClause = result.AND[1];
    expect(paginationClause).toHaveProperty('OR');
    expect(Array.isArray(paginationClause.OR)).toBe(true);
    expect(paginationClause.OR).toHaveLength(2);

    // First branch: updatedAt > checkpoint.updatedAt
    expect(paginationClause.OR[0]).toEqual({
      updatedAt: { gt: new Date(checkpoint.updatedAt) },
    });

    // Second branch: updatedAt == checkpoint.updatedAt AND id > checkpoint.id
    expect(paginationClause.OR[1]).toEqual({
      updatedAt: { equals: new Date(checkpoint.updatedAt) },
      id: { gt: checkpoint.id },
    });
  });

  it('tombstone window uses TOMBSTONE_WINDOW_MS (30 days) and is within ~1 second of Date.now() - TOMBSTONE_WINDOW_MS', () => {
    const now = Date.now();
    const expectedMin = new Date(now - TOMBSTONE_WINDOW_MS - 1000);
    const expectedMax = new Date(now - TOMBSTONE_WINDOW_MS + 1000);

    const result = buildPullWhere({}, null);
    const tombstoneDate: Date = result.AND[0].OR[1].deletedAt.gte;

    expect(tombstoneDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(tombstoneDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
  });

  it('preserves all baseFilter properties in the result', () => {
    const baseFilter = { listId: 'list-1', storeId: 'store-abc', deleted: false };
    const result = buildPullWhere(baseFilter, null);

    expect(result.listId).toBe('list-1');
    expect(result.storeId).toBe('store-abc');
    expect(result.deleted).toBe(false);
    expect(result).toHaveProperty('AND');
  });

  it('merges baseFilter spread with AND array — does not mutate input', () => {
    const baseFilter = { a: 1 };
    const originalKeys = Object.keys(baseFilter);

    const result = buildPullWhere(baseFilter, null);

    // Original object should be unmodified
    expect(Object.keys(baseFilter)).toEqual(originalKeys);
    expect(baseFilter).toEqual({ a: 1 });

    // Result has the spread plus AND
    expect(result).toEqual({ a: 1, AND: expect.any(Array) });
  });
});

// ---------------------------------------------------------------------------
// computeCheckpoint
// ---------------------------------------------------------------------------
describe('computeCheckpoint', () => {
  it('returns fallback (null) when rows is empty and fallback is null', () => {
    const result = computeCheckpoint([], null);
    expect(result).toBeNull();
  });

  it('returns fallback (checkpoint object) when rows is empty and fallback is a checkpoint', () => {
    const fallback: SyncCheckpoint = {
      id: 'prev-1',
      updatedAt: '2025-01-10T00:00:00.000Z',
    };
    const result = computeCheckpoint([], fallback);
    expect(result).toEqual(fallback);
  });

  it('returns checkpoint with id and ISO updatedAt for a non-empty row set', () => {
    const rows = [{ id: 'row-1', updatedAt: new Date('2025-06-01T12:00:00.000Z') }];
    const result = computeCheckpoint(rows, null);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('row-1');
    expect(result!.updatedAt).toBe('2025-06-01T12:00:00.000Z');
  });

  it('single row returns that row as checkpoint', () => {
    const row = { id: 'single', updatedAt: new Date('2025-07-01T08:30:00.000Z') };
    const result = computeCheckpoint([row], null);

    expect(result).toEqual({
      id: 'single',
      updatedAt: '2025-07-01T08:30:00.000Z',
    });
  });

  it('multiple rows returns the LAST row as checkpoint (ignores fallback)', () => {
    const rows = [
      { id: 'a', updatedAt: new Date('2025-01-01T00:00:00.000Z') },
      { id: 'b', updatedAt: new Date('2025-02-01T00:00:00.000Z') },
      { id: 'c', updatedAt: new Date('2025-03-01T00:00:00.000Z') },
    ];
    const fallback: SyncCheckpoint = {
      id: 'should-not-be-used',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const result = computeCheckpoint(rows, fallback);

    expect(result).toEqual({
      id: 'c',
      updatedAt: '2025-03-01T00:00:00.000Z',
    });
  });

  it('works with Date objects carrying sub-millisecond ISO strings', () => {
    const date = new Date('2025-12-25T15:30:45.123Z');
    const rows = [{ id: 'ms', updatedAt: date }];
    const result = computeCheckpoint(rows, null);

    expect(result!.updatedAt).toBe('2025-12-25T15:30:45.123Z');
  });
});
