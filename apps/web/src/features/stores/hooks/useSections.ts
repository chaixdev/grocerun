/**
 * useSections — Phase 4a: reads from RxDB (local-first), writes via REST API.
 *
 * The hook interface is preserved exactly — components see no difference:
 *   - useSections(storeId)      → { data: Section[], isLoading: boolean }
 *   - useCreateSection(storeId) → mutation (still REST)
 *   - useUpdateSection(storeId) → mutation (still REST)
 *   - useDeleteSection(storeId) → mutation (still REST)
 *   - useReorderSections(storeId) → mutation (still REST)
 *
 * RxDB replication runs in the background and keeps the local Dexie store
 * in sync with the server. Mutations go directly to the REST API; on success
 * the server-assigned updatedAt timestamp propagates back via the next pull.
 *
 * Phase 4b will migrate the mutation hooks to write to RxDB first (optimistic
 * local write + push replication) once the PoC is validated end-to-end.
 */

import { useState, useEffect } from 'react'
import { useMutation } from '@/core/lib/useMutation'
import { api } from '@/core/lib/api'
import { getRxDb, resyncStores } from '@/core/rxdb'
import { toast } from 'sonner'

// ----- Types -----

export interface Section {
  id: string
  name: string
  order: number
}

// ---------------------------------------------------------------------------
// useSections — reactive RxDB subscription
// ---------------------------------------------------------------------------

/**
 * Returns sections for a store, sorted by order.
 *
 * Data comes from the local RxDB/Dexie store. RxDB's replication plugin
 * keeps it in sync with the server in the background.
 *
 * isLoading is true until the DB is initialised and the first query result
 * arrives. After that, updates are instant (no network round-trip).
 */
export function useSections(storeId: string): { data: Section[]; isLoading: boolean } {
  const [data, setData] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return

    let cancelled = false
    let subscription: { unsubscribe(): void } | null = null

    getRxDb().then((db) => {
      if (cancelled) return

      // RxDB query — reactive: emits on every local change
      const query = db.sections
        .find({
          selector: { storeId: { $eq: storeId } },
          sort: [{ order: 'asc' }],
        })

      subscription = query.$.subscribe((docs) => {
        if (cancelled) return
        setData(
          docs.map((d) => ({
            id: d.id,
            name: d.name,
            order: d.order,
          })),
        )
        setIsLoading(false)
      })
    }).catch((err) => {
      console.error('[useSections] RxDB init failed:', err)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [storeId])

  return { data, isLoading }
}

// ---------------------------------------------------------------------------
// Mutation hooks — REST API (Phase 4a: unchanged from Phase 3)
// ---------------------------------------------------------------------------

export function useCreateSection(storeId: string) {
  return useMutation({
    mutationFn: (data: { name: string; order?: number }) =>
      api.post<Section>('/sections', { ...data, storeId }),
    onSuccess: () => {
      resyncStores()
    },
    onError: () => {
      toast.error('Failed to create section')
    },
  })
}

export function useUpdateSection(storeId: string) {
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/sections/${id}`, { name }),
    onSuccess: () => {
      resyncStores()
    },
    onError: () => {
      toast.error('Failed to update section')
    },
  })
}

export function useDeleteSection(storeId: string) {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sections/${id}`),
    onSuccess: () => {
      resyncStores()
      toast.success('Section deleted')
    },
    onError: () => {
      toast.error('Failed to delete section')
    },
  })
}

export function useReorderSections(storeId: string) {
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.post(`/sections/store/${storeId}/reorder`, { orderedIds }),
    onSuccess: () => {
      resyncStores()
    },
    onError: () => {
      toast.error('Failed to save order')
    },
  })
}
