/**
 * Integration tests for ListItem sync push handler.
 *
 * The push handler is local-first: clients can create, update, and soft-delete
 * list items. The server prevents mutations on COMPLETED lists.
 *
 * Covered:
 *   1. Push creates a client-generated list item
 *   2. Push updates isChecked, quantity, and purchasedQuantity
 *   3. Push soft-deletes via _deleted: true (tombstone)
 *   4. Push soft-delete restores via pre-create check (same listId+itemId)
 *   5. Push rejects/conflicts when list is COMPLETED
 *   6. Collaborative push — two household members push list-item updates to a
 *      SHOPPING list (no lock, no conflict)
 *   7. Same-row stale push returns the canonical server row via
 *      assumedMasterState conflict resolution
 *   8. Push allows when list is PLANNING (no lock required)
 *   9. AssumedMasterState conflict when server timestamp differs
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  agentAs,
  db,
  seedBaseFixtures,
  seedSecondMember,
  clearDomainData,
  waitForAppReady,
  TEST_USER_ID_2,
} from '../helpers';

let app: INestApplication;
let householdId: string;
let storeId: string;
let sectionId: string;
let catalogItemId: string;

beforeAll(async () => {
  app = await createTestApp();
  await waitForAppReady(app);
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await clearDomainData(db(app));
  const fixtures = await seedBaseFixtures(db(app));
  householdId = fixtures.householdId;
  await seedSecondMember(db(app));

  // Create store
  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'Push Test Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  // Create section
  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'Push Test Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;

  // Create a catalog item directly via DB so we have an itemId to push against
  // (without creating a listItem that could trigger duplicate detection)
  const item = await db(app).item.create({
    data: { id: 'catalog-item', name: 'Catalog Milk', storeId, sectionId, purchaseCount: 0 },
  });
  catalogItemId = item.id;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createPlanningList(): Promise<string> {
  const res = await agent(app)
    .post('/lists')
    .send({ storeId })
    .expect(201);
  return res.body.id;
}

// ---------------------------------------------------------------------------
// 1. Push creates a client-generated list item
// ---------------------------------------------------------------------------

describe('ListItem push — create', () => {
  it('accepts a new listItem with a client-generated ID', async () => {
    const listId = await createPlanningList();

    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'client-li-001',
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 2,
            unit: 'pcs',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // Verify DB
    const li = await db(app).listItem.findUnique({ where: { id: 'client-li-001' } });
    expect(li).not.toBeNull();
    expect(li!.listId).toBe(listId);
    expect(li!.itemId).toBe(catalogItemId);
    expect(li!.isChecked).toBe(false);
    expect(li!.quantity).toBe(2);
    expect(li!.deleted).toBe(false);
  });

  it('returns BadRequest when listId is missing', async () => {
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'no-list',
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(400);
  });

  it('returns BadRequest when itemId is missing', async () => {
    const listId = await createPlanningList();

    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'no-item',
            listId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(400);
  });
});

// ---------------------------------------------------------------------------
// 2. Push updates checked state, quantity, and purchasedQuantity
// ---------------------------------------------------------------------------

describe('ListItem push — update', () => {
  it('updates isChecked and quantity on an existing listItem', async () => {
    const listId = await createPlanningList();

    // Create via push
    const itemId = 'client-li-update';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Update via push
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 5,
            purchasedQuantity: 3,
            unit: 'carton',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.isChecked).toBe(true);
    expect(li!.quantity).toBe(5);
    expect(li!.purchasedQuantity).toBe(3);
    expect(li!.unit).toBe('carton');
  });
});

// ---------------------------------------------------------------------------
// 3. Push soft-deletes (tombstone)
// ---------------------------------------------------------------------------

describe('ListItem push — soft-delete', () => {
  it('soft-deletes a listItem when _deleted: true is pushed', async () => {
    const listId = await createPlanningList();

    // Create
    const itemId = 'client-li-tombstone';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Soft-delete via push
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            _deleted: true,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.deleted).toBe(true);
    expect(li!.deletedAt).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Push soft-delete restore via pre-create check
// ---------------------------------------------------------------------------

describe('ListItem push — restore via pre-create check', () => {
  it('restores a soft-deleted listItem when pushed with same (listId, itemId) but new ID', async () => {
    const listId = await createPlanningList();

    // Create
    const oldId = 'client-li-restore-old';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: oldId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Soft-delete
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: oldId,
            listId,
            itemId: catalogItemId,
            _deleted: true,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Verify soft-deleted
    const deleted = await db(app).listItem.findUnique({ where: { id: oldId } });
    expect(deleted!.deleted).toBe(true);

    // Push with new ID, same (listId, itemId) — should restore old row
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'client-li-restore-new',
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 10,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // Old row restored
    const restored = await db(app).listItem.findUnique({ where: { id: oldId } });
    expect(restored!.deleted).toBe(false);
    expect(restored!.deletedAt).toBeNull();
    expect(restored!.quantity).toBe(10);
    expect(restored!.isChecked).toBe(true);

    // New row NOT created
    const newRow = await db(app).listItem.findUnique({ where: { id: 'client-li-restore-new' } });
    expect(newRow).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Push conflicts when list is COMPLETED
// ---------------------------------------------------------------------------

describe('ListItem push — COMPLETED list lock', () => {
  it('returns tombstone conflict when pushing to a COMPLETED list', async () => {
    const listId = await createPlanningList();

    // Create a listItem
    const itemId = 'client-li-completed';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Start shopping
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // Complete the list
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    // Try to push an update to the completed list
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 5,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Should return conflict
    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0]._deleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Canonical parent authorization and lifecycle gates
// ---------------------------------------------------------------------------

describe('ListItem push — canonical parent', () => {
  it('returns the full canonical row and leaves it under its canonical active list when the client supplies another accessible listId', async () => {
    const canonicalListId = await createPlanningList();
    // The REST endpoint may reuse the active list, so create a distinct but
    // equally accessible parent directly.
    const clientList = await db(app).list.create({
      data: { name: 'Second Active List', storeId },
    });
    const target = await db(app).listItem.create({
      data: {
        id: 'active-parent-mismatch-target',
        listId: canonicalListId,
        itemId: catalogItemId,
        isChecked: false,
        quantity: 2,
        unit: 'box',
        purchasedQuantity: 1,
      },
    });

    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: target.id,
            listId: clientList.id,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 99,
            unit: 'spoofed',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([
      {
        id: target.id,
        listId: target.listId,
        itemId: target.itemId,
        isChecked: target.isChecked,
        quantity: target.quantity,
        createdAt: target.createdAt.toISOString(),
        unit: target.unit,
        purchasedQuantity: target.purchasedQuantity,
        updatedAt: target.updatedAt.toISOString(),
        _deleted: target.deleted,
      },
    ]);

    const unchanged = await db(app).listItem.findUnique({ where: { id: target.id } });
    expect(unchanged).toMatchObject({
      listId: canonicalListId,
      itemId: catalogItemId,
      isChecked: false,
      quantity: 2,
      unit: 'box',
      purchasedQuantity: 1,
      deleted: false,
    });
  });

  it('returns only a synthetic tombstone when the canonical parent is soft-deleted', async () => {
    const activeListId = await createPlanningList();
    const canonicalList = await db(app).list.create({
      data: { name: 'Deleted Canonical List', storeId },
    });
    const target = await db(app).listItem.create({
      data: {
        id: 'deleted-parent-target',
        listId: canonicalList.id,
        itemId: catalogItemId,
        isChecked: false,
        quantity: 2,
        unit: 'box',
      },
    });
    await db(app).list.update({
      where: { id: canonicalList.id },
      data: { deleted: true, deletedAt: new Date() },
    });

    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: target.id,
            listId: activeListId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 99,
            unit: 'spoofed',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([
      { id: target.id, updatedAt: expect.any(String), _deleted: true },
    ]);

    const unchanged = await db(app).listItem.findUnique({ where: { id: target.id } });
    expect(unchanged).toMatchObject({
      listId: canonicalList.id,
      itemId: catalogItemId,
      isChecked: false,
      quantity: 2,
      unit: 'box',
      deleted: false,
    });
  });

  it('returns a synthetic tombstone and leaves the target unchanged when an accessible listId spoofs a cross-household row', async () => {
    const accessibleListId = await createPlanningList();
    const prisma = db(app);
    const otherUser = await prisma.user.upsert({
      where: { id: 'other-household-owner' },
      update: {},
      create: { id: 'other-household-owner', email: 'other-owner@grocerun.test', name: 'Other Owner' },
    });
    const otherHousehold = await prisma.household.create({
      data: {
        name: 'Other Household',
        ownerId: otherUser.id,
        users: { connect: { id: otherUser.id } },
      },
    });
    const otherStore = await prisma.store.create({
      data: { name: 'Other Store', householdId: otherHousehold.id },
    });
    const otherItem = await prisma.item.create({
      data: { name: 'Other Item', storeId: otherStore.id },
    });
    const target = await prisma.listItem.create({
      data: {
        id: 'cross-household-target',
        list: { create: { name: 'Other List', storeId: otherStore.id } },
        item: { connect: { id: otherItem.id } },
        isChecked: false,
        quantity: 2,
        unit: 'box',
      },
    });

    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: target.id,
            listId: accessibleListId,
            itemId: otherItem.id,
            isChecked: true,
            quantity: 99,
            unit: 'spoofed',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0]).toEqual({
      id: target.id,
      updatedAt: expect.any(String),
      _deleted: true,
    });

    const unchanged = await prisma.listItem.findUnique({ where: { id: target.id } });
    expect(unchanged).toMatchObject({
      listId: target.listId,
      itemId: target.itemId,
      isChecked: false,
      quantity: 2,
      unit: 'box',
      deleted: false,
    });
  });

  it('returns a tombstone conflict and leaves the target unchanged when an active listId spoofs a completed row', async () => {
    const activeListId = await createPlanningList();
    const completedList = await db(app).list.create({
      data: { name: 'Completed List', storeId, status: 'COMPLETED' },
    });
    const target = await db(app).listItem.create({
      data: {
        id: 'completed-parent-target',
        listId: completedList.id,
        itemId: catalogItemId,
        isChecked: false,
        quantity: 2,
        unit: 'box',
      },
    });

    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: target.id,
            listId: activeListId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 99,
            unit: 'spoofed',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0]._deleted).toBe(true);

    const unchanged = await db(app).listItem.findUnique({ where: { id: target.id } });
    expect(unchanged).toMatchObject({
      listId: completedList.id,
      itemId: catalogItemId,
      isChecked: false,
      quantity: 2,
      unit: 'box',
      deleted: false,
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Collaborative push — two household members push to a SHOPPING list
// ---------------------------------------------------------------------------

describe('ListItem push — collaborative shopping', () => {
  it('allows two household members to push list-item updates to a SHOPPING list', async () => {
    const listId = await createPlanningList();

    // Member A creates the listItem (PLANNING)
    const itemId = 'client-li-collab';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Member A starts shopping
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // Member B pushes an update to the same listItem — succeeds, no conflict
    const pushRes = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 5,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.isChecked).toBe(true);
    expect(li!.quantity).toBe(5);
  });

  it('allows member A to push a subsequent update after member B modifies the row', async () => {
    const listId = await createPlanningList();

    const itemId = 'client-li-collab-round2';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 2,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // B updates first
    await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 8,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // A updates with awareness of B's state — fetch, then push with matching assumedMasterState
    const current = await db(app).listItem.findUnique({ where: { id: itemId } });
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 10,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: { id: itemId, updatedAt: current!.updatedAt.toISOString() },
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.quantity).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 7. Same-row stale push returns canonical server row
// ---------------------------------------------------------------------------

describe('ListItem push — same-row stale push returns canonical', () => {
  it('returns the canonical server row when a stale push misses the assumedMasterState timestamp', async () => {
    const listId = await createPlanningList();

    const itemId = 'client-li-stale-canonical';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            unit: 'box',
            purchasedQuantity: 2,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Member B pushes with a stale assumedMasterState.updatedAt.
    const pushRes = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 99,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: {
            id: itemId,
            updatedAt: '2000-01-01T00:00:00.000Z',
          },
        },
      ])
      .expect(200);

    expect(pushRes.body).toHaveLength(1);
    const conflict = pushRes.body[0];
    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(conflict).toEqual({
      id: li!.id,
      listId: li!.listId,
      itemId: li!.itemId,
      isChecked: li!.isChecked,
      quantity: li!.quantity,
      createdAt: li!.createdAt.toISOString(),
      unit: li!.unit,
      purchasedQuantity: li!.purchasedQuantity,
      updatedAt: li!.updatedAt.toISOString(),
      _deleted: li!.deleted,
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Push allows when list is PLANNING (no lock required)
// ---------------------------------------------------------------------------

describe('ListItem push — PLANNING allows push', () => {
  it('allows push to a PLANNING list without any lock check', async () => {
    const listId = await createPlanningList();

    // Push create
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'client-li-planning',
            listId,
            itemId: catalogItemId,
            isChecked: true,  // checking items during planning is allowed
            quantity: 4,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const li = await db(app).listItem.findUnique({ where: { id: 'client-li-planning' } });
    expect(li).not.toBeNull();
    expect(li!.isChecked).toBe(true);
    expect(li!.deleted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. AssumedMasterState conflict
// ---------------------------------------------------------------------------

describe('ListItem push — assumedMasterState conflict', () => {
  it('returns conflict when assumedMasterState.updatedAt differs from server', async () => {
    const listId = await createPlanningList();

    // Create a listItem
    const itemId = 'client-li-conflict';
    await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: false,
            quantity: 1,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Get the server's current updatedAt
    await db(app).listItem.findUnique({ where: { id: itemId } });

    // Push with a wrong assumedMasterState.updatedAt
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 99,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: {
            id: itemId,
            updatedAt: '2000-01-01T00:00:00.000Z',  // wrong timestamp
          },
        },
      ])
      .expect(200);

    // Should return conflict with server's current state
    expect(pushRes.body).toHaveLength(1);
    const conflict = pushRes.body[0];
    expect(conflict.id).toBe(itemId);
    expect(conflict._deleted).toBe(false);

    // DB should NOT have been updated
    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.isChecked).toBe(false);
    expect(li!.quantity).toBe(1);
  });
});
