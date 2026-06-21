import { useRxQuery } from "@/core/lib/useRxQuery"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { resyncHouseholds, resyncStores } from "@/core/rxdb"
import { getRxDb, removeHouseholdSubtreeFromLocalDb } from "@/core/rxdb/database"
import { toast } from "sonner"

// ----- Types -----

export interface Household {
  id: string
  name: string
  createdAt: string
}

// ----- Queries -----

export function useHouseholds() {
  return useRxQuery<Household[]>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
          const docs = await db.households.find({ sort: [{ updatedAt: 'desc' }] }).exec()
          return docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            createdAt: doc.updatedAt,
          }))
        }
        const sub = db.households.find().$.subscribe(() => void triggerUpdate())
        return { subscriptions: [() => sub.unsubscribe()], compute }
      },
      init: async () => {
        resyncHouseholds()
        resyncStores()
      },
      errorMsg: 'Failed to load households',
    },
    [],
  )
}

// ----- Mutations -----

export function useCreateDefaultHousehold() {
  return useMutation({
    mutationFn: () => api.post("/households", { name: "My Household" }),
    onSuccess: () => {
      resyncHouseholds()
      resyncStores()
      toast.success("Household created")
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
      resyncStores()
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
      resyncStores()
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
      resyncHouseholds()
      resyncStores()
      await removeHouseholdSubtreeFromLocalDb(id)
      toast.success("Household deleted")
    },
    onError: () => {
      toast.error("Failed to delete household")
    },
  })
}

export function useRemoveMember() {
  return useMutation({
    mutationFn: ({ householdId, memberUserId }: { householdId: string; memberUserId: string }) =>
      api.delete(`/households/${householdId}/members/${memberUserId}`),
    onSuccess: async (_data, { householdId, memberUserId }) => {
      try {
        // Optimistic RxDB update: remove member from local household doc
        const db = await getRxDb()
        const doc = await db.households.findOne(householdId).exec()
        if (doc) {
          const filteredMembers = doc.members.filter((m) => m.userId !== memberUserId)
          await doc.patch({
            members: filteredMembers,
            memberCount: filteredMembers.length,
          })
        }
      } catch (err) {
        console.error('Failed to update local household after member removal:', err)
      }
      resyncHouseholds()
      toast.success("Member removed")
    },
    onError: () => {
      toast.error("Failed to remove member")
    },
  })
}
