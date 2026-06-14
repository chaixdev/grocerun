import { Prisma } from '../generated/prisma/client';

/**
 * Soft-delete a Store and all its children in the correct FK-safe order.
 *
 * Cascade order: ListItem → List → Item → Section → Store
 * (children first, parent last — avoids orphaned FK references)
 *
 * Must be called inside a `prisma.$transaction` callback.
 */
export async function cascadeSoftDeleteStore(
  tx: Prisma.TransactionClient,
  storeId: string,
  now: Date,
) {
  // 1. Find active lists for this store
  const lists = await tx.list.findMany({
    where: { storeId, deleted: false },
    select: { id: true },
  });
  const listIds = lists.map(l => l.id);

  // 2. Soft-delete list items
  if (listIds.length > 0) {
    await tx.listItem.updateMany({
      where: { listId: { in: listIds }, deleted: false },
      data: { deleted: true, deletedAt: now },
    });
  }

  // 3. Soft-delete lists
  await tx.list.updateMany({
    where: { storeId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });

  // 4. Soft-delete items
  await tx.item.updateMany({
    where: { storeId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });

  // 5. Soft-delete sections
  await tx.section.updateMany({
    where: { storeId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });

  // 6. Soft-delete the store itself
  await tx.store.update({
    where: { id: storeId },
    data: { deleted: true, deletedAt: now },
  });
}

/**
 * Soft-delete a Household, all its Stores, and all their children.
 *
 * Uses cascadeSoftDeleteStore for each store, then soft-deletes the household.
 * Must be called inside a `prisma.$transaction` callback.
 */
export async function cascadeSoftDeleteHousehold(
  tx: Prisma.TransactionClient,
  householdId: string,
  now: Date,
) {
  // Find all active stores in this household
  const stores = await tx.store.findMany({
    where: { householdId, deleted: false },
    select: { id: true },
  });

  // Cascade soft-delete each store
  for (const store of stores) {
    await cascadeSoftDeleteStore(tx, store.id, now);
  }

  // Soft-delete the household itself
  await tx.household.update({
    where: { id: householdId },
    data: { deleted: true, deletedAt: now },
  });
}
