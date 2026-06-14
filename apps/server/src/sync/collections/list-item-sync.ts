/**
 * List item sync — local-first for active shopping.
 *
 * Pull: client caches all list items for local display.
 * Push: ACCEPTED. Local-first writes for check/uncheck, quantity changes,
 *       add/remove during active shopping.
 *
 *       Push is gated: COMPLETED lists are immutable. SHOPPING lists are
 *       locked to their assignedTo shopper — only that user can push.
 *       PLANNING mode list item mutations go through REST, not push.
 */

import { BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SyncDeps } from '../sync-deps';

const logger = new Logger('ListItemSync');
import {
  PullResponse,
  PushRow,
  PushResponse,
  SyncCheckpoint,
  SyncDocument,
} from '../sync.types';

export async function pullListItems(
  deps: SyncDeps,
  checkpoint: SyncCheckpoint | null,
  limit: number,
  userId: string,
): Promise<PullResponse> {
  const accessibleStoreIds = await deps.getAccessibleStoreIdsForSync(userId);

  if (accessibleStoreIds.length === 0) {
    return { documents: [], checkpoint: null };
  }

  const tombstoneWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    list: { storeId: { in: accessibleStoreIds } },
    AND: [
      {
        OR: [
          { deleted: false },
          { deletedAt: { gte: tombstoneWindow } },
        ],
      },
    ],
  };

  if (checkpoint) {
    (where.AND as Array<Record<string, unknown>>).push({
      OR: [
        { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
        {
          updatedAt: { equals: new Date(checkpoint.updatedAt) },
          id: { gt: checkpoint.id },
        },
      ],
    });
  }

  const rows = await deps.prisma.listItem.findMany({
    where,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    take: limit,
  });

  const documents: SyncDocument[] = rows.map(listItemToSyncDoc);

  const newCheckpoint: SyncCheckpoint | null =
    rows.length > 0
      ? {
          id: rows[rows.length - 1].id,
          updatedAt: rows[rows.length - 1].updatedAt.toISOString(),
        }
      : checkpoint;

  return { documents, checkpoint: newCheckpoint };
}

export async function pushListItems(
  deps: SyncDeps,
  rows: PushRow[],
  userId: string,
  shoppingLockId: string,
): Promise<PushResponse> {
  const conflicts: SyncDocument[] = [];

  for (const row of rows) {
    const { newDocumentState, assumedMasterState } = row;
    const id = newDocumentState.id as string;
    const listId = newDocumentState.listId as string;
    const itemId = newDocumentState.itemId as string;

    if (!listId || !itemId) {
      throw new BadRequestException(`Missing listId or itemId in document ${id}`);
    }

    const list = await deps.prisma.list.findFirst({
      where: { id: listId, deleted: false },
      select: { storeId: true, assignedTo: true, status: true },
    });

    if (!list) {
      // List no longer exists (deleted) or user can't see it — treat as tombstone.
      conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
      continue;
    }

    try {
      await deps.verifyStoreAccess(list.storeId, userId);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
      throw err;
    }

    // Enforce shopping lock: completed lists are immutable;
    // SHOPPING lists locked by another user are read-only.
    if (list.status === 'COMPLETED') {
      conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
      continue;
    }

    if (list.status === 'SHOPPING') {
      if (!list.assignedTo) {
        // Server-side inconsistency — warn but allow the push to proceed.
        logger.warn(
          `pushListItems: list ${listId} is SHOPPING but has no assignedTo. Allowing push for userId=${userId}.`,
        );
      } else if (list.assignedTo !== shoppingLockId) {
        conflicts.push({ id, updatedAt: new Date().toISOString(), _deleted: true });
        continue;
      }
    }

    const current = await deps.prisma.listItem.findUnique({ where: { id } });

    if (current && assumedMasterState != null) {
      const assumedAt = new Date(assumedMasterState.updatedAt as string).getTime();
      const actualAt = current.updatedAt.getTime();
      if (assumedAt !== actualAt) {
        conflicts.push(listItemToSyncDoc(current));
        continue;
      }
    }

    if (newDocumentState._deleted) {
      if (current && !current.deleted) {
        await deps.prisma.listItem.update({
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

      await deps.prisma.listItem.update({
        where: { id },
        data: {
          isChecked: newDocumentState.isChecked as boolean,
          quantity: newDocumentState.quantity as number,
          unit: (newDocumentState.unit as string | undefined) ?? null,
          purchasedQuantity:
            (newDocumentState.purchasedQuantity as number | undefined) ?? null,
          deleted: false,
          deletedAt: null,
          updatedAt,
        },
      });
    } else {
      // Compute updatedAt FIRST for use in both soft-delete restore and create.
      const clientUpdatedAt = newDocumentState.updatedAt;
      const updatedAt = typeof clientUpdatedAt === 'string'
        ? new Date(clientUpdatedAt)
        : new Date();

      // Check for soft-deleted row to restore (unique constraint changed to
      // @@unique([listId, itemId, deleted]) so soft-deleted rows no longer
      // block creation, but we still restore in-place for data continuity).
      const softDeleted = await deps.prisma.listItem.findFirst({
        where: { listId, itemId, deleted: true },
      });
      if (softDeleted) {
        await deps.prisma.listItem.update({
          where: { id: softDeleted.id },
          data: {
            isChecked: (newDocumentState.isChecked as boolean) ?? false,
            quantity: (newDocumentState.quantity as number) ?? 1,
            unit: (newDocumentState.unit as string | undefined) ?? null,
            purchasedQuantity:
              (newDocumentState.purchasedQuantity as number | undefined) ?? null,
            deleted: false,
            deletedAt: null,
            updatedAt,
          },
        });
        continue;
      }

      // Guard against a duplicate (listId, itemId) created via a different code
      // path (e.g. the REST addItem endpoint) before this push arrived.
      const duplicate = await deps.prisma.listItem.findFirst({
        where: { listId, itemId, deleted: false },
      });
      if (duplicate) {
        // Return the canonical server row so the client can reconcile.
        conflicts.push(listItemToSyncDoc(duplicate));
        continue;
      }

      // Note: createdAt is intentionally omitted from the create call.
      // It defaults to Prisma @default(now()) (server-authoritative).
      // The client's original createdAt is replaced by the server value
      // on the next pull — this converges after one round-trip.
      try {
        await deps.prisma.listItem.create({
          data: {
            id,
            listId,
            itemId,
            isChecked: (newDocumentState.isChecked as boolean) ?? false,
            quantity: (newDocumentState.quantity as number) ?? 1,
            unit: (newDocumentState.unit as string | undefined) ?? null,
            purchasedQuantity:
              (newDocumentState.purchasedQuantity as number | undefined) ?? null,
            updatedAt,
          },
        });
      } catch (err) {
        // P2002 race-condition safety net: another request created the row
        // between our check and create. Return it as a conflict.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const canonical = await deps.prisma.listItem.findFirst({
            where: { listId, itemId },
          });
          if (canonical) {
            conflicts.push(listItemToSyncDoc(canonical));
          } else {
            throw err;
          }
          continue;
        }
        throw err;
      }
    }
  }

  return conflicts;
}

function listItemToSyncDoc(row: {
  id: string;
  listId: string;
  itemId: string;
  isChecked: boolean;
  quantity: number;
  createdAt: Date;
  unit: string | null;
  purchasedQuantity: number | null;
  updatedAt: Date;
  deleted: boolean;
}): SyncDocument {
  return {
    id: row.id,
    listId: row.listId,
    itemId: row.itemId,
    isChecked: row.isChecked,
    quantity: row.quantity,
    createdAt: row.createdAt.toISOString(),
    ...(row.unit ? { unit: row.unit } : {}),
    ...(row.purchasedQuantity !== null ? { purchasedQuantity: row.purchasedQuantity } : {}),
    updatedAt: row.updatedAt.toISOString(),
    _deleted: row.deleted,
  };
}
