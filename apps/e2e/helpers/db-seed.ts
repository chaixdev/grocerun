import { PrismaClient } from '../../server/src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';

export type SeededUser = {
  id: string;
  email: string;
  name: string;
};

export type SeededHousehold = {
  id: string;
  name: string;
};

// Each worker process gets its own Prisma instance (no cross-process sharing via globalThis)
let _prisma: PrismaClient | undefined;

function getDbUrl(): string {
  // The running dev servers use apps/web/dev.db.
  // We point at the same file so that seeds are visible to the live Next.js + NestJS servers.
  const dbPath = path.resolve(__dirname, '../../web/dev.db');
  return dbPath;
}

function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const dbPath = getDbUrl();

  // Configure WAL mode + timeout via a short-lived direct connection before Prisma opens its own.
  // WAL mode persists in the DB file so Prisma's subsequent connection benefits from it.
  const configDb = new Database(dbPath, { timeout: 10000 });
  configDb.pragma('journal_mode = WAL');
  configDb.pragma('busy_timeout = 10000');
  configDb.close();

  // PrismaBetterSqlite3 requires { url: string } — pass the absolute file path as a file:// URL.
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

export async function seedIsolatedUserWithHousehold(params: {
  userId: string;
  email: string;
  name: string;
  householdName: string;
}): Promise<{ user: SeededUser; household: SeededHousehold }> {
  const prisma = getPrisma();

  const user = await prisma.user.upsert({
    where: { id: params.userId },
    update: {
      email: params.email,
      name: params.name,
    },
    create: {
      id: params.userId,
      email: params.email,
      name: params.name,
    },
    select: { id: true, email: true, name: true },
  });

  // Ensure the user ends up with exactly one household for deterministic API behavior.
  // Delete ALL households previously owned by this user (including their stores, lists, etc.)
  // and disconnect the user from any households they were a member of (but didn't own).
  const existingOwnedHouseholds = await prisma.household.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (existingOwnedHouseholds.length > 0) {
    // Cascade-delete owned households (Prisma cascade will remove related stores/lists/etc.)
    await prisma.household.deleteMany({
      where: { ownerId: user.id },
    });
  }

  // Also disconnect from any households the user was a member of but didn't own
  const memberHouseholds = await prisma.household.findMany({
    where: { users: { some: { id: user.id } } },
    select: { id: true },
  });

  if (memberHouseholds.length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        households: {
          disconnect: memberHouseholds.map((h) => ({ id: h.id })),
        },
      },
    });
  }

  const household = await prisma.household.create({
    data: {
      name: params.householdName,
      ownerId: user.id,
      users: { connect: { id: user.id } },
    },
    select: { id: true, name: true },
  });

  return {
    user: {
      id: user.id,
      email: user.email ?? params.email,
      name: user.name ?? params.name,
    },
    household,
  };
}
