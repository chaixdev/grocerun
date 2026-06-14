import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { getRxDb, resyncStores } from "@/core/rxdb"
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
  const [data, setData] = useState<Store | undefined>(undefined)
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
        resyncStores()

        const recompute = async () => {
          const doc = await db.stores.findOne(storeId).exec()
          if (!cancelled) {
            setData(
              doc
                ? {
                    id: doc.id,
                    name: doc.name,
                    location: doc.location ?? null,
                    imageUrl: doc.imageUrl ?? null,
                    householdId: doc.householdId,
                  }
                : undefined,
            )
            setIsLoading(false)
            setError(null)
          }
        }

        const sub = db.stores.find().$.subscribe(() => void recompute())
        unsubscribe = () => sub.unsubscribe()
        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load store'))
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
