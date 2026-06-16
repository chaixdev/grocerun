import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  agent,
  db,
  seedBaseFixtures,
  clearDomainData,
} from '../helpers';
import * as http from 'http';

// ---------------------------------------------------------------------------
// Sync endpoint integration tests — Section collection
//
// Tests are grouped around the two remaining RxDB replication endpoints:
//   GET  /sync/section/pull
//   GET  /sync/section/stream
//
// POST /sync/section/push was removed in Phase 5 Step 4 (server-authoritative
// sections — local-first writes are scoped to item and listItem only).
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

    const tombstone = res.body.documents.find((d: { id: string }) => d.id === sectionId);
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
// Stream (SSE)
// ---------------------------------------------------------------------------

describe('GET /api/v1/sync/section/stream', () => {
  it('returns SSE content-type and an initial RESYNC event', async () => {
    const { makeTestToken } = await import('../helpers');
    const token = makeTestToken();

    // Ensure the underlying HTTP server is listening on a port
    const server = app.getHttpServer();
    await new Promise<void>((res) => {
      if (server.listening) return res();
      server.listen(0, res);
    });
    const port = (server.address() as { port: number }).port;

    await new Promise<void>((resolve, reject) => {
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/v1/sync/section/stream',
          headers: { Authorization: `Bearer ${token}` },
        },
        (res: http.IncomingMessage) => {
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
