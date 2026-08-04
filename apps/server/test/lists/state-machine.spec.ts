/**
 * Integration tests for List state machine transitions.
 *
 * Validates the PLANNING → SHOPPING → COMPLETED lifecycle, cancelShopping,
 * completed list immutability, and collaborative shopping: any authorised
 * household member may mutate a PLANNING/SHOPPING list.
 *
 * Covered:
 *   1. PLANNING → SHOPPING happy path (startShopping)
 *   2. SHOPPING → COMPLETED happy path (completeList)
 *   3. SHOPPING → PLANNING via cancelShopping
 *   4. Completed lists are immutable (toggle, addItem, startShopping blocked)
 *   5. Collaborative shopping — second household member can mutate a
 *      SHOPPING list, cancel, and complete one started by another member
 *   6. startShopping is idempotent when the list is already SHOPPING
 *   7. Cannot start shopping on a COMPLETED list
 *   8. Cannot cancel shopping on a non-SHOPPING list
 *   9. Cross-household access is still 403
 *  10. List retrieval preserves status (no assignedTo)
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

  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'State Machine Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'State Machine Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createList(name = 'State Test List'): Promise<string> {
  const res = await agent(app)
    .post('/lists')
    .send({ storeId, name })
    .expect(201);
  return res.body.id;
}

async function addItem(listId: string, itemName: string, quantity = 1) {
  const res = await agent(app)
    .post('/lists/items/add')
    .send({ listId, name: itemName, sectionId, quantity })
    .expect(201);
  return { listItemId: res.body.id, itemId: res.body.itemId };
}

// ---------------------------------------------------------------------------
// 1. PLANNING → SHOPPING happy path
// ---------------------------------------------------------------------------

describe('startShopping', () => {
  it('transitions list from PLANNING to SHOPPING', async () => {
    const listId = await createList();

    const res = await agent(app)
      .post(`/lists/${listId}/start-shopping`)
      .expect(201);

    expect(res.body.success).toBe(true);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('SHOPPING');
  });

  it('is idempotent when the list is already SHOPPING (same member)', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // A second start-shopping call returns success without altering status.
    const res = await agent(app)
      .post(`/lists/${listId}/start-shopping`)
      .expect(201);
    expect(res.body.success).toBe(true);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('SHOPPING');
  });

  it('is idempotent when another member calls startShopping on an already-SHOPPING list', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    // Second household member re-issuing startShopping: list stays SHOPPING.
    const res = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post(`/lists/${listId}/start-shopping`)
      .expect(201);
    expect(res.body.success).toBe(true);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('SHOPPING');
  });

  it('returns 400 for COMPLETED list', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .post(`/lists/${listId}/start-shopping`)
      .expect(400);
  });
});

// ---------------------------------------------------------------------------
// 2. SHOPPING → COMPLETED happy path
// ---------------------------------------------------------------------------

describe('completeList', () => {
  it('transitions list from SHOPPING to COMPLETED', async () => {
    const listId = await createList();
    await addItem(listId, 'Complete Me');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agent(app)
      .post(`/lists/${listId}/complete`)
      .expect(201);

    expect(res.body.success).toBe(true);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('COMPLETED');
  });

  it('does not error when completing a list', async () => {
    const listId = await createList();
    await addItem(listId, 'Completing Item');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    const res = await agent(app).post(`/lists/${listId}/complete`).expect(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 on repeated completion without incrementing purchaseCount twice', async () => {
    const listId = await createList();
    const { listItemId, itemId } = await addItem(listId, 'Purchase Once');

    await agent(app)
      .patch('/lists/items/toggle')
      .send({ listItemId, isChecked: true })
      .expect(200);

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .post(`/lists/${listId}/complete`)
      .expect(400);

    const item = await db(app).item.findUnique({ where: { id: itemId } });
    expect(item!.purchaseCount).toBe(1);
  });

  it('completeList on a PLANNING list completes it directly (no error)', async () => {
    const listId = await createList();

    await agent(app)
      .post(`/lists/${listId}/complete`)
      .expect(201);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('COMPLETED');
  });
});

// ---------------------------------------------------------------------------
// 3. SHOPPING → PLANNING via cancelShopping
// ---------------------------------------------------------------------------

describe('cancelShopping', () => {
  it('transitions list from SHOPPING back to PLANNING', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agent(app)
      .post(`/lists/${listId}/cancel-shopping`)
      .expect(201);

    expect(res.body.success).toBe(true);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('PLANNING');
  });

  it('returns 400 when list is PLANNING', async () => {
    const listId = await createList();

    await agent(app)
      .post(`/lists/${listId}/cancel-shopping`)
      .expect(400);
  });

  it('returns 400 when list is COMPLETED', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .post(`/lists/${listId}/cancel-shopping`)
      .expect(400);
  });
});

// ---------------------------------------------------------------------------
// 4. Completed lists are immutable
// ---------------------------------------------------------------------------

describe('COMPLETED list immutability', () => {
  it('blocks toggleListItem on completed list', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Immutable Item');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .patch('/lists/items/toggle')
      .send({ listItemId, isChecked: true })
      .expect(400);
  });

  it('blocks addItemToList on completed list', async () => {
    const listId = await createList();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .post('/lists/items/add')
      .send({ listId, name: 'Should Not Add', sectionId, quantity: 1 })
      .expect(400);
  });

  it('blocks removeItemFromList on completed list', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Cannot Remove');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .delete(`/lists/items/${listItemId}`)
      .expect(400);
  });

  it('blocks updateListItemQuantity on completed list', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Cannot Change Quantity');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await agent(app)
      .patch('/lists/items/quantity')
      .send({ listItemId, quantity: 5 })
      .expect(400);
  });
});

// ---------------------------------------------------------------------------
// 5. Collaborative shopping — any authorised household member may mutate
// ---------------------------------------------------------------------------

describe('Collaborative shopping', () => {
  it('allows a second household member to add an item to a SHOPPING list', async () => {
    const listId = await createList();
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post('/lists/items/add')
      .send({ listId, name: 'Member Two Adds', sectionId, quantity: 1 })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });

  it('allows a second household member to toggle items on a list started by another member', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Toggle Me');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .patch('/lists/items/toggle')
      .send({ listItemId, isChecked: true })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('allows a second household member to update quantity on a SHOPPING list', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Qty Item');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .patch('/lists/items/quantity')
      .send({ listItemId, quantity: 5 })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('allows a second household member to remove items from a SHOPPING list', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Remove Me');

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    const res = await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .delete(`/lists/items/${listItemId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('allows a second household member to cancel shopping started by another member', async () => {
    const listId = await createList();
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post(`/lists/${listId}/cancel-shopping`)
      .expect(201);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('PLANNING');
  });

  it('allows a second household member to complete a list started by another member', async () => {
    const listId = await createList();
    await addItem(listId, 'Complete Me');
    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);

    await agentAs(app, { userId: TEST_USER_ID_2, email: 'test2@grocerun.test' })
      .post(`/lists/${listId}/complete`)
      .expect(201);

    const list = await db(app).list.findUnique({ where: { id: listId } });
    expect(list!.status).toBe('COMPLETED');
  });
});

// ---------------------------------------------------------------------------
// 6. Cross-household access still forbidden
// ---------------------------------------------------------------------------

describe('Cross-household access', () => {
  it('denies a non-member access to another household\'s list (403)', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Member Item');

    // A user that exists but is not connected to the test household.
    await db(app).user.upsert({
      where: { id: 'other-user-id' },
      update: {},
      create: { id: 'other-user-id', email: 'other@grocerun.test', name: 'Other' },
    });

    await agentAs(app, { userId: 'other-user-id', email: 'other@grocerun.test' })
      .patch('/lists/items/toggle')
      .send({ listItemId, isChecked: true })
      .expect(403);
  });

  it('returns 403 rather than completed-list status errors to non-members', async () => {
    const listId = await createList();
    const { listItemId } = await addItem(listId, 'Completed Member Item');
    await agent(app).post(`/lists/${listId}/complete`).expect(201);

    await db(app).user.upsert({
      where: { id: 'other-user-id' },
      update: {},
      create: { id: 'other-user-id', email: 'other@grocerun.test', name: 'Other' },
    });
    const nonMember = agentAs(app, { userId: 'other-user-id', email: 'other@grocerun.test' });

    await nonMember
      .patch('/lists/items/toggle')
      .send({ listItemId, isChecked: true })
      .expect(403);
    await nonMember
      .patch('/lists/items/quantity')
      .send({ listItemId, quantity: 5 })
      .expect(403);
    await nonMember
      .post('/lists/items/add')
      .send({ listId, name: 'Unauthorized Add', sectionId, quantity: 1 })
      .expect(403);
    await nonMember
      .delete(`/lists/items/${listItemId}`)
      .expect(403);
    await nonMember
      .post(`/lists/${listId}/start-shopping`)
      .expect(403);
    await nonMember
      .post(`/lists/${listId}/complete`)
      .expect(403);
  });

  it('returns 403 rather than a PLANNING-state error when a non-member cancels shopping', async () => {
    const listId = await createList();

    await db(app).user.upsert({
      where: { id: 'other-user-id' },
      update: {},
      create: { id: 'other-user-id', email: 'other@grocerun.test', name: 'Other' },
    });

    await agentAs(app, { userId: 'other-user-id', email: 'other@grocerun.test' })
      .post(`/lists/${listId}/cancel-shopping`)
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 7. List retrieval preserves status (no assignedTo surfaced)
// ---------------------------------------------------------------------------

describe('List status on retrieval', () => {
  it('returns correct status after each transition', async () => {
    const listId = await createList();

    let list = await agent(app).get(`/lists/${listId}`).expect(200);
    expect(list.body.status).toBe('PLANNING');
    expect(list.body.assignedTo).toBeUndefined();

    await agent(app).post(`/lists/${listId}/start-shopping`).expect(201);
    list = await agent(app).get(`/lists/${listId}`).expect(200);
    expect(list.body.status).toBe('SHOPPING');
    expect(list.body.assignedTo).toBeUndefined();

    await agent(app).post(`/lists/${listId}/complete`).expect(201);
    list = await agent(app).get(`/lists/${listId}`).expect(200);
    expect(list.body.status).toBe('COMPLETED');
    expect(list.body.assignedTo).toBeUndefined();
  });

  it('returns 404 for non-existent list', async () => {
    await agent(app).get('/lists/non-existent-id').expect(404);
  });
});
