import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { getRxDb, resyncHouseholds, resyncLists, resyncStores } from "@/core/rxdb"
import { toast } from "sonner"

// ----- Types -----

export interface DirectoryStore {
  id: string
  name: string
  location: string | null
  activeListId: string | null
}

export interface DirectoryHousehold {
  id: string
  name: string
  stores: DirectoryStore[]
}

export function useStoreDirectory() {
  const [data, setData] = useState<DirectoryHousehold[] | undefined>(undefined)
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

        const recompute = async () => {
          const [households, stores, lists] = await Promise.all([
            db.households.find().exec(),
            db.stores.find().exec(),
            db.lists.find().exec(),
          ])

          const activeListByStoreId = new Map<string, { id: string; updatedAt: string }>()
          for (const list of lists) {
            if (list.status === 'COMPLETED') continue
            const existing = activeListByStoreId.get(list.storeId)
            if (!existing || existing.updatedAt < list.updatedAt) {
              activeListByStoreId.set(list.storeId, { id: list.id, updatedAt: list.updatedAt })
            }
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
                  activeListId: activeListByStoreId.get(store.id)?.id ?? null,
                })),
            }))
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
        unsubscribes = [
          () => householdSub.unsubscribe(),
          () => storeSub.unsubscribe(),
          () => listSub.unsubscribe(),
        ]
        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load store directory'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribes.forEach((u) => {
        u()
      })
    }
  }, [])

  return { data, isLoading, error, isError: !!error }
}

// ----- Mutations -----

export function useCreateStore() {
  return useMutation({
    mutationFn: (data: { name: string; householdId: string; location?: string }) =>
      api.post("/stores", data),
    onSuccess: () => {
      resyncStores()
      toast.success("Store created")
    },
    onError: () => {
      toast.error("Failed to create store")
    },
  })
}
