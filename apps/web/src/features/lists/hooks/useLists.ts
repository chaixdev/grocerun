import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"

// ----- Types -----

export interface List {
  id: string
  name: string
  createdAt: string
  _count: { items: number }
  status: string
}

export interface ListDetailItem {
  id: string
  name: string
  sectionId: string | null
  defaultUnit: string | null
  purchaseCount?: number
}

export interface ListDetailListItem {
  id: string
  isChecked: boolean
  quantity: number
  unit: string | null
  purchasedQuantity: number | null
  item: ListDetailItem
}

export interface ListDetailSection {
  id: string
  name: string
  order: number
}

export interface ListDetail {
  id: string
  name: string
  status: string
  updatedAt: string
  store: {
    id: string
    name: string
    sections: ListDetailSection[]
  }
  items: ListDetailListItem[]
}

// ----- Query Keys -----

export const listKeys = {
  all: ["lists"] as const,
  detail: (id: string) => [...listKeys.all, id] as const,
  byStore: (storeId: string) => [...listKeys.all, "store", storeId] as const,
}

// ----- Queries -----

export function useStoreLists(storeId: string) {
  return useQuery({
    queryKey: listKeys.byStore(storeId),
    queryFn: () => api.get<List[]>(`/lists/store/${storeId}`),
  })
}

export function useListDetail(listId: string) {
  return useQuery({
    queryKey: listKeys.detail(listId),
    queryFn: () => api.get<ListDetail>(`/lists/${listId}`),
    enabled: !!listId,
  })
}

// ----- Mutations -----

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { storeId: string; name?: string }) =>
      api.post<{ id: string }>("/lists", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.byStore(variables.storeId) })
    },
    onError: () => {
      toast.error("Failed to create list")
    },
  })
}

// ----- List Item Mutations -----

type AddItemResult =
  | { status: "ADDED"; listItem: ListDetailListItem }
  | { status: "ALREADY_EXISTS" }
  | { status: "NEEDS_SECTION" }
  | { status: "ERROR"; error: string }

interface AddItemInput {
  listId: string
  name: string
  sectionId?: string | null
  quantity?: number
  unit?: string
}

export function useAddItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddItemInput) =>
      api.post<AddItemResult>("/lists/items/add", data),
    onSuccess: (result, variables) => {
      if (result.status === "ADDED") {
        queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      }
    },
  })
}

interface ToggleItemInput {
  itemId: string
  isChecked: boolean
  purchasedQuantity?: number
  listId: string // for cache invalidation
}

export function useToggleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, isChecked, purchasedQuantity }: ToggleItemInput) =>
      api.patch<{ success: boolean }>("/lists/items/toggle", {
        itemId,
        isChecked,
        purchasedQuantity,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
    },
    onError: () => {
      toast.error("Failed to update item")
    },
  })
}

interface UpdateQuantityInput {
  listItemId: string
  quantity: number
  unit?: string
  listId: string // for cache invalidation
}

export function useUpdateItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listItemId, quantity, unit }: UpdateQuantityInput) =>
      api.patch<{ success: boolean }>("/lists/items/quantity", {
        listItemId,
        quantity,
        unit,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
    },
    onError: () => {
      toast.error("Failed to update quantity")
    },
  })
}

export function useRemoveItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listItemId, listId }: { listItemId: string; listId: string }) =>
      api.delete<{ success: boolean }>(`/lists/items/${listItemId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      toast.success("Item removed")
    },
    onError: () => {
      toast.error("Failed to remove item")
    },
  })
}

// ----- List Status Mutations -----

interface ListStatusInput {
  listId: string
  storeId: string // for invalidating store-related caches
}

export function useStartShopping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/start-shopping`, {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      queryClient.invalidateQueries({ queryKey: listKeys.byStore(variables.storeId) })
    },
    onError: () => {
      toast.error("Failed to start shopping")
    },
  })
}

export function useCancelShopping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/cancel-shopping`, {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      queryClient.invalidateQueries({ queryKey: listKeys.byStore(variables.storeId) })
    },
    onError: () => {
      toast.error("Failed to cancel shopping")
    },
  })
}

export function useCompleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/complete`, {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(variables.listId) })
      queryClient.invalidateQueries({ queryKey: listKeys.byStore(variables.storeId) })
    },
    onError: () => {
      toast.error("Failed to complete trip")
    },
  })
}
