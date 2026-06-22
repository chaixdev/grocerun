import { INestApplication, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export const TEST_USER_ID = 'test-user-id';
export const TEST_USER_EMAIL = 'test@grocerun.test';
const TEST_SECRET = 'grocerun-test-secret-do-not-use-in-production';

export function makeTestToken(): string {
  return jwt.sign(
    { sub: TEST_USER_ID, email: TEST_USER_EMAIL },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully bootstrapped NestJS application backed by test.db.
 * Call this in beforeAll, close it in afterAll.
 *
 * DATABASE_URL is already set to file:./test.db by globalSetup via .env.test.
 *
 * Auth is handled by AuthGuard's built-in test-mode bypass: when NODE_ENV is
 * "test", it accepts locally-signed JWTs verified with TEST_SECRET directly,
 * without calling out to Google's JWKS endpoint.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  return app;
}

// ---------------------------------------------------------------------------
// Supertest helper
// ---------------------------------------------------------------------------

/**
 * Returns a supertest agent pre-configured with the test JWT.
 * Usage: const api = agent(app); await api.get('/stores').expect(200).
 * Unprefixed URLs are automatically routed through the public /api/v1 prefix
 * so specs mirror browser-facing API paths without repeating the prefix.
 */
export function agent(app: INestApplication) {
  const token = makeTestToken();
  const apiUrl = (url: string) => url.startsWith('/api/v1') ? url : `/api/v1${url}`;

  return {
    get: (url: string) =>
      supertest(app.getHttpServer()).get(apiUrl(url)).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      supertest(app.getHttpServer()).post(apiUrl(url)).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      supertest(app.getHttpServer()).patch(apiUrl(url)).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      supertest(app.getHttpServer()).delete(apiUrl(url)).set('Authorization', `Bearer ${token}`),
  };
}

// ---------------------------------------------------------------------------
// DB access helper
// ---------------------------------------------------------------------------

/**
 * Returns the PrismaService from a running test app.
 * Use this to make direct DB assertions: deleted=true, deletedAt!=null, etc.
 */
export function db(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

// ---------------------------------------------------------------------------
// App readiness helper
// ---------------------------------------------------------------------------

/**
 * Polls the health endpoint until the app responds, or times out.
 * Mitigates intermittent auth/route failures when creating a fresh
 * NestJS app against a SQLite database that may still be releasing
 * locks from a previous test file's app.
 */
export async function waitForAppReady(app: INestApplication, timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  const token = makeTestToken()
  while (Date.now() < deadline) {
    try {
      const res = await supertest(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${token}`)
      if (res.status === 200) return
    } catch {
      // App not ready yet — retry
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  // If we reach here, the app never became ready — let tests proceed and fail naturally
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Ensures the test user and a household exist in test.db, and returns their IDs.
 * Idempotent — safe to call in beforeEach.
 */
export async function seedBaseFixtures(prisma: PrismaService): Promise<{
  userId: string;
  householdId: string;
}> {
  const user = await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: 'Test User',
    },
  });

  const household = await prisma.household.upsert({
    where: { id: 'test-household-id' },
    update: {
      // Fully reset to known state — previous test files may have
      // renamed, deleted, or changed the household.
      name: 'Test Household',
      deleted: false,
      deletedAt: null,
      ownerId: user.id,
      users: { connect: { id: user.id } },
    },
    create: {
      id: 'test-household-id',
      name: 'Test Household',
      ownerId: user.id,
      users: { connect: { id: user.id } },
    },
  });

  return { userId: user.id, householdId: household.id };
}

/**
 * Wipes all domain data between tests so each spec starts clean.
 * Order matters: children before parents to avoid FK violations.
 * Does NOT delete User/Account/Session rows — those are stable fixtures.
 */
export async function clearDomainData(prisma: PrismaService): Promise<void> {
  await prisma.listItem.deleteMany();
  await prisma.list.deleteMany();
  await prisma.item.deleteMany();
  await prisma.section.deleteMany();
  await prisma.store.deleteMany();
  // Keep household and user — recreated by seedBaseFixtures
}
