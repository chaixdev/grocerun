"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import { apiClient, getAuthJwt } from "@/core/lib/api-client"
import { UpdateItemSchema, SearchItemsSchema, GetTopItemsSchema } from "@grocerun/dto"

export async function updateItem(data: z.infer<typeof UpdateItemSchema>): Promise<ActionResult<{ status: "UPDATED" }>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { itemId, name, sectionId, defaultUnit } = UpdateItemSchema.parse(data)
        const result = await apiClient.patch<{ status: "UPDATED" }>(
            `/items/${itemId}`,
            { name, sectionId, defaultUnit },
            z.object({ status: z.literal("UPDATED") }),
            jwt
        )

        revalidatePath(`/lists`, "layout")
        return success(result)
    } catch (error: unknown) {
        console.error("Failed to update item:", error)
        return failure("Failed to update item")
    }
}

// --- GRO-13: Autocomplete Actions ---

type SearchResult = {
    id: string
    name: string
    sectionId: string | null
    defaultUnit: string | null
    purchaseCount: number
}

/**
 * Search items in a store by name (case-insensitive).
 * Returns top 10 matches sorted by purchaseCount DESC.
 */
export async function searchItems(data: z.infer<typeof SearchItemsSchema>): Promise<ActionResult<SearchResult[]>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { storeId, query } = SearchItemsSchema.parse(data)
        const items = await apiClient.get<SearchResult[]>(
            `/items/search?storeId=${storeId}&query=${encodeURIComponent(query)}`,
            z.array(z.object({
                id: z.string(),
                name: z.string(),
                sectionId: z.string().nullable(),
                defaultUnit: z.string().nullable(),
                purchaseCount: z.number(),
            })),
            jwt
        )

        return success(items)
    } catch (error: unknown) {
        console.error("Failed to search items:", error)
        return failure("Failed to search items")
    }
}

/**
 * Get top purchased items for a store.
 * Reusable for autocomplete empty state and GRO-15 common items.
 */
export async function getTopItemsForStore(
    data: z.infer<typeof GetTopItemsSchema>
): Promise<ActionResult<SearchResult[]>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { storeId, limit, threshold } = GetTopItemsSchema.parse(data)
        const items = await apiClient.get<SearchResult[]>(
            `/items/top?storeId=${storeId}&limit=${limit}&threshold=${threshold}`,
            z.array(z.object({
                id: z.string(),
                name: z.string(),
                sectionId: z.string().nullable(),
                defaultUnit: z.string().nullable(),
                purchaseCount: z.number(),
            })),
            jwt
        )

        return success(items)
    } catch (error: unknown) {
        console.error("Failed to get top items:", error)
        return failure("Failed to get top items")
    }
}
