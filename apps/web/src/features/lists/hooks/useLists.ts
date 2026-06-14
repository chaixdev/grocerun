import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { getRxDb, resyncItems, resyncListItems, resyncLists, resyncSections, resyncStores } from "@/core/rxdb"
import { toast } from "sonner"

// ----- Types -----

export interface List {
  id: string
  name: string
  createdAt: string
  _count: { items: number }
  status: string
  assignedTo?: string | null
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
  assignedTo?: string | null
  updatedAt: string
  store: {
    id: string
    name: string
    sections: ListDetailSection[]
  }
  items: ListDetailListItem[]
}

export function useStoreLists(storeId: string) {
  const [data, setData] = useState<List[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(!!storeId)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!storeId) {
      setData(undefined)
      setIsLoading(false)
      return
    }

    let cancelled = false
    let unsubscribe = () => {}

    getRxDb()
      .then(async (db) => {
        if (cancelled) return

        resyncLists()
        resyncListItems()

        const recompute = async () => {
          const [lists, listItems] = await Promise.all([
            db.lists.find({ selector: { storeId: { $eq: storeId } } }).exec(),
            db.listItems.find().exec(),
          ])

          const itemCountByListId = new Map<string, number>()
          for (const listItem of listItems) {
            itemCountByListId.set(listItem.listId, (itemCountByListId.get(listItem.listId) ?? 0) + 1)
          }

          const next = lists
            .map((list) => ({
              id: list.id,
              name: list.name,
              createdAt: list.updatedAt,
              status: list.status,
              assignedTo: list.assignedTo ?? null,
              _count: { items: itemCountByListId.get(list.id) ?? 0 },
            }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

          if (!cancelled) {
            setData(next)
            setIsLoading(false)
            setError(null)
          }
        }

        const listSub = db.lists.find().$.subscribe(() => void recompute())
        const listItemSub = db.listItems.find().$.subscribe(() => void recompute())
        unsubscribe = () => {
          listSub.unsubscribe()
          listItemSub.unsubscribe()
        }
        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load store lists'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [storeId])

  return { data, isLoading, error, isError: !!error }
}

export function useListDetail(listId: string) {
  const [data, setData] = useState<ListDetail | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(!!listId)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!listId) {
      setData(undefined)
      setIsLoading(false)
      return
    }

    let cancelled = false
    let unsubscribes: Array<() => void> = []
    let triedFallback = false

    getRxDb()
      .then(async (db) => {
        if (cancelled) return

        // Kick all relevant collections once on page load so the local cache
        // catches up quickly even on a cold browser start.
        resyncLists()
        resyncListItems()
        resyncItems()
        resyncSections()
        resyncStores()

        const recompute = async () => {
          const listDoc = await db.lists.findOne(listId).exec()
          if (!listDoc) {
            if (!triedFallback) {
              triedFallback = true
              try {
                const rest = await api.get<ListDetail>(`/lists/${listId}`)
                if (!cancelled) {
                  setData(rest)
                  setIsLoading(false)
                  setError(null)
                }
              } catch (err) {
                if (!cancelled) {
                  setError(err instanceof Error ? err : new Error('Failed to load list'))
                  setIsLoading(false)
                }
              }
            }
            return
          }

          const [sectionDocs, listItemDocs, itemDocs, storeDoc] = await Promise.all([
            db.sections
              .find({
                selector: { storeId: { $eq: listDoc.storeId } },
                sort: [{ order: 'asc' }],
              })
              .exec(),
            db.listItems
              .find({
                selector: { listId: { $eq: listId } },
                sort: [{ createdAt: 'asc' }],
              })
              .exec(),
            db.items
              .find({
                selector: { storeId: { $eq: listDoc.storeId } },
              })
              .exec(),
            db.stores.findOne(listDoc.storeId).exec(),
          ])

          const itemMap = new Map(
            itemDocs.map((doc) => [
              doc.id,
              {
                id: doc.id,
                name: doc.name,
                sectionId: doc.sectionId ?? null,
                defaultUnit: doc.defaultUnit ?? null,
                purchaseCount: doc.purchaseCount,
              },
            ]),
          )

          const items = listItemDocs
            .map((doc) => {
              const item = itemMap.get(doc.itemId)
              if (!item) return null
              return {
                id: doc.id,
                isChecked: doc.isChecked,
                quantity: doc.quantity,
                unit: doc.unit ?? null,
                purchasedQuantity: doc.purchasedQuantity ?? null,
                item,
              }
            })
            .filter(Boolean) as ListDetailListItem[]

          const nextData: ListDetail = {
            id: listDoc.id,
            name: listDoc.name,
            status: listDoc.status,
            assignedTo: listDoc.assignedTo ?? null,
            updatedAt: listDoc.updatedAt,
            store: {
              id: listDoc.storeId,
              name: storeDoc?.name ?? 'Store',
              sections: sectionDocs.map((doc) => ({
                id: doc.id,
                name: doc.name,
                order: doc.order,
              })),
            },
            items,
          }

          if (!cancelled) {
            setData(nextData)
            setIsLoading(false)
            setError(null)
          }
        }

        const listSub = db.lists.find().$.subscribe(() => void recompute())
        const listItemSub = db.listItems.find().$.subscribe(() => void recompute())
        const itemSub = db.items.find().$.subscribe(() => void recompute())
        const sectionSub = db.sections.find().$.subscribe(() => void recompute())

        unsubscribes = [
          () => listSub.unsubscribe(),
          () => listItemSub.unsubscribe(),
          () => itemSub.unsubscribe(),
          () => sectionSub.unsubscribe(),
        ]
        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load list'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [listId])

  return { data, isLoading, error }
}

// ----- Mutations -----

export function useCreateList() {
  return useMutation({
    mutationFn: (data: { storeId: string; name?: string }) =>
      api.post<{ id: string }>("/lists", data),
    onSuccess: () => {
      resyncLists()
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
  return useMutation({
    mutationFn: (data: AddItemInput) =>
      api.post<AddItemResult>("/lists/items/add", data),
    onSuccess: (result) => {
      if (result.status === "ADDED") {
        resyncItems()
        resyncListItems()
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
  return useMutation({
    mutationFn: ({ itemId, isChecked, purchasedQuantity }: ToggleItemInput) =>
      api.patch<{ success: boolean }>("/lists/items/toggle", {
        itemId,
        isChecked,
        purchasedQuantity,
      }),
    onSuccess: () => {
      resyncListItems()
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
  return useMutation({
    mutationFn: ({ listItemId, quantity, unit }: UpdateQuantityInput) =>
      api.patch<{ success: boolean }>("/lists/items/quantity", {
        listItemId,
        quantity,
        unit,
      }),
    onSuccess: () => {
      resyncListItems()
    },
    onError: () => {
      toast.error("Failed to update quantity")
    },
  })
}

export function useRemoveItem() {
  return useMutation({
    mutationFn: ({ listItemId, listId }: { listItemId: string; listId: string }) =>
      api.delete<{ success: boolean }>(`/lists/items/${listItemId}`),
    onSuccess: () => {
      resyncListItems()
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
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/start-shopping`, {}),
    onSuccess: () => {
      resyncLists()
    },
    onError: () => {
      toast.error("Failed to start shopping")
    },
  })
}

export function useCancelShopping() {
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/cancel-shopping`, {}),
    onSuccess: () => {
      resyncLists()
    },
    onError: () => {
      toast.error("Failed to cancel shopping")
    },
  })
}

export function useCompleteList() {
  return useMutation({
    mutationFn: ({ listId }: ListStatusInput) =>
      api.post<{ success: boolean }>(`/lists/${listId}/complete`, {}),
    onSuccess: () => {
      resyncLists()
      resyncItems()
    },
    onError: () => {
      toast.error("Failed to complete trip")
    },
  })
}
