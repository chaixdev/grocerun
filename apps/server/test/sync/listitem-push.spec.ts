/**
 * Integration tests for ListItem sync push handler.
 *
 * The push handler is local-first: clients can create, update, and soft-delete
 * list items. The server enforces shopping locks and prevents mutations on
 * COMPLETED lists.
 *
 * Covered:
 *   1. Push creates a client-generated list item
 *   2. Push updates isChecked, quantity, and purchasedQuantity
 *   3. Push soft-deletes via _deleted: true (tombstone)
 *   4. Push soft-delete restores via pre-create check (same listId+itemId)
 *   5. Push rejects/conflicts when list is COMPLETED
 *   6. Push enforces shopping lock (LOCKED_BY_OTHER → conflict)
 *   7. Push allows when SHOPPING with no lock holder (MISSING_LOCK)
 *   8. Push allows when list is PLANNING (no lock required)
 *   9. AssumedMasterState conflict when server timestamp differs
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  db,
  seedBaseFixtures,
  clearDomainData,
  waitForAppReady,
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
// 6. Push enforces shopping lock (LOCKED_BY_OTHER → conflict)
// ---------------------------------------------------------------------------

describe('ListItem push — LOCKED_BY_OTHER', () => {
  it('returns tombstone conflict when another user holds the shopping lock', async () => {
    const listId = await createPlanningList();

    // Create a listItem
    const itemId = 'client-li-locked';
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

    // Start shopping (test user becomes lock holder)
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // Manually reassign lock to another user to simulate LOCKED_BY_OTHER
    await db(app).list.update({
      where: { id: listId },
      data: { assignedTo: 'another-user-id' },
    });

    // Push should conflict
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 2,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0]._deleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Push allows when SHOPPING with no lock holder (MISSING_LOCK)
// ---------------------------------------------------------------------------

describe('ListItem push — MISSING_LOCK allows push', () => {
  it('allows push to a SHOPPING list with no lock holder', async () => {
    const listId = await createPlanningList();

    // Create a listItem
    const itemId = 'client-li-missing-lock';
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

    // Force list to SHOPPING without assignedTo (bypass REST guard)
    await db(app).list.update({
      where: { id: listId },
      data: { status: 'SHOPPING', assignedTo: null },
    });

    // Push should succeed (MISSING_LOCK is allowed)
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            listId,
            itemId: catalogItemId,
            isChecked: true,
            quantity: 3,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // Verify update was applied
    const li = await db(app).listItem.findUnique({ where: { id: itemId } });
    expect(li!.isChecked).toBe(true);
    expect(li!.quantity).toBe(3);
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
