import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"
import { householdKeys, settingsHouseholdKeys } from "./keys"

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

// Query keys defined in ./keys.ts to break circular dependency
export { settingsHouseholdKeys } from "./keys"

export function useSettingsHouseholds() {
  return useQuery({
    queryKey: settingsHouseholdKeys.all,
    queryFn: () => api.get<SettingsHousehold[]>("/households"),
  })
}

// ----- Invitation Mutations -----

export function useCreateInvitation() {
  return useMutation({
    mutationFn: (data: { householdId: string }) =>
      api.post<InvitationData>("/invitations", data),
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ householdName: string }>("/invitations/join", { token }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Joined Household", {
        description: `You have successfully joined ${data.householdName}`,
      })
    },
    onError: () => {
      toast.error("Failed to join household")
    },
  })
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.post(`/households/${id}/leave`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Left household")
    },
    onError: () => {
      toast.error("Failed to leave household")
    },
  })
}
