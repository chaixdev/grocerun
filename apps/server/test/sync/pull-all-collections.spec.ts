/**
 * Integration tests for pull endpoints across all 6 collections.
 *
 * Verifies that every collection returns correct data, checkpoint pagination
 * is stable, tombstones are delivered, and cross-household data is excluded.
 *
 * Covered:
 *   1. Pull for each collection: household, store, section, item, list, listItem
 *   2. Checkpoint pagination with equal timestamps
 *   3. Tombstones included for soft-deleted rows
 *   4. Cross-household isolation — user A cannot pull user B's data
 *   5. Batch size respected
 *   6. Unknown collection returns 404
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
    .send({ name: 'Pull Test Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'Pull Test Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;
});

// ---------------------------------------------------------------------------
// 1. Pull each collection
// ---------------------------------------------------------------------------

describe('GET /sync/:collection/pull', () => {
  it('pulls household with user count', async () => {
    const res = await agent(app)
      .get('/sync/household/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.id).toBe(householdId);
    expect(doc.name).toBe('Test Household');
    expect(doc._deleted).toBe(false);
  });

  it('pulls stores with correct shape', async () => {
    const res = await agent(app)
      .get('/sync/store/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.id).toBe(storeId);
    expect(doc.name).toBe('Pull Test Store');
    expect(doc.householdId).toBe(householdId);
    expect(doc._deleted).toBe(false);
  });

  it('pulls sections with correct shape', async () => {
    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.id).toBe(sectionId);
    expect(doc.name).toBe('Pull Test Section');
    expect(doc.storeId).toBe(storeId);
    expect(doc._deleted).toBe(false);
    expect(doc).toHaveProperty('order');
  });

  it('pulls items with correct shape', async () => {
    // Create an item via push to have at least one
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'pull-item-1',
            name: 'Pull Test Item',
            storeId,
            sectionId,
            defaultUnit: 'pcs',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    const res = await agent(app)
      .get('/sync/item/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.name).toBe('Pull Test Item');
    expect(doc.storeId).toBe(storeId);
    expect(doc._deleted).toBe(false);
  });

  it('pulls lists with correct shape', async () => {
    // Create a list
    const listRes = await agent(app)
      .post('/lists')
      .send({ storeId })
      .expect(201);

    const res = await agent(app)
      .get('/sync/list/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.id).toBe(listRes.body.id);
    expect(doc.storeId).toBe(storeId);
    expect(doc.status).toBe('PLANNING');
    expect(doc._deleted).toBe(false);
  });

  it('pulls listItems with correct shape', async () => {
    // Create a list with an item
    const listRes = await agent(app)
      .post('/lists')
      .send({ storeId })
      .expect(201);
    const listId = listRes.body.id;

    // Create an item first, then add to list
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'pull-li-item',
            name: 'Pull LI Item',
            storeId,
            sectionId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    await agent(app)
      .post('/lists/items/add')
      .send({ listId, name: 'Pull LI Item', sectionId, quantity: 1 })
      .expect(201);

    const res = await agent(app)
      .get('/sync/listItem/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(1);
    const doc = res.body.documents[0];
    expect(doc.listId).toBe(listId);
    expect(doc._deleted).toBe(false);
    expect(doc).toHaveProperty('isChecked');
    expect(doc).toHaveProperty('quantity');
  });
});

// ---------------------------------------------------------------------------
// 2. Checkpoint pagination
// ---------------------------------------------------------------------------

describe('Pull checkpoint pagination', () => {
  it('returns only documents updated after the checkpoint', async () => {
    // Create first store
    await agent(app)
      .post('/stores')
      .send({ name: 'Store A', householdId })
      .expect(201);

    // Pull to get checkpoint
    const firstPull = await agent(app)
      .get('/sync/store/pull')
      .expect(200);

    // At this point we have 2 stores: "Pull Test Store" (from beforeEach) + "Store A"
    // But Pull Test Store was created before Store A, so checkpoint should be at Store A
    expect(firstPull.body.checkpoint).not.toBeNull();
    const checkpoint = firstPull.body.checkpoint;

    await new Promise((r) => setTimeout(r, 2));

    // Create another store
    await agent(app)
      .post('/stores')
      .send({ name: 'Store B', householdId })
      .expect(201);

    // Pull from checkpoint — only Store B should be returned
    const secondPull = await agent(app)
      .get(`/sync/store/pull?updatedAt=${checkpoint.updatedAt}&id=${checkpoint.id}`)
      .expect(200);

    expect(secondPull.body.documents).toHaveLength(1);
    expect(secondPull.body.documents[0].name).toBe('Store B');
  });

  it('handles equal timestamps by ordering by id', async () => {
    // Create two stores with the same timestamp via direct DB insert
    const sameTime = new Date();
    await db(app).store.createMany({
      data: [
        { id: 'store-eq-1', name: 'Equal A', householdId, updatedAt: sameTime },
        { id: 'store-eq-2', name: 'Equal B', householdId, updatedAt: sameTime },
      ],
    });

    // Pull all
    const allPull = await agent(app)
      .get('/sync/store/pull')
      .expect(200);

    // Should include all stores (2 from beforeEach + 2 new = up to 4, but pull filters by household)
    // The two equal-timestamp stores should both appear, ordered by id
    const eqDocs = allPull.body.documents.filter((d: { id: string }) =>
      d.id === 'store-eq-1' || d.id === 'store-eq-2'
    );
    expect(eqDocs).toHaveLength(2);
    // 'store-eq-1' should come before 'store-eq-2'
    const idx1 = eqDocs.findIndex((d: { id: string }) => d.id === 'store-eq-1');
    const idx2 = eqDocs.findIndex((d: { id: string }) => d.id === 'store-eq-2');
    expect(idx1).toBeLessThan(idx2);
  });
});

// ---------------------------------------------------------------------------
// 3. Tombstones
// ---------------------------------------------------------------------------

describe('Pull tombstone delivery', () => {
  it('includes soft-deleted documents with _deleted: true', async () => {
    // Create a section and soft-delete it
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Tombstone Section', storeId })
      .expect(201);

    const sectionId = createRes.body.id;

    await agent(app).delete(`/sections/${sectionId}`).expect(200);

    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    const tombstone = res.body.documents.find((d: { id: string }) => d.id === sectionId);
    expect(tombstone).toBeDefined();
    expect(tombstone._deleted).toBe(true);
  });

  it('excludes soft-deleted documents outside the 30-day window', async () => {
    // Create and delete a section with deletedAt far in the past
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Ancient Section', storeId })
      .expect(201);
    const sectionId = createRes.body.id;

    // Soft-delete with deletedAt set to 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    await db(app).section.update({
      where: { id: sectionId },
      data: { deleted: true, deletedAt: sixtyDaysAgo },
    });

    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    const ancient = res.body.documents.find((d: { id: string }) => d.id === sectionId);
    expect(ancient).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Cross-household isolation
// ---------------------------------------------------------------------------

describe('Pull cross-household isolation', () => {
  it('does not expose data from other households', async () => {
    // Create a store in a different household
    const otherUser = await db(app).user.upsert({
      where: { id: 'other-isolation-id' },
      update: {},
      create: { id: 'other-isolation-id', email: 'other-isolation@test.com', name: 'Other Isolation' },
    });

    const otherHousehold = await db(app).household.upsert({
      where: { id: 'pull-iso-hh' },
      update: { users: { connect: { id: otherUser.id } } },
      create: {
        id: 'pull-iso-hh',
        name: 'Other Household',
        ownerId: otherUser.id,
        users: { connect: { id: otherUser.id } },
      },
    });

    await db(app).store.upsert({
      where: { id: 'pull-iso-store' },
      update: {},
      create: {
        id: 'pull-iso-store',
        name: 'Other Store',
        householdId: otherHousehold.id,
      },
    });

    // Pull stores — should NOT include the other household's store
    const res = await agent(app)
      .get('/sync/store/pull')
      .expect(200);

    const otherDoc = res.body.documents.find((d: { id: string }) => d.id === 'pull-iso-store');
    expect(otherDoc).toBeUndefined();
  });

  it('returns empty documents when user has no households', async () => {
    // Remove the user from their household
    await db(app).household.update({
      where: { id: householdId },
      data: { users: { disconnect: { id: 'test-user-id' } } },
    });

    const res = await agent(app)
      .get('/sync/store/pull')
      .expect(200);

    expect(res.body.documents).toEqual([]);
    expect(res.body.checkpoint).toBeNull();
  });

  it('does not expose listItems from cross-household lists', async () => {
    // Create a store in another household with a list and listItem
    const otherUser = await db(app).user.upsert({
      where: { id: 'pull-li-other-user' },
      update: {},
      create: { id: 'pull-li-other-user', email: 'other-li@test.com', name: 'Other LI' },
    });

    const otherHousehold = await db(app).household.upsert({
      where: { id: 'pull-li-other-hh' },
      update: { users: { connect: { id: otherUser.id } } },
      create: { id: 'pull-li-other-hh', name: 'Other HH LI', ownerId: otherUser.id, users: { connect: { id: otherUser.id } } },
    });

    const otherStore = await db(app).store.upsert({
      where: { id: 'pull-li-other-store' },
      update: {},
      create: { id: 'pull-li-other-store', name: 'Other Store LI', householdId: otherHousehold.id },
    });

    const otherList = await db(app).list.upsert({
      where: { id: 'pull-li-other-list' },
      update: {},
      create: { id: 'pull-li-other-list', name: 'Other List', storeId: otherStore.id },
    });

    // Create a catalog item in our store first
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'iso-item',
            name: 'Isolation Item',
            storeId,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    await db(app).listItem.upsert({
      where: { id: 'pull-li-other-li' },
      update: {},
      create: {
        id: 'pull-li-other-li',
        listId: otherList.id,
        itemId: 'iso-item',
        quantity: 1,
      },
    });

    const res = await agent(app)
      .get('/sync/listItem/pull')
      .expect(200);

    const otherLi = res.body.documents.find((d: { id: string }) => d.id === 'pull-li-other-li');
    expect(otherLi).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. Batch size
// ---------------------------------------------------------------------------

describe('Pull batch size', () => {
  it('respects batchSize param', async () => {
    // Create 5 sections
    for (let i = 0; i < 5; i++) {
      await agent(app)
        .post('/sections')
        .send({ name: `Batch Section ${i}`, storeId })
        .expect(201);
      await new Promise((r) => setTimeout(r, 2));
    }

    const res = await agent(app)
      .get('/sync/section/pull?batchSize=3')
      .expect(200);

    expect(res.body.documents).toHaveLength(3);
    expect(res.body.checkpoint).not.toBeNull();
  });

  it('returns all documents when batchSize exceeds count', async () => {
    const res = await agent(app)
      .get('/sync/section/pull?batchSize=100')
      .expect(200);

    // Only 1 section from beforeEach
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.checkpoint).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Unknown collection
// ---------------------------------------------------------------------------

describe('Pull unknown collection', () => {
  it('returns 404 for an unknown collection name', async () => {
    await agent(app).get('/sync/banana/pull').expect(404);
  });
});
