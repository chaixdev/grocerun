import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { getRxDb, resyncItems } from "@/core/rxdb"
import { toast } from "sonner"

// ----- Types -----

export interface SearchResult {
  id: string
  name: string
  sectionId: string | null
  defaultUnit: string | null
  purchaseCount: number
}

// ----- API functions (not hooks) for autocomplete -----
// ItemAutocomplete manages its own debounce/loading state,
// so these are plain async functions, not React Query hooks.

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

// ----- Mutations -----

interface UpdateItemInput {
  itemId: string
  name: string
  sectionId?: string
  defaultUnit?: string
  listId: string // for cache invalidation
}

export function useUpdateItem() {
  return useMutation({
    mutationFn: ({ itemId, name, sectionId, defaultUnit }: UpdateItemInput) =>
      api.patch<{ status: "UPDATED" }>(`/items/${itemId}`, {
        name,
        sectionId,
        defaultUnit,
      }),
    onSuccess: (_data, variables) => {
      resyncItems()
      toast.success("Item updated")
    },
    onError: () => {
      toast.error("Failed to update item")
    },
  })
}
