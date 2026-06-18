/**
 * Item sync — hybrid collection.
 *
 * Pull: client caches all items for local display and search.
 * Push: ACCEPTED for item creation during active shopping (add-to-list).
 *       Duplicate (storeId, name) conflicts are canonicalised server-side.
 *       Item metadata updates (name, section, unit, note) go through REST.
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SyncDeps } from '../sync-deps';
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';
import { pullByAccess } from '../sync-helpers';

export async function pullItems(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  return pullByAccess({
    deps, checkpoint, limit, userId,
    model: deps.prisma.item,
    toDoc: itemToSyncDoc,
    buildBaseFilter: async (d, u) => {
      const ids = await d.getAccessibleStoreIdsForSync(u);
      return ids.length === 0 ? null : { storeId: { in: ids } };
    },
  });
}

export async function pushItems(
  deps: SyncDeps,
  rows: PushRow[],
  userId: string,
): Promise<PushResponse> {
  const conflicts: SyncDocument[] = [];

  for (const row of rows) {
    const { newDocumentState, assumedMasterState } = row;
    const id = newDocumentState.id as string;
    const storeId = newDocumentState.storeId as string;
    const note = normalizeNote(newDocumentState.note);

    if (!storeId) {
      throw new BadRequestException(`Missing storeId in document ${id}`);
    }

    try {
      await deps.verifyStoreAccess(storeId, userId);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        // User no longer has access to this store (e.g. left the household).
        // Return a tombstone conflict so RxDB stops retrying this row.
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
      throw err;
    }

    const current = await deps.prisma.item.findUnique({ where: { id } });

    if (current && assumedMasterState != null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(itemToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        await deps.prisma.item.update({
          where: { id },
          data: { deleted: true, deletedAt: new Date() },
        });
      }
    } else if (current) {
      // Pin updatedAt to what the client sent so assumedMasterState
      // comparison on the next push doesn't false-conflict against
      // Prisma's @updatedAt (which would use server time otherwise).
      const clientUpdatedAt = newDocumentState.updatedAt;
      const updatedAt = typeof clientUpdatedAt === 'string'
        ? new Date(clientUpdatedAt)
        : new Date();

      await deps.prisma.item.update({
        where: { id },
        data: {
          name: newDocumentState.name as string,
          sectionId: newDocumentState.sectionId as string | null,
          defaultUnit: newDocumentState.defaultUnit as string | null,
          note,
          deleted: false,
          deletedAt: null,
          updatedAt,
        },
      });
    } else {
      const clientUpdatedAt = newDocumentState.updatedAt;
      const updatedAt = typeof clientUpdatedAt === 'string'
        ? new Date(clientUpdatedAt)
        : new Date();

      // Check for soft-deleted row to restore
      const softDeleted = await deps.prisma.item.findFirst({
        where: { storeId, name: newDocumentState.name as string, deleted: true },
      });
      if (softDeleted) {
        await deps.prisma.item.update({
          where: { id: softDeleted.id },
          data: {
            name: newDocumentState.name as string,
            sectionId: newDocumentState.sectionId as string | null,
            defaultUnit: newDocumentState.defaultUnit as string | null,
            note,
            deleted: false,
            deletedAt: null,
            updatedAt,
          },
        });
        continue;
      }

      // Check for active duplicate
      const activeDuplicate = await deps.prisma.item.findFirst({
        where: { storeId, name: newDocumentState.name as string, deleted: false },
      });
      if (activeDuplicate) {
        conflicts.push(itemToSyncDoc(activeDuplicate));
        continue;
      }

      // Race-condition safety net
      try {
        await deps.prisma.item.create({
          data: {
            id,
            name: newDocumentState.name as string,
            storeId,
            sectionId: newDocumentState.sectionId as string | null,
            defaultUnit: newDocumentState.defaultUnit as string | null,
            note,
            updatedAt,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const existing = await deps.prisma.item.findFirst({
            where: { storeId, name: newDocumentState.name as string },
          });
          if (existing) {
            conflicts.push(itemToSyncDoc(existing));
            continue;
          }
        }
        throw err;
      }
    }
  }

  return conflicts;
}

function normalizeNote(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function itemToSyncDoc(row: {
  id: string;
  name: string;
  storeId: string;
  sectionId: string | null;
  defaultUnit: string | null;
  note: string | null;
  purchaseCount: number;
  lastPurchased: Date | null;
  updatedAt: Date;
  deleted: boolean;
}): SyncDocument {
  return {
    id: row.id,
    name: row.name,
    storeId: row.storeId,
    ...(row.sectionId ? { sectionId: row.sectionId } : {}),
    ...(row.defaultUnit ? { defaultUnit: row.defaultUnit } : {}),
    ...(row.note ? { note: row.note } : {}),
    purchaseCount: row.purchaseCount,
    ...(row.lastPurchased ? { lastPurchased: row.lastPurchased.toISOString() } : {}),
    updatedAt: row.updatedAt.toISOString(),
    _deleted: row.deleted,
  };
}
