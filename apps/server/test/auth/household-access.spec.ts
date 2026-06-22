/**
 * Integration tests for cross-household authorization.
 *
 * Verifies that users cannot access or mutate resources in households they
 * don't belong to. Per the testing standards, cross-household access MUST
 * return 403 when the resource exists but the user is not a member.
 *
 * Covered:
 *   1. Cross-household store access returns 403
 *   2. Cross-household list access returns 403
 *   3. Cross-household section access returns 403
 *   4. Cross-household item access returns 403
 *   5. Mutations cannot claim a parent in another household (403)
 *   6. Cross-household household access returns 403 for non-members
 *   7. Owner can rename and delete own household
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
let otherHouseholdId: string;
let otherStoreId: string;

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

  // Create our household's store
  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'Our Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;

  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'Our Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;

  // Create another household that our test user does NOT belong to
  const otherUser = await db(app).user.upsert({
    where: { id: 'other-user-id' },
    update: {},
    create: { id: 'other-user-id', email: 'other@test.com', name: 'Other User' },
  });

  const otherHh = await db(app).household.upsert({
    where: { id: 'other-household' },
    update: { users: { connect: { id: otherUser.id } } },
    create: {
      id: 'other-household',
      name: 'Other Household',
      ownerId: otherUser.id,
      users: { connect: { id: otherUser.id } },
    },
  });
  otherHouseholdId = otherHh.id;

  const otherStore = await db(app).store.upsert({
    where: { id: 'other-store' },
    update: {},
    create: {
      id: 'other-store',
      name: 'Other Store',
      householdId: otherHh.id,
    },
  });
  otherStoreId = otherStore.id;
});

// ---------------------------------------------------------------------------
// 1. Cross-household store access
// ---------------------------------------------------------------------------

describe('Cross-household store access', () => {
  it('returns 403 when accessing a store in another household', async () => {
    await agent(app).get(`/stores/${otherStoreId}`).expect(403);
  });

  it('returns 403 when updating a store in another household', async () => {
    await agent(app)
      .patch(`/stores/${otherStoreId}`)
      .send({ name: 'Hacked' })
      .expect(403);
  });

  it('returns 403 when deleting a store in another household', async () => {
    await agent(app).delete(`/stores/${otherStoreId}`).expect(403);
  });

  it('returns 403 when creating a section in another household store', async () => {
    await agent(app)
      .post('/sections')
      .send({ name: 'Cross Section', storeId: otherStoreId })
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 2. Cross-household list access
// ---------------------------------------------------------------------------

describe('Cross-household list access', () => {
  it('returns 403 when accessing a list in another household', async () => {
    const otherList = await db(app).list.create({
      data: { id: 'other-list', name: 'Other List', storeId: otherStoreId },
    });

    await agent(app).get(`/lists/${otherList.id}`).expect(403);
  });

  it('returns 403 when creating a list in another household store', async () => {
    await agent(app)
      .post('/lists')
      .send({ storeId: otherStoreId })
      .expect(403);
  });

  it('returns 403 when adding an item to a list in another household', async () => {
    const otherList = await db(app).list.create({
      data: { id: 'other-list-2', name: 'Other List 2', storeId: otherStoreId },
    });

    await agent(app)
      .post('/lists/items/add')
      .send({ listId: otherList.id, name: 'Cross Item', sectionId, quantity: 1 })
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 3. Cross-household section access
// ---------------------------------------------------------------------------

describe('Cross-household section access', () => {
  it('returns 403 when getting sections for another household store', async () => {
    await db(app).section.create({
      data: { id: 'other-section', name: 'Other Section', storeId: otherStoreId },
    });

    await agent(app).get(`/sections/store/${otherStoreId}`).expect(403);
  });

  it('returns 403 when updating a section in another household', async () => {
    const otherSection = await db(app).section.create({
      data: { id: 'other-section-2', name: 'Other Section 2', storeId: otherStoreId },
    });

    await agent(app)
      .patch(`/sections/${otherSection.id}`)
      .send({ name: 'Hacked Section' })
      .expect(403);
  });

  it('returns 403 when reordering sections in another household', async () => {
    await agent(app)
      .post(`/sections/store/${otherStoreId}/reorder`)
      .send({ orderedIds: ['some-id'] })
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 4. Cross-household item access
// ---------------------------------------------------------------------------

describe('Cross-household item access', () => {
  it('returns 403 when updating an item in another household', async () => {
    const otherItem = await db(app).item.create({
      data: { id: 'other-item', name: 'Other Item', storeId: otherStoreId, purchaseCount: 0 },
    });

    await agent(app)
      .patch(`/items/${otherItem.id}`)
      .send({ name: 'Hacked Item' })
      .expect(403);
  });

  it('returns 403 when searching items in another household store', async () => {
    await agent(app)
      .get(`/items/search?storeId=${otherStoreId}&query=test`)
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 5. Mutations cannot claim parent in another household
// ---------------------------------------------------------------------------

describe('Parent household validation on create', () => {
  it('returns 404 when creating a store with a non-existent householdId', async () => {
    await agent(app)
      .post('/stores')
      .send({ name: 'Ghost Store', householdId: 'non-existent-household' })
      .expect(404);
  });

  it('returns 403 when creating a store with cross-household householdId', async () => {
    await agent(app)
      .post('/stores')
      .send({ name: 'Cross Store', householdId: otherHouseholdId })
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 6. Household access
// ---------------------------------------------------------------------------

describe('Household access control', () => {
  it('returns 403 when a non-member tries to patch another household', async () => {
    await agent(app)
      .patch(`/households/${otherHouseholdId}`)
      .send({ name: 'Hacked' })
      .expect(403);
  });

  it('allows owner to rename their household', async () => {
    await agent(app)
      .patch(`/households/${householdId}`)
      .send({ name: 'Renamed Household' })
      .expect(200);
  });

  it('allows owner to delete their household (solo member)', async () => {
    // Ensure only the test user is in the household
    await db(app).household.update({
      where: { id: householdId },
      data: {
        users: { set: [{ id: 'test-user-id' }] },
      },
    });
    await agent(app).delete(`/households/${householdId}`).expect(200);
  });

  it('returns 403 when a non-member accesses another household endpoint', async () => {
    await agent(app)
      .patch(`/households/${otherHouseholdId}`)
      .send({ name: 'Hacked' })
      .expect(403);
  });
});

// ---------------------------------------------------------------------------
// 7. Own household access works correctly
// ---------------------------------------------------------------------------

describe('Own household access', () => {
  it('returns 200 for the user own household', async () => {
    const res = await agent(app).get('/households').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(householdId);
  });

  it('returns 200 when owner accesses their own store', async () => {
    const res = await agent(app).get(`/stores/${storeId}`).expect(200);
    expect(res.body.name).toBe('Our Store');
  });
});
