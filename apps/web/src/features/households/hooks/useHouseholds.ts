import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { removeHouseholdSubtreeFromLocalDb } from "@/core/rxdb/cleanup"
import { getRxDb, resyncHouseholds, resyncStores, resyncLists, resyncListItems, resyncItems, resyncSections } from "@/core/rxdb"
import { toast } from "sonner"

// ----- Types -----

export interface Household {
  id: string
  name: string
  createdAt: string
}

// ----- Queries -----

export function useHouseholds() {
  const [data, setData] = useState<Household[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    getRxDb()
      .then(async (db) => {
        if (cancelled) return
        resyncHouseholds()
        resyncStores()

        const recompute = async () => {
          const docs = await db.households.find({ sort: [{ updatedAt: 'desc' }] }).exec()
          if (!cancelled) {
            setData(docs.map((doc) => ({ id: doc.id, name: doc.name, createdAt: doc.updatedAt })))
            setIsLoading(false)
            setError(null)
          }
        }

        const sub = db.households.find().$.subscribe(() => void recompute())
        unsubscribe = () => sub.unsubscribe()
        await recompute()
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load households'))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { data, isLoading, error, isError: !!error }
}

// ----- Mutations -----

export function useCreateDefaultHousehold() {
  return useMutation({
    mutationFn: () => api.post("/households", { name: "My Household" }),
    onSuccess: () => {
      resyncHouseholds()
      toast.success("Household created!")
    },
    onError: () => {
      toast.error("Failed to create household")
    },
  })
}

export function useCreateHousehold() {
  return useMutation({
    mutationFn: (data: { name: string }) => api.post("/households", data),
    onSuccess: () => {
      resyncHouseholds()
      toast.success("Household created")
    },
    onError: () => {
      toast.error("Failed to create household")
    },
  })
}

export function useRenameHousehold() {
  return useMutation({
    mutationFn: ({ householdId, name }: { householdId: string; name: string }) =>
      api.patch(`/households/${householdId}`, { name }),
    onSuccess: () => {
      resyncHouseholds()
      toast.success("Household updated")
    },
    onError: () => {
      toast.error("Failed to rename household")
    },
  })
}

export function useDeleteHousehold() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/households/${id}`),
    onSuccess: async (_data, id) => {
      await removeHouseholdSubtreeFromLocalDb(id)
      resyncHouseholds()
      resyncStores()
      resyncLists()
      resyncListItems()
      resyncItems()
      resyncSections()
      toast.success("Household deleted")
    },
    onError: () => {
      toast.error("Failed to delete household")
    },
  })
}
