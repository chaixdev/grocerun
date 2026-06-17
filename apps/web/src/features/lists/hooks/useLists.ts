import { useMutation } from "@/core/lib/useMutation"
import { useRxMutation } from "@/core/lib/useRxMutation"
import { api } from "@/core/lib/api"
import { resyncListItems, resyncLists } from "@/core/rxdb"
import { getRxDb } from "@/core/rxdb"
import type { ListDocType } from "@/core/rxdb"
import { networkAwareErrorToast } from "@/core/lib/error-toast"
import { toast } from "sonner"

export { useAddItem } from "./useAddItem"

// ----- Mutations -----

export function useCreateList() {
  return useMutation({
    mutationFn: (data: { storeId: string; name?: string }) =>
      api.post<ListDocType>("/lists", data),
    onSuccess: async (list) => {
      // Insert directly into RxDB so the new list is immediately visible
      // to local-first operations like useCompleteAndCreateList.addItem.
      if (!list?.id) {
        throw new Error("Server returned invalid list response — missing id")
      }
      const db = await getRxDb()
      await db.lists.upsert(list)
      resyncLists()
      resyncListItems()
    },
    onError: (error) => {
      networkAwareErrorToast(error, "Failed to create list")
    },
  })
}

// ----- List Item Mutations -----

interface ToggleItemInput {
  itemId: string
  isChecked: boolean
  purchasedQuantity?: number
  listId: string // for cache invalidation
}

export function useToggleItem() {
  return useRxMutation<ToggleItemInput>({
    collection: "listItems",
    deriveDocId: (v) => v.itemId,
    derivePatch: ({ isChecked, purchasedQuantity }, doc) => {
      let final = purchasedQuantity
      if (final === undefined) {
        final = isChecked && doc.purchasedQuantity === undefined ? (doc.quantity as number) : (doc.purchasedQuantity as number | undefined)
      }
      return { isChecked, purchasedQuantity: final }
    },
    onError: () => toast.error("Failed to update item"),
  })
}

interface UpdateQuantityInput {
  listItemId: string
  quantity: number
  unit?: string
  listId: string // for cache invalidation
}

export function useUpdateItemQuantity() {
  return useRxMutation<UpdateQuantityInput>({
    collection: "listItems",
    deriveDocId: (v) => v.listItemId,
    derivePatch: ({ quantity, unit }) => {
      const patch: Record<string, unknown> = { quantity }
      if (unit !== undefined) patch.unit = unit
      return patch
    },
    onError: () => toast.error("Failed to update quantity"),
  })
}

export function useRemoveItem() {
  return useRxMutation<{ listItemId: string; listId: string }>({
    collection: "listItems",
    mode: "remove",
    deriveDocId: (v) => v.listItemId,
    onSuccess: () => toast.success("Item removed"),
    onError: () => toast.error("Failed to remove item"),
  })
}

// ----- List Status Mutations -----

interface ListStatusInput {
  listId: string
  storeId: string // for invalidating store-related caches
}

export function useStartShopping() {
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/start-shopping`, {}),
    onSuccess: () => {
      resyncLists()
      resyncListItems()
    },
    onError: (error) => {
      networkAwareErrorToast(error, "Failed to start shopping")
    },
  })
}

export function useCancelShopping() {
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/cancel-shopping`, {}),
    onSuccess: () => {
      resyncLists()
      resyncListItems()
    },
    onError: (error) => {
      networkAwareErrorToast(error, "Failed to cancel shopping")
    },
  })
}

export function useCompleteList() {
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/complete`, {}),
    onSuccess: () => {
      resyncLists()
      resyncListItems()
    },
    onError: (error) => {
      networkAwareErrorToast(error, "Failed to complete trip")
    },
  })
}
