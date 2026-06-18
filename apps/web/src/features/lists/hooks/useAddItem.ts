import { useCallback, useRef, useState } from "react"
import { getRxDb } from "@/core/rxdb"
import type { ListDetailListItem } from "./useListQueries"

type AddItemResult =
  | { status: "ADDED"; listItem: ListDetailListItem }
  | { status: "ALREADY_EXISTS" }
  | { status: "NEEDS_SECTION" }
  | { status: "ERROR"; error: string }

type Callbacks<TData> = {
  onSuccess?: (data: TData) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

interface AddItemInput {
  listId: string
  name: string
  sectionId?: string | null
  quantity?: number
  unit?: string
}

type AddItemConfig = {
  onSuccess?: (result: AddItemResult) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

function newLocalId() {
  return `c${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
}

export function useAddItem(config?: AddItemConfig) {
  const [isPending, setIsPending] = useState(false)
  const configRef = useRef(config)
  configRef.current = config

  const mutationFn = useCallback(async (data: AddItemInput): Promise<AddItemResult> => {
    const name = data.name.trim()
    if (!name) {
      return { status: 'ERROR', error: 'Item name is required' }
    }

    const db = await getRxDb()
    const list = await db.lists.findOne(data.listId).exec()
    if (!list) {
      return { status: 'ERROR', error: 'List not found in local database' }
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
      return { status: 'NEEDS_SECTION' }
    }

    // Step 1: Ensure the item exists (create or find existing).
    // This is a two-step write (item + listItem) without a transaction
    // because RxDB does not expose transaction APIs for cross-collection
    // writes. The window between steps is small, and any inconsistency
    // resolves on the next pull — RxDB's eventual consistency model
    // reconciles the server state via push replication + SSE resync.
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
      return { status: 'ALREADY_EXISTS' }
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
          note: item.note ?? null,
          purchaseCount: item.purchaseCount,
        },
      },
    }
  }, [])

  const mutateAsync = useCallback(
    async (data: AddItemInput, callbacks?: Callbacks<AddItemResult>) => {
      setIsPending(true)
      try {
        const result = await mutationFn(data)
        await configRef.current?.onSuccess?.(result)
        await callbacks?.onSuccess?.(result)
        return result
      } catch (error) {
        await configRef.current?.onError?.(error)
        await callbacks?.onError?.(error)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [mutationFn],
  )

  const mutate = useCallback(
    (data: AddItemInput, callbacks?: Callbacks<AddItemResult>) => {
      void mutateAsync(data, callbacks)
    },
    [mutateAsync],
  )

  return { mutate, mutateAsync, isPending }
}
