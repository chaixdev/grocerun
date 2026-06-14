import { useRxMutation } from "@/core/lib/useRxMutation"
import { toast } from "sonner"

// ----- Mutations -----

interface UpdateItemInput {
  itemId: string
  name: string
  sectionId?: string
  defaultUnit?: string
  listId: string // for cache invalidation
}

export function useUpdateItem() {
  return useRxMutation<UpdateItemInput>({
    collection: "items",
    deriveDocId: (v) => v.itemId,
    derivePatch: ({ name, sectionId, defaultUnit }) => {
      const patch: Record<string, unknown> = { name }
      if (sectionId !== undefined) patch.sectionId = sectionId
      if (defaultUnit !== undefined) patch.defaultUnit = defaultUnit
      return patch
    },
    onSuccess: () => toast.success("Item updated"),
    onError: () => toast.error("Failed to update item"),
  })
}
