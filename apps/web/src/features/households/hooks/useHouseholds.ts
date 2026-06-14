import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"
import { storeDirectoryKeys } from "@/features/stores/hooks/useStoreDirectory"
import { householdKeys, settingsHouseholdKeys } from "./keys"

// ----- Types -----

export interface Household {
  id: string
  name: string
  createdAt: string
}

// ----- Query Keys -----
// Defined in ./keys.ts to break circular dependency with useInvitations
export { householdKeys } from "./keys"

// ----- Queries -----

export function useHouseholds() {
  return useQuery({
    queryKey: householdKeys.all,
    queryFn: () => api.get<Household[]>("/households"),
  })
}

// ----- Mutations -----

export function useCreateDefaultHousehold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post("/households", { name: "My Household" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: storeDirectoryKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Household created!")
    },
    onError: () => {
      toast.error("Failed to create household")
    },
  })
}

export function useCreateHousehold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string }) => api.post("/households", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: storeDirectoryKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Household created")
    },
    onError: () => {
      toast.error("Failed to create household")
    },
  })
}

export function useRenameHousehold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ householdId, name }: { householdId: string; name: string }) =>
      api.patch(`/households/${householdId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: storeDirectoryKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Household updated")
    },
    onError: () => {
      toast.error("Failed to rename household")
    },
  })
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/households/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all })
      queryClient.invalidateQueries({ queryKey: storeDirectoryKeys.all })
      queryClient.invalidateQueries({ queryKey: settingsHouseholdKeys.all })
      toast.success("Household deleted")
    },
    onError: () => {
      toast.error("Failed to delete household")
    },
  })
}
