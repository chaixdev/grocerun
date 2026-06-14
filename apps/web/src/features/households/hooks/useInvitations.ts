import { useEffect, useState } from "react"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { removeHouseholdSubtreeFromLocalDb } from "@/core/rxdb/cleanup"
import {
  getRxDb,
  resetRxDb,
  resyncHouseholds,
  resyncStores,
} from "@/core/rxdb"
import { ApiError } from "@/core/lib/api"
import { toast } from "sonner"
import { router } from "@/router"

// ----- Types -----

export interface InvitationData {
  token: string
  expiresAt: string
}

export interface InvitationDetails {
  householdName: string
  ownerName: string
  creatorName: string
}

// ----- Settings Households -----
// Extended household type with ownerId and member count, used by settings page

export interface SettingsHousehold {
  id: string
  name: string
  ownerId: string | null
  _count: { users: number }
}

export function useSettingsHouseholds() {
  const [data, setData] = useState<SettingsHousehold[] | undefined>(undefined)
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
            setData(
              docs.map((doc) => ({
                id: doc.id,
                name: doc.name,
                ownerId: doc.ownerId ?? null,
                _count: { users: doc.memberCount },
              })),
            )
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

// ----- Invitation Mutations -----

export function useCreateInvitation() {
  return useMutation({
    mutationFn: (data: { householdId: string }) =>
      api.post<InvitationData>("/invitations", data),
    onSuccess: () => {
      resyncHouseholds()
      resyncStores()
    },
    onError: () => {
      toast.error("Failed to create invitation")
    },
  })
}

export function useGetInvitationDetails() {
  return useMutation({
    mutationFn: (token: string) =>
      api.get<InvitationDetails>(`/invitations/${token}/details`),
    onError: () => {
      toast.error("Failed to verify invitation")
    },
  })
}

export function useJoinHousehold() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ householdName: string }>("/invitations/join", { token }),
    onSuccess: async (data) => {
      await resetRxDb()
      resyncHouseholds()
      resyncStores()
      await getRxDb()
      toast.success("Joined Household", {
        description: `You have successfully joined ${data.householdName}`,
      })
      router.navigate({ to: "/lists", replace: true })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 400 && String(error.message).includes('already a member')) {
        await resetRxDb()
        await getRxDb()
        toast.success("Household already linked", {
          description: "Refreshing your local data.",
        })
        router.navigate({ to: "/lists", replace: true })
        return
      }
      toast.error("Failed to join household")
    },
  })
}

export function useLeaveHousehold() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/households/${id}/leave`, {}),
    onSuccess: async (_data, householdId) => {
      resyncHouseholds()
      resyncStores()
      await removeHouseholdSubtreeFromLocalDb(householdId)
      toast.success("Left household")
    },
    onError: () => {
      toast.error("Failed to leave household")
    },
  })
}
