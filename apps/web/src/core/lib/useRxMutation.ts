import { useCallback, useRef, useState } from "react"
import { getRxDb } from "@/core/rxdb"

type RxCollectionDoc = {
  incrementalPatch: (patch: Record<string, unknown>) => Promise<unknown>
  remove: () => Promise<unknown>
}

type RxMutationMode = "patch" | "remove"

type Callbacks = {
  onSuccess?: () => unknown
  onError?: (error: unknown) => unknown
}

type RxMutationConfig<TPatch = void> = {
  /** RxDB collection name (only those with push replication enabled). */
  collection: "items" | "listItems"
  /** Extract the document ID from the mutation input. */
  deriveDocId: (variables: TPatch) => string
  /** Action: "patch" calls incrementalPatch, "remove" calls doc.remove(). */
  mode?: RxMutationMode
  /** Build the patch payload (required for mode "patch").
   *  Receives the existing RxDB document so callers can derive values
   *  from the current state (e.g. purchasedQuantity fallback). */
  derivePatch?: (variables: TPatch, doc: Record<string, unknown>) => Record<string, unknown>
  /** Defaults to `${collection} doc not found`. */
  notFoundMsg?: string
  /** Hook-level callbacks (run before any inline callbacks). */
  onSuccess?: () => unknown
  onError?: (error: unknown) => unknown
}

type RxMutationReturn<TPatch> = {
  mutate: (variables: TPatch, callbacks?: Callbacks) => void
  mutateAsync: (variables: TPatch, callbacks?: Callbacks) => Promise<{ success: true }>
  isPending: boolean
}

/**
 * A lightweight mutation hook for RxDB collections that use push replication.
 *
 * Unlike the REST-based `useMutation` (which calls the API and triggers a
 * resync), this writes directly to the local RxDB database.  RxDB's push
 * replication then syncs the change to the server, and the server broadcasts
 * SSE to other clients so they converge.
 *
 * ```ts
 * const toggleItem = useRxMutation<ToggleInput>({
 *   collection: "listItems",
 *   deriveDocId: (v) => v.itemId,
 *   derivePatch: (v) => ({ isChecked: v.isChecked }),
 * })
 * toggleItem.mutate({ itemId, isChecked: true }, { onSuccess: () => ... })
 * ```
 */
export function useRxMutation<TPatch>(
  config: RxMutationConfig<TPatch>,
): RxMutationReturn<TPatch> {
  const [isPending, setIsPending] = useState(false)
  const configRef = useRef(config)
  configRef.current = config

  const mutateFn = useCallback(async (variables: TPatch) => {
    const { collection, deriveDocId, mode = "patch", derivePatch, notFoundMsg } = configRef.current

    const db = await getRxDb()
    const docId = deriveDocId(variables)
    const col = collection === "items" ? db.items : db.listItems
    const doc = await col.findOne(docId).exec()

    if (!doc) {
      throw new Error(notFoundMsg ?? `${collection} doc not found in local database`)
    }

    if (mode === "remove") {
      await (doc as unknown as RxCollectionDoc).remove()
    } else {
      if (!derivePatch) {
        throw new Error("derivePatch is required for mode 'patch'")
      }
      const patch = {
        ...derivePatch(variables, doc as unknown as Record<string, unknown>),
        updatedAt: new Date().toISOString(),
      }
      await (doc as unknown as RxCollectionDoc).incrementalPatch(patch)
    }

    return { success: true as const }
  }, [])

  const mutateAsync = useCallback(
    async (variables: TPatch, callbacks?: Callbacks) => {
      setIsPending(true)
      try {
        const result = await mutateFn(variables)
        await configRef.current.onSuccess?.()
        await callbacks?.onSuccess?.()
        return result
      } catch (error) {
        await configRef.current.onError?.(error)
        await callbacks?.onError?.(error)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [mutateFn],
  )

  const mutate = useCallback(
    (variables: TPatch, callbacks?: Callbacks) => {
      void mutateAsync(variables, callbacks)
    },
    [mutateAsync],
  )

  return { mutate, mutateAsync, isPending }
}
