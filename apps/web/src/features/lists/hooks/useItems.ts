import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"
import { listKeys } from "./useLists"

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
  return api.get<SearchResult[]>(
    `/items/search?storeId=${storeId}&query=${encodeURIComponent(query)}`
  )
}

export async function getTopItemsForStore(
  storeId: string,
  limit = 5,
  threshold = 1
): Promise<SearchResult[]> {
  return api.get<SearchResult[]>(
    `/items/top?storeId=${storeId}&limit=${limit}&threshold=${threshold}`
  )
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, name, sectionId, defaultUnit }: UpdateItemInput) =>
      api.patch<{ status: "UPDATED" }>(`/items/${itemId}`, {
        name,
        sectionId,
        defaultUnit,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      toast.success("Item updated")
    },
    onError: () => {
      toast.error("Failed to update item")
    },
  })
}
