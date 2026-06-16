/**
 * Milestone 1 smoke tests — soft-delete behaviour
 *
 * Each test verifies two things:
 *   1. The API returns the expected "gone" response after deletion.
 *   2. The DB row is still there with deleted=true / deletedAt set.
 *
 * Scenarios:
 *   1. Delete a ListItem   — simplest, no cascade
 *   2. Delete a Section    — cascades: items lose their sectionId (SetNull)
 *   3. Delete a Store      — deepest cascade: Section, Item, List, ListItem all soft-deleted
 *   4. Re-add a removed item — upsert resurrection, no unique constraint violation
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

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await clearDomainData(db(app));
  await seedBaseFixtures(db(app));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a store via the API and returns its id. */
async function createStore(name = 'Test Store'): Promise<string> {
  const res = await agent(app)
    .post('/stores')
    .send({ name, householdId: 'test-household-id' })
    .expect(201);
  return res.body.id;
}

/** Creates a section via the API and returns its id. */
async function createSection(storeId: string, name = 'Dairy'): Promise<string> {
  const res = await agent(app)
    .post('/sections')
    .send({ name, storeId })
    .expect(201);
  return res.body.id;
}

/** Creates a list (or returns existing active list) and returns its id. */
async function createList(storeId: string): Promise<string> {
  const res = await agent(app)
    .post('/lists')
    .send({ storeId })
    .expect(201);
  return res.body.id;
}

/** Adds an item to a list and returns the listItem id. */
async function addItem(listId: string, name: string, sectionId: string): Promise<string> {
  const res = await agent(app)
    .post('/lists/items/add')
    .send({ listId, name, sectionId, quantity: 1 })
    .expect(201);
  return res.body.id;
}

// ---------------------------------------------------------------------------
// Scenario 1: Delete a ListItem — no cascade, just the row
// ---------------------------------------------------------------------------

describe('1. soft-delete a ListItem', () => {
  it('marks the row deleted=true in DB and removes it from the list response', async () => {
    const storeId = await createStore('Store-S1');
    const sectionId = await createSection(storeId, 'Fruit');
    const listId = await createList(storeId);
    const listItemId = await addItem(listId, 'Apples', sectionId);

    // Verify it appears in the list before deletion
    const before = await agent(app).get(`/lists/${listId}`).expect(200);
    expect(before.body.items.some((i: { id: string }) => i.id === listItemId)).toBe(true);

    // Delete it
    await agent(app).delete(`/lists/items/${listItemId}`).expect(200);

    // API: item is gone from the list
    const after = await agent(app).get(`/lists/${listId}`).expect(200);
    expect(after.body.items.some((i: { id: string }) => i.id === listItemId)).toBe(false);

    // DB: row still exists, marked deleted
    const row = await db(app).listItem.findFirst({
      where: { id: listItemId },
    });
    expect(row).not.toBeNull();
    expect(row!.deleted).toBe(true);
    expect(row!.deletedAt).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scenario 2: Delete a Section — items lose their sectionId (SetNull cascade)
// ---------------------------------------------------------------------------

describe('2. soft-delete a Section', () => {
  it('marks section deleted=true and nulls sectionId on its items', async () => {
    const storeId = await createStore('Store-S2');
    const sectionId = await createSection(storeId, 'Bakery');
    const listId = await createList(storeId);

    // Add an item assigned to this section
    await addItem(listId, 'Sourdough', sectionId);

    // Find the catalog item to check sectionId later
    const itemBefore = await db(app).item.findFirst({
      where: { storeId, name: 'Sourdough' },
    });
    expect(itemBefore!.sectionId).toBe(sectionId);

    // Delete the section
    await agent(app).delete(`/sections/${sectionId}`).expect(200);

    // API: section is gone from the store
    const sectionsAfter = await agent(app)
      .get(`/sections/store/${storeId}`)
      .expect(200);
    expect(sectionsAfter.body.some((s: { id: string }) => s.id === sectionId)).toBe(false);

    // DB: section row still exists, marked deleted
    const sectionRow = await db(app).section.findFirst({
      where: { id: sectionId },
    });
    expect(sectionRow!.deleted).toBe(true);
    expect(sectionRow!.deletedAt).not.toBeNull();

    // DB: item is still alive but sectionId was nulled out
    const itemAfter = await db(app).item.findFirst({
      where: { storeId, name: 'Sourdough' },
    });
    expect(itemAfter!.deleted).toBe(false);
    expect(itemAfter!.sectionId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scenario 3: Delete a Store — full cascade
// ---------------------------------------------------------------------------

describe('3. soft-delete a Store (cascade)', () => {
  it('marks Store, Section, Item, List, ListItem all deleted=true', async () => {
    const storeId = await createStore('Store-S3');
    const sectionId = await createSection(storeId, 'Produce');
    const listId = await createList(storeId);
    const listItemId = await addItem(listId, 'Bananas', sectionId);

    // Capture the catalog item id
    const itemRow = await db(app).item.findFirst({ where: { storeId, name: 'Bananas' } });
    const itemId = itemRow!.id;

    // Delete the store
    await agent(app).delete(`/stores/${storeId}`).expect(200);

    // API: store is gone from the list
    const storesAfter = await agent(app)
      .get('/stores?householdId=test-household-id')
      .expect(200);
    expect(storesAfter.body.some((s: { id: string }) => s.id === storeId)).toBe(false);

    // DB: all 5 entity types are soft-deleted
    const store = await db(app).store.findFirst({ where: { id: storeId } });
    expect(store!.deleted).toBe(true);
    expect(store!.deletedAt).not.toBeNull();

    const section = await db(app).section.findFirst({ where: { id: sectionId } });
    expect(section!.deleted).toBe(true);

    const item = await db(app).item.findFirst({ where: { id: itemId } });
    expect(item!.deleted).toBe(true);

    const list = await db(app).list.findFirst({ where: { id: listId } });
    expect(list!.deleted).toBe(true);

    const listItem = await db(app).listItem.findFirst({ where: { id: listItemId } });
    expect(listItem!.deleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4: Re-add an item after removing it from a list (upsert resurrection)
// ---------------------------------------------------------------------------

describe('4. re-add a removed item (upsert resurrection)', () => {
  it('succeeds without a unique constraint error when the catalog item was soft-deleted', async () => {
    const storeId = await createStore('Store-S4');
    const sectionId = await createSection(storeId, 'Dairy');
    const listId = await createList(storeId);

    // Add "Milk", then remove it from the list
    const listItemId = await addItem(listId, 'Milk', sectionId);
    await agent(app).delete(`/lists/items/${listItemId}`).expect(200);

    // Soft-delete the catalog item directly to simulate the worst case:
    // the item row itself is marked deleted (e.g. via a future item-delete endpoint)
    await db(app).item.updateMany({
      where: { storeId, name: 'Milk' },
      data: { deleted: true, deletedAt: new Date() },
    });

    // Re-adding "Milk" must succeed — the upsert resurrects the catalog item
    const res = await agent(app)
      .post('/lists/items/add')
      .send({ listId, name: 'Milk', sectionId, quantity: 2 })
      .expect(201);

    expect(res.body.id).toBeTruthy();

    // DB: the catalog item is alive again
    const itemAfter = await db(app).item.findFirst({ where: { storeId, name: 'Milk' } });
    expect(itemAfter!.deleted).toBe(false);
    expect(itemAfter!.deletedAt).toBeNull();
  });
});
