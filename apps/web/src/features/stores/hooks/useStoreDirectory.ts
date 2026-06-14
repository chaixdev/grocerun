import { useRxQuery } from "@/core/lib/useRxQuery"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { resyncHouseholds, resyncLists, resyncStores } from "@/core/rxdb"
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
  return useRxQuery<DirectoryHousehold[]>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
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
                  activeListId: activeListByStoreId.get(store.id)?.id ?? null,
                })),
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        }

        const householdSub = db.households.find().$.subscribe(() => void triggerUpdate())
        const storeSub = db.stores.find().$.subscribe(() => void triggerUpdate())
        const listSub = db.lists.find().$.subscribe(() => void triggerUpdate())
        return {
          subscriptions: [
            () => householdSub.unsubscribe(),
            () => storeSub.unsubscribe(),
            () => listSub.unsubscribe(),
          ],
          compute,
        }
      },
      init: async () => {
        resyncHouseholds()
        resyncStores()
        resyncLists()
      },
      errorMsg: 'Failed to load store directory',
    },
    [],
  )
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
