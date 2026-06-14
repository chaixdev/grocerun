/**
 * Regression tests for Group A: Unique constraint + soft-delete fix.
 *
 * After adding `deleted` to @@unique([storeId, name, deleted]) and
 * @@unique([listId, itemId, deleted]), soft-deleted rows no longer
 * block re-creation of items/listItems with the same natural key.
 *
 * The push handlers now include a pre-create soft-delete restore check:
 * before creating a new row, they look for an existing soft-deleted row
 * with the same natural key and restore it in-place. This prevents
 * zombie tombstone accumulation that would violate the new constraint
 * on a subsequent delete cycle.
 *
 * Tests cover:
 *   1. Item: soft-deleted row is restored when pushing with same (storeId, name)
 *   2. Item: push with same ID restores via the update path
 *   3. ListItem: soft-deleted row is restored when pushing with same (listId, itemId)
 *   4. ListItem: push with same ID restores via the update path
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
let listId: string;

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

  // Create a store
  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'Regression Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  // Create a section
  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'Regression Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;

  // Create a PLANNING list (pushListItems allows any user to push to PLANNING lists)
  const listRes = await agent(app)
    .post('/lists')
    .send({ storeId })
    .expect(201);
  listId = listRes.body.id;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Add an item to a list via the REST endpoint and return both the
 * listItem ID and the catalog item ID.
 */
async function addItem(listId: string, name: string, sectionId: string, quantity = 1) {
  const res = await agent(app)
    .post('/lists/items/add')
    .send({ listId, name, sectionId, quantity })
    .expect(201);
  return {
    listItemId: res.body.id,
    itemId: res.body.itemId,
  };
}

// ---------------------------------------------------------------------------
// 1. Item: soft-deleted row restored via pre-create check
// ---------------------------------------------------------------------------

describe('Item: soft-delete → push restores via pre-create check', () => {
  it('restores the old soft-deleted item row when pushing with same (storeId, name) but new ID', async () => {
    // Add an item to establish it in the catalog
    const { itemId } = await addItem(listId, 'Milk', sectionId);

    // Soft-delete the catalog item
    await db(app).item.update({
      where: { id: itemId },
      data: { deleted: true, deletedAt: new Date() },
    });

    // Confirm it's soft-deleted
    const before = await db(app).item.findUnique({ where: { id: itemId } });
    expect(before!.deleted).toBe(true);

    // Push with a brand-new document ID, but same (storeId, name).
    // The pre-create restore check should revive the OLD row.
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'new-milk-id',
            name: 'Milk',
            storeId,
            sectionId,
            defaultUnit: 'carton',
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // No conflicts — the push was accepted
    expect(pushRes.body).toEqual([]);

    // The OLD item was restored (not a new row)
    const oldItem = await db(app).item.findUnique({ where: { id: itemId } });
    expect(oldItem).not.toBeNull();
    expect(oldItem!.deleted).toBe(false);
    expect(oldItem!.deletedAt).toBeNull();
    expect(oldItem!.name).toBe('Milk');

    // No new row was created with the new ID
    const newItem = await db(app).item.findUnique({ where: { id: 'new-milk-id' } });
    expect(newItem).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Item: same-ID push restores via update path
// ---------------------------------------------------------------------------

describe('Item: soft-delete → push restore with same ID', () => {
  it('restores a soft-deleted item when pushed with the same ID', async () => {
    const { itemId } = await addItem(listId, 'Bread', sectionId);

    // Soft-delete the item
    await db(app).item.update({
      where: { id: itemId },
      data: { deleted: true, deletedAt: new Date() },
    });

    // Push the same item with _deleted: false (RxDB "un-delete")
    const pushRes = await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: itemId,
            name: 'Bread',
            storeId,
            sectionId,
            updatedAt: new Date().toISOString(),
            _deleted: false,
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // DB: item is active again
    const item = await db(app).item.findUnique({ where: { id: itemId } });
    expect(item!.deleted).toBe(false);
    expect(item!.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. ListItem: soft-deleted row restored via pre-create check
// ---------------------------------------------------------------------------

describe('ListItem: soft-delete → push restores via pre-create check', () => {
  it('restores the old soft-deleted listItem when pushing with same (listId, itemId) but new ID', async () => {
    const { listItemId, itemId } = await addItem(listId, 'Eggs', sectionId);

    // Soft-delete the listItem
    await agent(app).delete(`/lists/items/${listItemId}`).expect(200);

    // Confirm it's soft-deleted
    const before = await db(app).listItem.findUnique({ where: { id: listItemId } });
    expect(before!.deleted).toBe(true);

    // Push with a brand-new document ID, but same (listId, itemId).
    // The pre-create restore check should revive the OLD row.
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: 'new-eggs-li-id',
            listId,
            itemId,
            isChecked: false,
            quantity: 6,
            updatedAt: new Date().toISOString(),
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // No conflicts — push accepted
    expect(pushRes.body).toEqual([]);

    // The OLD listItem was restored
    const oldLI = await db(app).listItem.findUnique({ where: { id: listItemId } });
    expect(oldLI).not.toBeNull();
    expect(oldLI!.deleted).toBe(false);
    expect(oldLI!.deletedAt).toBeNull();
    expect(oldLI!.quantity).toBe(6);

    // No new row was created with the new ID
    const newLI = await db(app).listItem.findUnique({ where: { id: 'new-eggs-li-id' } });
    expect(newLI).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. ListItem: same-ID push restores via update path
// ---------------------------------------------------------------------------

describe('ListItem: soft-delete → push restore with same ID', () => {
  it('restores a soft-deleted listItem when pushed with the same ID', async () => {
    const { listItemId, itemId } = await addItem(listId, 'Butter', sectionId);

    // Soft-delete the listItem
    await agent(app).delete(`/lists/items/${listItemId}`).expect(200);

    // Push the same listItem with _deleted: false
    const pushRes = await agent(app)
      .post('/sync/listItem/push')
      .send([
        {
          newDocumentState: {
            id: listItemId,
            listId,
            itemId,
            isChecked: true,
            quantity: 3,
            updatedAt: new Date().toISOString(),
            _deleted: false,
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    expect(pushRes.body).toEqual([]);

    // DB: listItem is active again, with updated data
    const li = await db(app).listItem.findUnique({ where: { id: listItemId } });
    expect(li!.deleted).toBe(false);
    expect(li!.deletedAt).toBeNull();
    expect(li!.quantity).toBe(3);
    expect(li!.isChecked).toBe(true);
  });
});
