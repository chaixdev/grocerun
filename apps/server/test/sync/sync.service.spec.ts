import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService } from '../../src/sync/sync.service';
import type { SyncDeps } from '../../src/sync/sync-deps';
import type { PrismaService } from '../../src/prisma.service';

function createMockPrisma() {
  return {
    store: {
      findMany: vi.fn().mockResolvedValue([{ id: 's1', householdId: 'h1' }]),
      findFirst: vi.fn().mockResolvedValue({ id: 's1', householdId: 'h1' }),
    },
    household: {
      findMany: vi.fn().mockResolvedValue([{ id: 'h1' }]),
      findFirst: vi.fn().mockResolvedValue({ id: 'h1' }),
    },
    item: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'it1' }),
    },
    list: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

function createOperationDeps(service: SyncService): SyncDeps {
  return (service as unknown as { createDeps(): SyncDeps }).createDeps();
}

describe('SyncService access cache', () => {
  let service: SyncService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new SyncService(mockPrisma as unknown as PrismaService);
  });

  it('memoizes accessible store ids for the same user within one request', async () => {
    const deps = createOperationDeps(service);

    const p1 = deps.getAccessibleStoreIdsForSync('user-1');
    const p2 = deps.getAccessibleStoreIdsForSync('user-1');

    expect(p1).toBe(p2);
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(1);
    await expect(p1).resolves.toEqual(['s1']);
  });

  it('memoizes accessible household ids for the same user within one request', async () => {
    const deps = createOperationDeps(service);

    const p1 = deps.getAccessibleHouseholdIdsForSync('user-1');
    const p2 = deps.getAccessibleHouseholdIdsForSync('user-1');

    expect(p1).toBe(p2);
    expect(mockPrisma.household.findMany).toHaveBeenCalledTimes(1);
    await expect(p1).resolves.toEqual(['h1']);
  });

  it('re-queries accessible store ids for a fresh pull operation', async () => {
    await service.pull('item', null, 100, 'user-1');
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(1);

    await service.pull('item', null, 100, 'user-1');
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(2);
  });

  it('re-queries accessible store ids for a fresh push operation', async () => {
    createOperationDeps(service).getAccessibleStoreIdsForSync('user-1');
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(1);

    const result = await service.push(
      'item',
      [
        {
          newDocumentState: {
            id: 'it1',
            name: 'Milk',
            storeId: 's1',
            sectionId: 's1',
            defaultUnit: 'piece',
            _deleted: false,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ],
      'user-1',
    );
    expect(result).toEqual([]);

    createOperationDeps(service).getAccessibleStoreIdsForSync('user-1');
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(2);
  });

  it('keeps overlapping operation caches independent without evicting either one', async () => {
    const firstOperation = createOperationDeps(service);
    const secondOperation = createOperationDeps(service);

    const firstRequest = firstOperation.getAccessibleStoreIdsForSync('user-1');
    const secondRequest = secondOperation.getAccessibleStoreIdsForSync('user-1');
    const repeatedFirstRequest = firstOperation.getAccessibleStoreIdsForSync('user-1');

    expect(firstRequest).toBe(repeatedFirstRequest);
    expect(firstRequest).not.toBe(secondRequest);
    expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(2);
    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      ['s1'],
      ['s1'],
    ]);
  });
});
