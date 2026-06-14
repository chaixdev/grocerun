import { useRxQuery } from "@/core/lib/useRxQuery"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { resyncStores } from "@/core/rxdb"
import { toast } from "sonner"
import { z } from "zod"

// ----- Types -----

const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().nullable(),
  imageUrl: z.string().nullable(),
  householdId: z.string(),
})

export type Store = z.infer<typeof StoreSchema>

export function useStore(storeId: string) {
  return useRxQuery<Store>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
          const doc = await db.stores.findOne(storeId).exec()
          if (doc) {
            return {
              id: doc.id,
              name: doc.name,
              location: doc.location ?? null,
              imageUrl: doc.imageUrl ?? null,
              householdId: doc.householdId,
            }
          }
          // The user may navigate immediately after a REST mutation, before
          // RxDB has pulled the destination store. Fall back to the API so
          // the route renders immediately; replication will replace this
          // with the local document once it arrives.
          const remoteStore = await api.get<Store>(`/stores/${storeId}`)
          return remoteStore
        }
        const sub = db.stores.findOne(storeId).$.subscribe(() => void triggerUpdate())
        return { subscriptions: [() => sub.unsubscribe()], compute }
      },
      init: async () => {
        resyncStores()
      },
      errorMsg: 'Failed to load store',
    },
    [storeId],
  )
}

// ----- Mutations -----

export function useUpdateStore(storeId: string, options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (data: { name: string; location?: string; imageUrl?: string }) =>
      api.patch<Store>(`/stores/${storeId}`, data),
    onSuccess: () => {
      resyncStores()
      toast.success("Store updated successfully")
      options?.onSuccess?.()
    },
    onError: () => {
      toast.error("Failed to update store")
    },
  })
}

export function useDeleteStore(storeId: string, options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: () => api.delete(`/stores/${storeId}`),
    onSuccess: () => {
      resyncStores()
      toast.success("Store deleted")
      options?.onSuccess?.()
    },
    onError: () => {
      toast.error("Failed to delete store")
    },
  })
}
