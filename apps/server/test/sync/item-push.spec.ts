/**
 * Integration tests for Item sync push handler.
 *
 * Items are local-first: clients can create, update, and soft-delete catalog
 * items. The server enforces store access (cross-household pushes are rejected).
 *
 * Note: `purchaseCount` and `lastPurchased` are server-computed fields —
 * they are returned on pull but never written via push.
 *
 * Covered:
 *   1. Push creates a client-generated item
 *   2. Push updates item fields (name, sectionId, defaultUnit)
 *   3. Push handles tombstones (_deleted: true)
 *   4. Push soft-delete restore via pre-create check (same storeId+name)
 *   5. Push returns conflict for duplicate active (storeId, name)
 *   6. Push returns tombstone conflict when store access is denied (cross-household)
 *   7. AssumedMasterState conflict when server timestamp differs
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  db,
  seedBaseFixtures,
  clearDomainData,
} from '../helpers';

let app: INestApplication;
let householdId: string;
let storeId: string;
let sectionId: string;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await clearDomainData(db(app));
  const fixtures = await seedBaseFixtures(db(app));
  householdId = fixtures.householdId;

  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'Item Push Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'Item Push Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;
});

// ---------------------------------------------------------------------------
// 1. Push creates a client-generated item
// ---------------------------------------------------------------------------

describe('Item push — create', () => {
  it('accepts a new item with a client-generated ID', async () => {
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'client-item-001',
            name: 'Organic Bananas',
            storeId,
            sectionId,
            defaultUnit: 'bunch',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const item = await db(app).item.findUnique({ where: { id: 'client-item-001' } });
    expect(item).not.toBeNull();
    expect(item!.name).toBe('Organic Bananas');
    expect(item!.storeId).toBe(storeId);
    expect(item!.defaultUnit).toBe('bunch');
    expect(item!.deleted).toBe(false);
  });

  it('returns BadRequest when storeId is missing', async () => {
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'no-store',
            name: 'No Store Item',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(400);
  });
});

// ---------------------------------------------------------------------------
// 2. Push updates item fields
// ---------------------------------------------------------------------------

describe('Item push — update', () => {
  it('updates name, sectionId, and defaultUnit on an existing item', async () => {
    // Create
    const itemId = 'client-item-update';
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'Original Name',
            storeId,
            sectionId,
            defaultUnit: 'pcs',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Create a second section
    const secRes = await agent(app)
      .post('/sections')
      .send({ name: 'Second Section', storeId })
      .expect(201);
    const newSectionId = secRes.body.id;

    // Update
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'Updated Name',
            storeId,
            sectionId: newSectionId,
            defaultUnit: 'kg',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const item = await db(app).item.findUnique({ where: { id: itemId } });
    expect(item!.name).toBe('Updated Name');
    expect(item!.sectionId).toBe(newSectionId);
    expect(item!.defaultUnit).toBe('kg');
  });
});

// ---------------------------------------------------------------------------
// 3. Push handles tombstones
// ---------------------------------------------------------------------------

describe('Item push — soft-delete', () => {
  it('soft-deletes an item when _deleted: true is pushed', async () => {
    const itemId = 'client-item-tombstone';
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'To Be Deleted',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'To Be Deleted',
            storeId,
            _deleted: true,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    const item = await db(app).item.findUnique({ where: { id: itemId } });
    expect(item!.deleted).toBe(true);
    expect(item!.deletedAt).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Push soft-delete restore via pre-create check
// ---------------------------------------------------------------------------

describe('Item push — restore via pre-create check', () => {
  it('restores a soft-deleted item when pushed with same (storeId, name) but new ID', async () => {
    const oldId = 'client-item-restore-old';

    // Create
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: oldId,
            name: 'Restore Me',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Soft-delete
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: oldId,
            name: 'Restore Me',
            storeId,
            _deleted: true,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Verify soft-deleted
    const deleted = await db(app).item.findUnique({ where: { id: oldId } });
    expect(deleted!.deleted).toBe(true);

    // Push with new ID, same (storeId, name)
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'client-item-restore-new',
            name: 'Restore Me',
            storeId,
            defaultUnit: 'liter',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // Old row restored
    const restored = await db(app).item.findUnique({ where: { id: oldId } });
    expect(restored!.deleted).toBe(false);
    expect(restored!.deletedAt).toBeNull();
    expect(restored!.name).toBe('Restore Me');
    expect(restored!.defaultUnit).toBe('liter');

    // New row NOT created
    const newRow = await db(app).item.findUnique({ where: { id: 'client-item-restore-new' } });
    expect(newRow).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Push returns conflict for duplicate active (storeId, name)
// ---------------------------------------------------------------------------

describe('Item push — duplicate conflict', () => {
  it('returns conflict when an active item with same (storeId, name) already exists', async () => {
    // Create first item
    const firstId = 'client-item-dup-1';
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: firstId,
            name: 'Duplicate Name',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Try to create second item with same name in same store
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'client-item-dup-2',
            name: 'Duplicate Name',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Should return the existing item as a conflict
    expect(pushRes.body).toHaveLength(1);
    const conflict = pushRes.body[0];
    expect(conflict.id).toBe(firstId);
    expect(conflict._deleted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Push returns tombstone conflict for cross-household store access
// ---------------------------------------------------------------------------

describe('Item push — store access denial', () => {
  it('returns tombstone conflict when user has no access to the store', async () => {
    // Create a store in a DIFFERENT household that our test user doesn't belong to
    const otherUser = await db(app).user.upsert({
      where: { id: 'other-user-item' },
      update: {},
      create: { id: 'other-user-item', email: 'other-item@test.com', name: 'Other Item' },
    });

    const otherHousehold = await db(app).household.upsert({
      where: { id: 'other-household-item' },
      update: { users: { connect: { id: otherUser.id } } },
      create: {
        id: 'other-household-item',
        name: 'Other Household',
        ownerId: otherUser.id,
      },
    });

    const otherStore = await db(app).store.create({
      data: {
        id: 'other-store',
        name: 'Other Store',
        householdId: otherHousehold.id,
      },
    });

    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'cross-household-item',
            name: 'Should Not Work',
            storeId: otherStore.id,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Should return tombstone conflict (ForbiddenException caught and converted)
    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0]._deleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. AssumedMasterState conflict
// ---------------------------------------------------------------------------

describe('Item push — assumedMasterState conflict', () => {
  it('returns conflict when assumedMasterState.updatedAt differs from server', async () => {
    const itemId = 'client-item-conflict';
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'Conflict Item',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // Push with wrong assumedMasterState
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'Should Conflict',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: {
            id: itemId,
            updatedAt: '1999-12-31T23:59:59.000Z',
          },
        },
      ])
      .expect(200);

    expect(pushRes.body).toHaveLength(1);
    expect(pushRes.body[0].id).toBe(itemId);

    // DB should NOT have changed
    const item = await db(app).item.findUnique({ where: { id: itemId } });
    expect(item!.name).toBe('Conflict Item');
  });
});
