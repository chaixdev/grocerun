import { useRxQuery } from "@/core/lib/useRxQuery"
import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import {
  resyncHouseholds,
  resyncStores,
} from "@/core/rxdb"
import { refreshAfterHouseholdChange, cleanupAfterLeaveHousehold } from "@/core/rxdb/household-cleanup"
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

export interface HouseholdMemberSummary {
  userId: string
  name: string
  image: string
}

export interface SettingsHousehold {
  id: string
  name: string
  ownerId: string | null
  _count: { users: number }
  members: HouseholdMemberSummary[]
}

export function useSettingsHouseholds() {
  return useRxQuery<SettingsHousehold[]>(
    {
      setup: async (db, triggerUpdate) => {
        const compute = async () => {
          const docs = await db.households.find({ sort: [{ updatedAt: 'desc' }] }).exec()
          return docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            ownerId: doc.ownerId ?? null,
            _count: { users: doc.memberCount },
            members: doc.members ?? [],
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
      await refreshAfterHouseholdChange()
      toast.success("Joined Household", {
        description: `You have successfully joined ${data.householdName}`,
      })
      router.navigate({ to: "/lists", replace: true })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 400 && String(error.message).includes('already a member')) {
        await refreshAfterHouseholdChange()
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
      await cleanupAfterLeaveHousehold(householdId)
      toast.success("Left household")
    },
    onError: () => {
      toast.error("Failed to leave household")
    },
  })
}
