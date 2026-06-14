import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { useRxMutation } from "@/core/lib/useRxMutation"
import { api } from "@/core/lib/api"
import { getRxDb, resyncListItems, resyncLists } from "@/core/rxdb"
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
          const lists = await db.lists.find({ selector: { storeId: { $eq: storeId } } }).exec()
          const listIds = lists.map((l) => l.id)
          const listItems = listIds.length > 0
            ? await db.listItems.find({ selector: { listId: { $in: listIds } } }).exec()
            : []

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

        // Subscribe to lists for this store. For listItems, subscribe to the
        // whole collection but filtered: recompute fetches only relevant items.
        // A listItem change for a different store won't match the listId filter
        // in recompute, so data is stable; only the selector check is broad.
        const listSub = db.lists.find({ selector: { storeId: { $eq: storeId } } }).$.subscribe(() => void recompute())
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

    getRxDb()
      .then(async (db) => {
        if (cancelled) return

        let activeStoreId: string | null = null
        let detailUnsubscribes: Array<() => void> = []

        const clearDetailSubscriptions = () => {
          detailUnsubscribes.forEach((unsubscribe) => {
            unsubscribe()
          })
          detailUnsubscribes = []
        }

        const recompute = async (storeId: string) => {
          const currentList = await db.lists.findOne(listId).exec()
          if (!currentList) {
            const remoteList = await api.get<ListDetail>(`/lists/${listId}`)
            if (!cancelled) {
              setData(remoteList)
              setIsLoading(false)
              setError(null)
            }
            return
          }

          const [sectionDocs, listItemDocs, itemDocs, storeDoc] = await Promise.all([
            db.sections
              .find({
                selector: { storeId: { $eq: storeId } },
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
                selector: { storeId: { $eq: storeId } },
              })
              .exec(),
            db.stores.findOne(storeId).exec(),
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
            id: currentList.id,
            name: currentList.name,
            status: currentList.status,
            assignedTo: currentList.assignedTo ?? null,
            updatedAt: currentList.updatedAt,
            store: {
              id: currentList.storeId,
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

        const ensureDetailSubscriptions = (storeId: string) => {
          if (activeStoreId === storeId && detailUnsubscribes.length > 0) return
          clearDetailSubscriptions()
          activeStoreId = storeId

          const listItemSub = db.listItems.find({ selector: { listId: { $eq: listId } } }).$.subscribe(() => void recompute(storeId))
          const itemSub = db.items.find({ selector: { storeId: { $eq: storeId } } }).$.subscribe(() => void recompute(storeId))
          const sectionSub = db.sections.find({ selector: { storeId: { $eq: storeId } } }).$.subscribe(() => void recompute(storeId))

          detailUnsubscribes = [
            () => listItemSub.unsubscribe(),
            () => itemSub.unsubscribe(),
            () => sectionSub.unsubscribe(),
          ]
        }

        const hydrate = async () => {
          const listDoc = await db.lists.findOne(listId).exec()
          if (!listDoc) {
            resyncLists()
            const remoteList = await api.get<ListDetail>(`/lists/${listId}`)
            if (!cancelled) {
              setData(remoteList)
              setIsLoading(false)
              setError(null)
            }
            return
          }

          ensureDetailSubscriptions(listDoc.storeId)
          await recompute(listDoc.storeId)
        }

        const listSub = db.lists.findOne(listId).$.subscribe(() => void hydrate())
        unsubscribes = [
          () => listSub.unsubscribe(),
          clearDetailSubscriptions,
        ]
        await hydrate()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load list'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribes.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [listId])

  return { data, isLoading, error, isError: !!error }
}

// ----- Mutations -----

export function useCreateList() {
  return useMutation({
    mutationFn: (data: { storeId: string; name?: string }) =>
      api.post<{ id: string }>("/lists", data),
    onSuccess: () => {
      resyncLists()
      resyncListItems()
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

function newLocalId() {
  return `c${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
}

interface AddItemInput {
  listId: string
  name: string
  sectionId?: string | null
  quantity?: number
  unit?: string
}

export function useAddItem() {
  return useMutation({
    mutationFn: async (data: AddItemInput) => {
      const name = data.name.trim()
      if (!name) {
        return { status: 'ERROR', error: 'Item name is required' } as AddItemResult
      }

      const db = await getRxDb()
      const list = await db.lists.findOne(data.listId).exec()
      if (!list) {
        return { status: 'ERROR', error: 'List not found in local database' } as AddItemResult
      }

      const now = new Date().toISOString()
      let item = await db.items
        .findOne({
          selector: {
            storeId: { $eq: list.storeId },
            name: { $eq: name },
          },
        })
        .exec()

      if (!item && data.sectionId === undefined) {
        return { status: 'NEEDS_SECTION' } as AddItemResult
      }

      if (!item) {
        item = await db.items.insert({
          id: newLocalId(),
          name,
          storeId: list.storeId,
          ...(data.sectionId ? { sectionId: data.sectionId } : {}),
          ...(data.unit ? { defaultUnit: data.unit } : {}),
          purchaseCount: 0,
          updatedAt: now,
        })
      } else if (data.unit && data.unit !== item.defaultUnit) {
        await item.incrementalPatch({
          defaultUnit: data.unit,
          updatedAt: now,
        })
      }

      const existingListItem = await db.listItems
        .findOne({
          selector: {
            listId: { $eq: data.listId },
            itemId: { $eq: item.id },
          },
        })
        .exec()

      if (existingListItem) {
        return { status: 'ALREADY_EXISTS' } as AddItemResult
      }

      const listItemDoc = await db.listItems.insert({
        id: newLocalId(),
        listId: data.listId,
        itemId: item.id,
        isChecked: false,
        quantity: data.quantity ?? 1,
        createdAt: now,
        ...(data.unit ? { unit: data.unit } : item.defaultUnit ? { unit: item.defaultUnit } : {}),
        updatedAt: now,
      })

      return {
        status: 'ADDED',
        listItem: {
          id: listItemDoc.id,
          isChecked: listItemDoc.isChecked,
          quantity: listItemDoc.quantity,
          unit: listItemDoc.unit ?? null,
          purchasedQuantity: listItemDoc.purchasedQuantity ?? null,
          item: {
            id: item.id,
            name: item.name,
            sectionId: item.sectionId ?? null,
            defaultUnit: item.defaultUnit ?? null,
            purchaseCount: item.purchaseCount,
          },
        },
      } as AddItemResult
    },
    onSuccess: (_result) => {
      // Local write + push replication handles sync; no explicit resync needed.
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
      resyncListItems()
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
      resyncListItems()
    },
    onError: () => {
      toast.error("Failed to complete trip")
    },
  })
}
