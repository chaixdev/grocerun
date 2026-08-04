/**
 * Integration tests for SSE broadcast wiring on the sync push path.
 *
 * GROCERUN-61 — SSE transport over-fetch regression tests. These two
 * behaviors shipped with zero tests:
 *   4. Push broadcasts to every household connection, including the pusher,
 *      with a collection-scoped payload for canonical-state reconciliation.
 *   5. REST mutations advertise every replicated collection modified by a
 *      cascade or server-side side effect.
 */
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  db,
  seedBaseFixtures,
  clearDomainData,
  waitForAppReady,
  TEST_USER_ID,
} from '../helpers';
import { SseBroadcastService } from '../../src/sync/sse-broadcast.service';

let app: INestApplication;
let householdId: string;
let storeId: string;
let sectionId: string;
let notifySpy: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  app = await createTestApp();
  await waitForAppReady(app);
  notifySpy = vi.spyOn(app.get(SseBroadcastService), 'notifyChanged');
});

afterAll(async () => {
  notifySpy.mockRestore();
  await app.close();
});

beforeEach(async () => {
  await clearDomainData(db(app));
  const fixtures = await seedBaseFixtures(db(app));
  householdId = fixtures.householdId;
  const storeRes = await agent(app)
    .post('/stores')
    .send({ name: 'SSE Test Store', householdId })
    .expect(201);
  storeId = storeRes.body.id;
  const sectionRes = await agent(app)
    .post('/sections')
    .send({ name: 'SSE Test Section', storeId })
    .expect(201);
  sectionId = sectionRes.body.id;
  await vi.waitFor(() => expect(notifySpy).toHaveBeenCalledTimes(2));
  notifySpy.mockClear();
});

afterEach(() => {
  notifySpy.mockClear();
});

describe('sync push broadcast', () => {
  it('notifies the pusher with a collection-scoped payload', async () => {
    const now = new Date().toISOString();
    await agent(app)
      .post('/sync/item/push')
      .send([
        {
          newDocumentState: {
            id: 'sse-notify-item-1',
            name: 'Push-Notified Item',
            storeId,
            sectionId,
            defaultUnit: 'piece',
            updatedAt: now,
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    await vi.waitFor(() => expect(notifySpy).toHaveBeenCalled());
    expect(notifySpy).toHaveBeenCalledWith(
      [TEST_USER_ID],
      { collections: ['item'], reason: 'item.push' },
    );
  });
});

async function expectOneBroadcast(collections: string[]) {
  await vi.waitFor(() => expect(notifySpy).toHaveBeenCalledTimes(1));
  const [userIds, payload] = notifySpy.mock.calls[0];
  expect(userIds).toContain(TEST_USER_ID);
  expect(payload).toEqual({ collections, reason: expect.any(String) });
}

async function clearAfterBroadcast() {
  await vi.waitFor(() => expect(notifySpy).toHaveBeenCalled());
  notifySpy.mockClear();
}

describe('REST mutation broadcast manifests', () => {
  it('notifies the mutator after a store create', async () => {
    await agent(app)
      .post('/stores')
      .send({ name: 'REST-Notify Store', householdId })
      .expect(201);

    await expectOneBroadcast(['store']);
  });

  it('includes every child collection after a store cascade delete', async () => {
    await agent(app)
      .post('/lists')
      .send({ storeId, name: 'Cascade list' })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app)
      .post('/lists/items/add')
      .send({ listId: (await db(app).list.findFirst({ where: { storeId, deleted: false } }))!.id, name: 'Cascade item', sectionId, quantity: 1 })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app).delete(`/stores/${storeId}`).expect(200);

    await expectOneBroadcast(['store', 'section', 'item', 'list', 'listItem']);
  });

  it('includes items when deleting a section reassigns them', async () => {
    await agent(app)
      .post('/lists')
      .send({ storeId, name: 'Section cascade list' })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app)
      .post('/lists/items/add')
      .send({ listId: (await db(app).list.findFirst({ where: { storeId, deleted: false } }))!.id, name: 'Section cascade item', sectionId, quantity: 1 })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app).delete(`/sections/${sectionId}`).expect(200);

    await expectOneBroadcast(['section', 'item']);
  });

  it('includes catalog items when adding a list item can create or restore one', async () => {
    const listRes = await agent(app)
      .post('/lists')
      .send({ storeId, name: 'Item side-effect list' })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app)
      .post('/lists/items/add')
      .send({ listId: listRes.body.id, name: 'New catalog item', sectionId, quantity: 1 })
      .expect(201);

    await expectOneBroadcast(['item', 'listItem']);
  });

  it('includes catalog items when completing a list updates purchase statistics', async () => {
    const listRes = await agent(app)
      .post('/lists')
      .send({ storeId, name: 'Completion side-effect list' })
      .expect(201);
    await clearAfterBroadcast();

    await agent(app)
      .post('/lists/items/add')
      .send({ listId: listRes.body.id, name: 'Purchased item', sectionId, quantity: 1 })
      .expect(201);
    await clearAfterBroadcast();

    await db(app).listItem.updateMany({
      where: { listId: listRes.body.id },
      data: { isChecked: true },
    });
    await agent(app).post(`/lists/${listRes.body.id}/complete`).expect(201);

    await expectOneBroadcast(['list', 'item', 'listItem']);
  });
});
