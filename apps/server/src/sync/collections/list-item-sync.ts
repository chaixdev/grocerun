import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SyncDeps } from '../sync-deps';
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
  const accessibleStoreIds = await deps.getAccessibleStoreIds(userId);

  if (accessibleStoreIds.length === 0) {
    return { documents: [], checkpoint: null };
  }

  const where = checkpoint
    ? {
        list: { storeId: { in: accessibleStoreIds } },
        OR: [
          { updatedAt: { gt: new Date(checkpoint.updatedAt) } },
          {
            updatedAt: { equals: new Date(checkpoint.updatedAt) },
            id: { gt: checkpoint.id },
          },
        ],
      }
    : { list: { storeId: { in: accessibleStoreIds } } };

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
      select: { storeId: true },
    });

    if (!list) {
      throw new ForbiddenException(`No access to list ${listId}`);
    }

    await deps.verifyStoreAccess(list.storeId, userId);

    const current = await deps.prisma.listItem.findUnique({ where: { id } });

    if (current && assumedMasterState !== null) {
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
        },
      });
    } else {
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
        },
      });
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
