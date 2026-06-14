import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"
import { storeKeys } from "./useStore"

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

// Raw API response shape from /household-overview
interface OverviewHousehold {
  id: string
  name: string
  stores: Array<{
    id: string
    name: string
    location: string | null
    lists: Array<{ id: string }>
  }>
}

// ----- Query Keys -----

export const storeDirectoryKeys = {
  all: ["store-directory"] as const,
}

// ----- Queries -----

export function useStoreDirectory() {
  return useQuery({
    queryKey: storeDirectoryKeys.all,
    queryFn: async (): Promise<DirectoryHousehold[]> => {
      const households = await api.get<OverviewHousehold[]>("/household-overview")
      return households.map((h) => ({
        id: h.id,
        name: h.name,
        stores: (h.stores ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location ?? null,
          activeListId: s.lists?.[0]?.id ?? null,
        })),
      }))
    },
  })
}

// ----- Mutations -----

export function useCreateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; householdId: string; location?: string }) =>
      api.post("/stores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeDirectoryKeys.all })
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
      toast.success("Store created")
    },
    onError: () => {
      toast.error("Failed to create store")
    },
  })
}
