import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"

// ----- Types -----

export interface Section {
  id: string
  name: string
  order: number
}

// ----- Query Keys -----

export const sectionKeys = {
  all: ["sections"] as const,
  byStore: (storeId: string) => [...sectionKeys.all, "store", storeId] as const,
}

// ----- Queries -----

export function useSections(storeId: string) {
  return useQuery({
    queryKey: sectionKeys.byStore(storeId),
    queryFn: () => api.get<Section[]>(`/sections/store/${storeId}`),
  })
}

// ----- Mutations -----

export function useCreateSection(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; order?: number }) =>
      api.post<Section>("/sections", { ...data, storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.byStore(storeId) })
    },
    onError: () => {
      toast.error("Failed to create section")
    },
  })
}

export function useUpdateSection(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/sections/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.byStore(storeId) })
    },
    onError: () => {
      toast.error("Failed to update section")
    },
  })
}

export function useDeleteSection(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/sections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.byStore(storeId) })
      toast.success("Section deleted")
    },
    onError: () => {
      toast.error("Failed to delete section")
    },
  })
}

export function useReorderSections(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.post(`/sections/store/${storeId}/reorder`, { orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.byStore(storeId) })
    },
    onError: () => {
      toast.error("Failed to save order")
    },
  })
}
