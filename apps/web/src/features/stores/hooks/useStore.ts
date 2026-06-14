import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
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

// ----- Query Keys -----

export const storeKeys = {
  all: ["stores"] as const,
  detail: (id: string) => [...storeKeys.all, id] as const,
}

// ----- Queries -----

export function useStore(storeId: string) {
  return useQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn: () => api.get<Store>(`/stores/${storeId}`, StoreSchema),
  })
}

// ----- Mutations -----

export function useUpdateStore(storeId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; location?: string; imageUrl?: string }) =>
      api.patch<Store>(`/stores/${storeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) })
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
      toast.success("Store updated successfully")
      options?.onSuccess?.()
    },
    onError: () => {
      toast.error("Failed to update store")
    },
  })
}

export function useDeleteStore(storeId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete(`/stores/${storeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
      toast.success("Store deleted")
      options?.onSuccess?.()
    },
    onError: () => {
      toast.error("Failed to delete store")
    },
  })
}
