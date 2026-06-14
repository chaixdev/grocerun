import { getRxDb } from "@/core/rxdb"

export interface SearchResult {
  id: string
  name: string
  sectionId: string | null
  defaultUnit: string | null
  purchaseCount: number
}

export async function searchItems(storeId: string, query: string): Promise<SearchResult[]> {
  const db = await getRxDb()
  const docs = await db.items
    .find({
      selector: {
        storeId: { $eq: storeId },
        name: { $regex: query.trim() ? query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : ".*" },
      },
      sort: [{ purchaseCount: 'desc' }, { name: 'asc' }],
      limit: 20,
    })
    .exec()

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    sectionId: doc.sectionId ?? null,
    defaultUnit: doc.defaultUnit ?? null,
    purchaseCount: doc.purchaseCount,
  }))
}

export async function getTopItemsForStore(
  storeId: string,
  limit = 5,
  threshold = 1
): Promise<SearchResult[]> {
  const db = await getRxDb()
  const docs = await db.items
    .find({
      selector: {
        storeId: { $eq: storeId },
        purchaseCount: { $gte: threshold },
      },
      sort: [{ purchaseCount: 'desc' }, { name: 'asc' }],
      limit,
    })
    .exec()

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    sectionId: doc.sectionId ?? null,
    defaultUnit: doc.defaultUnit ?? null,
    purchaseCount: doc.purchaseCount,
  }))
}
