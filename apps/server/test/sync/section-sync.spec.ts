import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  db,
  seedBaseFixtures,
  clearDomainData,
} from '../helpers';

// ---------------------------------------------------------------------------
// Sync endpoint integration tests — Section collection
//
// Tests are grouped around the three RxDB replication endpoints:
//   GET  /sync/section/pull
//   POST /sync/section/push
//   GET  /sync/section/stream
//
// Auth is exercised via the real AuthGuard + test JWT (see helpers.ts).
// All tests run against test.db in a single NestJS app instance.
// ---------------------------------------------------------------------------

let app: INestApplication;
let householdId: string;
let storeId: string;

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

  // Create a store to attach sections to
  const res = await agent(app)
    .post('/stores')
    .send({ name: 'Sync Test Store', householdId })
    .expect(201);
  storeId = res.body.id;
});

// ---------------------------------------------------------------------------
// Pull
// ---------------------------------------------------------------------------

describe('GET /sync/section/pull', () => {
  it('returns empty documents and null checkpoint when no sections exist', async () => {
    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    expect(res.body.documents).toEqual([]);
    expect(res.body.checkpoint).toBeNull();
  });

  it('returns all sections with correct shape', async () => {
    // Create two sections via the existing REST API
    await agent(app).post('/sections').send({ name: 'Dairy', storeId }).expect(201);
    await agent(app).post('/sections').send({ name: 'Bakery', storeId }).expect(201);

    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    expect(res.body.documents).toHaveLength(2);
    expect(res.body.checkpoint).not.toBeNull();

    const doc = res.body.documents[0];
    expect(doc).toHaveProperty('id');
    expect(doc).toHaveProperty('name');
    expect(doc).toHaveProperty('order');
    expect(doc).toHaveProperty('storeId', storeId);
    expect(doc).toHaveProperty('updatedAt');
    expect(doc).toHaveProperty('_deleted', false);
  });

  it('includes soft-deleted sections as tombstones (_deleted: true)', async () => {
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Produce', storeId })
      .expect(201);
    const sectionId = createRes.body.id;

    await agent(app).delete(`/sections/${sectionId}`).expect(200);

    const res = await agent(app)
      .get('/sync/section/pull')
      .expect(200);

    const tombstone = res.body.documents.find((d: any) => d.id === sectionId);
    expect(tombstone).toBeDefined();
    expect(tombstone._deleted).toBe(true);
  });

  it('respects checkpoint cursor — only returns documents updated after it', async () => {
    // Create first section
    await agent(app).post('/sections').send({ name: 'Dairy', storeId }).expect(201);

    // Pull to get checkpoint
    const firstPull = await agent(app).get('/sync/section/pull').expect(200);
    expect(firstPull.body.documents).toHaveLength(1);
    const checkpoint = firstPull.body.checkpoint;

    // Wait 1ms so updatedAt is strictly greater (SQLite datetime precision)
    await new Promise((r) => setTimeout(r, 2));

    // Create second section
    await agent(app).post('/sections').send({ name: 'Bakery', storeId }).expect(201);

    // Pull from checkpoint — should only return Bakery
    const secondPull = await agent(app)
      .get(`/sync/section/pull?updatedAt=${checkpoint.updatedAt}&id=${checkpoint.id}`)
      .expect(200);

    expect(secondPull.body.documents).toHaveLength(1);
    expect(secondPull.body.documents[0].name).toBe('Bakery');
  });

  it('respects batchSize param', async () => {
    // Create 3 sections
    for (const name of ['A', 'B', 'C']) {
      await agent(app).post('/sections').send({ name, storeId }).expect(201);
      await new Promise((r) => setTimeout(r, 2)); // ensure distinct updatedAt
    }

    const res = await agent(app)
      .get('/sync/section/pull?batchSize=2')
      .expect(200);

    expect(res.body.documents).toHaveLength(2);
    expect(res.body.checkpoint).not.toBeNull();
  });

  it('returns 404 for unknown collection', async () => {
    await agent(app).get('/sync/banana/pull').expect(404);
  });
});

// ---------------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------------

describe('POST /sync/section/push', () => {
  it('inserts a new section when assumedMasterState is null', async () => {
    const newId = 'sync-test-section-id';

    const res = await agent(app)
      .post('/sync/section/push')
      .send([
        {
          newDocumentState: {
            id: newId,
            name: 'Frozen',
            order: 0,
            storeId,
            updatedAt: new Date().toISOString(),
            _deleted: false,
          },
          assumedMasterState: null,
        },
      ])
      .expect(200);

    // No conflicts
    expect(res.body).toEqual([]);

    // Verify in DB
    const section = await db(app).section.findUnique({ where: { id: newId } });
    expect(section).not.toBeNull();
    expect(section!.name).toBe('Frozen');
  });

  it('updates an existing section when assumedMasterState matches server', async () => {
    // Create via pull endpoint to get real updatedAt
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Dairy', storeId })
      .expect(201);
    const sectionId = createRes.body.id;

    const pullRes = await agent(app).get('/sync/section/pull').expect(200);
    const serverDoc = pullRes.body.documents.find((d: any) => d.id === sectionId);

    const res = await agent(app)
      .post('/sync/section/push')
      .send([
        {
          newDocumentState: { ...serverDoc, name: 'Dairy & Eggs' },
          assumedMasterState: serverDoc,
        },
      ])
      .expect(200);

    expect(res.body).toEqual([]);

    const updated = await db(app).section.findUnique({ where: { id: sectionId } });
    expect(updated!.name).toBe('Dairy & Eggs');
  });

  it('returns conflict when assumedMasterState is stale', async () => {
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Dairy', storeId })
      .expect(201);
    const sectionId = createRes.body.id;

    // Get real server doc
    const pullRes = await agent(app).get('/sync/section/pull').expect(200);
    const serverDoc = pullRes.body.documents.find((d: any) => d.id === sectionId);

    // Mutate on server (advancing updatedAt)
    await new Promise((r) => setTimeout(r, 2));
    await agent(app).patch(`/sections/${sectionId}`).send({ name: 'Dairy 2' }).expect(200);

    // Push with stale assumedMasterState
    const res = await agent(app)
      .post('/sync/section/push')
      .send([
        {
          newDocumentState: { ...serverDoc, name: 'Client Version' },
          assumedMasterState: serverDoc, // stale — server has moved on
        },
      ])
      .expect(200);

    // Should return the current master state as a conflict
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Dairy 2');
    expect(res.body[0]._deleted).toBe(false);
  });

  it('soft-deletes a section via push (_deleted: true)', async () => {
    const createRes = await agent(app)
      .post('/sections')
      .send({ name: 'Dairy', storeId })
      .expect(201);
    const sectionId = createRes.body.id;

    const pullRes = await agent(app).get('/sync/section/pull').expect(200);
    const serverDoc = pullRes.body.documents.find((d: any) => d.id === sectionId);

    const res = await agent(app)
      .post('/sync/section/push')
      .send([
        {
          newDocumentState: { ...serverDoc, _deleted: true },
          assumedMasterState: serverDoc,
        },
      ])
      .expect(200);

    expect(res.body).toEqual([]);

    const deleted = await db(app).section.findUnique({ where: { id: sectionId } });
    expect(deleted!.deleted).toBe(true);
    expect(deleted!.deletedAt).not.toBeNull();
  });

  it('returns 403 when pushing to a store the user does not own', async () => {
    // Create a second user + household with its own store (test user is not a member)
    await db(app).user.upsert({
      where: { id: 'other-user' },
      update: {},
      create: { id: 'other-user', email: 'other@test.test', name: 'Other' },
    });
    const otherHousehold = await db(app).household.upsert({
      where: { id: 'other-household' },
      update: {},
      create: { id: 'other-household', name: 'Other Household', ownerId: 'other-user' },
    });
    const otherStore = await db(app).store.create({
      data: { name: 'Other Store', householdId: otherHousehold.id },
    });

    await agent(app)
      .post('/sync/section/push')
      .send([
        {
          newDocumentState: {
            id: 'foreign-section',
            name: 'Intruder',
            order: 0,
            storeId: otherStore.id,
            updatedAt: new Date().toISOString(),
            _deleted: false,
          },
          assumedMasterState: null,
        },
      ])
      .expect(403);
  });

  it('returns 404 for unknown collection', async () => {
    await agent(app).post('/sync/banana/push').send([]).expect(404);
  });
});

// ---------------------------------------------------------------------------
// Stream (SSE)
// ---------------------------------------------------------------------------

describe('GET /sync/section/stream', () => {
  it('returns SSE content-type and an initial RESYNC event', async () => {
    const { makeTestToken } = await import('../helpers');
    const token = makeTestToken();

    // Ensure the underlying HTTP server is listening on a port
    const server = app.getHttpServer();
    await new Promise<void>((res) => {
      if (server.listening) return res();
      server.listen(0, res);
    });
    const port = (server.address() as any).port;

    await new Promise<void>((resolve, reject) => {
      const req = require('http').get(
        {
          hostname: '127.0.0.1',
          port,
          path: '/sync/section/stream',
          headers: { Authorization: `Bearer ${token}` },
        },
        (res: any) => {
          expect(res.headers['content-type']).toMatch(/text\/event-stream/);
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
            if (data.includes('\n\n')) {
              expect(data).toContain('event: RESYNC');
              expect(data).toContain('data:');
              res.destroy();
              resolve();
            }
          });
          res.on('error', () => resolve()); // destroyed — not a failure
        },
      );
      req.on('error', reject);
      setTimeout(() => reject(new Error('SSE timeout')), 3000);
    });
  });
});
