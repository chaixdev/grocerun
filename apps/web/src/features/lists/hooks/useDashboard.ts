import { useRxQuery } from "@/core/lib/useRxQuery"
import { resyncHouseholds, resyncStores, resyncLists, resyncListItems } from "@/core/rxdb"

// ----- Types -----

export interface DashboardList {
  id: string
  name: string
  status: string
  updatedAt: string
  _count: { items: number }
}

export interface DashboardStore {
  id: string
  name: string
  location: string | null
  lists: DashboardList[]
}

export interface DashboardHousehold {
  id: string
  name: string
  stores: DashboardStore[]
}

export function useDashboard() {
  return useRxQuery<DashboardHousehold[]>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
          const [households, stores, lists, listItems] = await Promise.all([
            db.households.find().exec(),
            db.stores.find().exec(),
            db.lists.find().exec(),
            db.listItems.find().exec(),
          ])

          const itemCountByListId = new Map<string, number>()
          for (const listItem of listItems) {
            itemCountByListId.set(listItem.listId, (itemCountByListId.get(listItem.listId) ?? 0) + 1)
          }

          return households
            .map((household) => ({
              id: household.id,
              name: household.name,
              stores: stores
                .filter((store) => store.householdId === household.id)
                .map((store) => ({
                  id: store.id,
                  name: store.name,
                  location: store.location ?? null,
                  lists: lists
                    .filter((list) => list.storeId === store.id && list.status !== 'COMPLETED')
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                    .map((list) => ({
                      id: list.id,
                      name: list.name,
                      status: list.status,
                      updatedAt: list.updatedAt,
                      _count: { items: itemCountByListId.get(list.id) ?? 0 },
                    })),
                }))
                .filter((store) => store.lists.length > 0),
            }))
            .filter((household) => household.stores.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name))
        }

        const householdSub = db.households.find().$.subscribe(() => void triggerUpdate())
        const storeSub = db.stores.find().$.subscribe(() => void triggerUpdate())
        const listSub = db.lists.find().$.subscribe(() => void triggerUpdate())
        const listItemSub = db.listItems.find().$.subscribe(() => void triggerUpdate())
        return {
          subscriptions: [
            () => householdSub.unsubscribe(),
            () => storeSub.unsubscribe(),
            () => listSub.unsubscribe(),
            () => listItemSub.unsubscribe(),
          ],
          compute,
        }
      },
      init: async () => {
        resyncHouseholds()
        resyncStores()
        resyncLists()
        resyncListItems()
      },
      errorMsg: 'Failed to load dashboard',
    },
    [],
  )
}
