import { useRxQuery } from "@/core/lib/useRxQuery"
import { api } from "@/core/lib/api"
import { resyncListItems, resyncLists } from "@/core/rxdb"

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
  note: string | null
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
  return useRxQuery<List[]>(
    {
      setup: async (db, triggerUpdate) => {
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

          return lists
            .map((list) => ({
              id: list.id,
              name: list.name,
              createdAt: list.updatedAt,
              status: list.status,
              assignedTo: list.assignedTo ?? null,
              _count: { items: itemCountByListId.get(list.id) ?? 0 },
            }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        }

        const listSub = db.lists.find({ selector: { storeId: { $eq: storeId } } }).$.subscribe(() => void triggerUpdate())
        const listItemSub = db.listItems.find().$.subscribe(() => void triggerUpdate())
        return {
          subscriptions: [() => listSub.unsubscribe(), () => listItemSub.unsubscribe()],
          compute: recompute,
        }
      },
      init: async () => {
        resyncLists()
        resyncListItems()
      },
      errorMsg: 'Failed to load store lists',
    },
    [storeId],
  )
}

export function useListDetail(listId: string) {
  return useRxQuery<ListDetail>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
          const currentList = await db.lists.findOne(listId).exec()
          if (!currentList) {
            resyncLists()
            const remoteList = await api.get<ListDetail>(`/lists/${listId}`)
            return remoteList
          }

          const storeId = currentList.storeId
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
                note: doc.note ?? null,
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

          return {
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
        }

        const listSub = db.lists.findOne(listId).$.subscribe(() => void triggerUpdate())
        const listItemSub = db.listItems.find({ selector: { listId: { $eq: listId } } }).$.subscribe(() => void triggerUpdate())
        const itemSub = db.items.find().$.subscribe(() => void triggerUpdate())
        const sectionSub = db.sections.find().$.subscribe(() => void triggerUpdate())

        return {
          subscriptions: [
            () => listSub.unsubscribe(),
            () => listItemSub.unsubscribe(),
            () => itemSub.unsubscribe(),
            () => sectionSub.unsubscribe(),
          ],
          compute,
        }
      },
      errorMsg: 'Failed to load list',
    },
    [listId],
  )
}
