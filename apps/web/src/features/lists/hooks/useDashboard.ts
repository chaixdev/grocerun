import { useEffect, useState } from "react"
import { getRxDb, resyncHouseholds, resyncStores, resyncLists, resyncListItems } from "@/core/rxdb"

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
  const [data, setData] = useState<DashboardHousehold[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribes: Array<() => void> = []

    getRxDb()
      .then(async (db) => {
        if (cancelled) return

        resyncHouseholds()
        resyncStores()
        resyncLists()
        resyncListItems()

        const recompute = async () => {
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

          const next = households
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

          if (!cancelled) {
            setData(next)
            setIsLoading(false)
            setError(null)
          }
        }

        const householdSub = db.households.find().$.subscribe(() => void recompute())
        const storeSub = db.stores.find().$.subscribe(() => void recompute())
        const listSub = db.lists.find().$.subscribe(() => void recompute())
        const listItemSub = db.listItems.find().$.subscribe(() => void recompute())

        unsubscribes = [
          () => householdSub.unsubscribe(),
          () => storeSub.unsubscribe(),
          () => listSub.unsubscribe(),
          () => listItemSub.unsubscribe(),
        ]

        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load dashboard'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  return { data, isLoading, error, isError: !!error }
}
