import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

// ---------------------------------------------------------------------------
// Auth bypass
// ---------------------------------------------------------------------------

/**
 * A no-op guard that skips JWT verification and injects a fixed test user.
 * We use the real JWT path for the token so CurrentUser() still works —
 * we just sign it ourselves with the test secret.
 */
export const TEST_USER_ID = 'test-user-id';
export const TEST_USER_EMAIL = 'test@grocerun.test';

export function makeTestToken(): string {
  return jwt.sign(
    { sub: TEST_USER_ID, email: TEST_USER_EMAIL },
    process.env.AUTH_SECRET!,
    { expiresIn: '1h' },
  );
}

// We keep the real AuthGuard wired up and just sign tokens ourselves.
// This means auth logic IS exercised, and we don't need a mock.
// The only thing we need is for a User row to exist in the DB for the test.

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully bootstrapped NestJS application backed by test.db.
 * Call this in beforeAll, close it in afterAll.
 *
 * DATABASE_URL is already set to file:./test.db by globalSetup via .env.test.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  return app;
}

// ---------------------------------------------------------------------------
// Supertest helper
// ---------------------------------------------------------------------------

/**
 * Returns a supertest agent pre-configured with the test JWT.
 * Usage: const api = agent(app); await api.get('/stores').expect(200);
 */
export function agent(app: INestApplication) {
  const token = makeTestToken();
  return {
    get: (url: string) =>
      supertest(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      supertest(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      supertest(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      supertest(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`),
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
    update: {},
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
