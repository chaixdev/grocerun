import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useCompleteList, useCreateList } from "./useLists"
import { useAddItem } from "./useAddItem"

interface MissingItem {
  id: string
  name: string
  quantity: number
  unit: string | null
}

interface CompleteAndCreateResult {
  completeSucceeded: boolean
  createSucceeded: boolean
  addedCount: number
  failedCount: number
  errorMessage?: string
}

/**
 * Orchestrates the chained flow: complete current list → create new
 * list → add unchecked items to the new list.
 *
 * Exposes a single `execute()` and a composite `isExecuting` flag that
 * spans the entire chain, preventing double-taps on the UI button.
 *
 * ## Failure modes
 * - completeList fails → error toast (already handled by `useCompleteList`),
 *   no further steps run.
 * - createList fails after completeList → error toast. The original list
 *   is already COMPLETED (non-reversible known limitation).
 * - individual addItem failures → skipped, counted, reported in
 *   aggregated summary toast.
 */
export function useCompleteAndCreateList() {
  const [isExecuting, setIsExecuting] = useState(false)
  const completeList = useCompleteList()
  const createList = useCreateList()
  const addItem = useAddItem()

  const execute = useCallback(
    async (
      listId: string,
      storeId: string,
      missingItems: MissingItem[],
    ): Promise<CompleteAndCreateResult> => {
      setIsExecuting(true)

      // Step 1: Complete the current list
      try {
        await completeList.mutateAsync({ listId, storeId })
      } catch {
        setIsExecuting(false)
        return {
          completeSucceeded: false,
          createSucceeded: false,
          addedCount: 0,
          failedCount: 0,
        }
      }

      // Step 2: Create the new list.
      // useCreateList.onSuccess inserts the list directly into RxDB
      // so it is immediately visible to the addItem loop below.
      let newListId: string
      try {
        const list = await createList.mutateAsync({ storeId })
        newListId = list.id
      } catch {
        // completeList succeeded but createList failed — non-recoverable.
        setIsExecuting(false)
        toast.error("Trip completed, but failed to create new list.")
        return {
          completeSucceeded: true,
          createSucceeded: false,
          addedCount: 0,
          failedCount: 0,
          errorMessage: "Failed to create new list",
        }
      }

      // Step 3: Add each unchecked item to the new list
      let addedCount = 0
      let failedCount = 0

      for (const item of missingItems) {
        try {
          const result = await addItem.mutateAsync({
            listId: newListId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit ?? undefined,
          })
          if (result.status === "ADDED") {
            addedCount++
          } else if (result.status === "ERROR") {
            failedCount++
          }
          // ALREADY_EXISTS and NEEDS_SECTION are no-ops —
          // neither added nor failed.
        } catch {
          failedCount++
        }
      }

      // Step 4: Aggregated summary toast
      if (failedCount === 0) {
        toast.success(`New list created with ${addedCount} items.`)
      } else {
        toast(
          `${addedCount} items added to new list. ${failedCount} failed — you can add them from the list view.`,
        )
      }

      setIsExecuting(false)
      return {
        completeSucceeded: true,
        createSucceeded: true,
        addedCount,
        failedCount,
      }
    },
    [completeList, createList, addItem],
  )

  return { execute, isExecuting }
}
