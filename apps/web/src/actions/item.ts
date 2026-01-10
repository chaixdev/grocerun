"use server"

import { auth } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'

const UpdateItemSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    name: z.string().min(1, "Name is required"),
    sectionId: z.string().optional(),
    defaultUnit: z.string().optional(),
})

export async function updateItem(data: z.infer<typeof UpdateItemSchema>): Promise<ActionResult<{ status: "UPDATED" }>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { itemId, name, sectionId, defaultUnit } = UpdateItemSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

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

const SearchItemsSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    query: z.string().min(1),
})

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
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { storeId, query } = SearchItemsSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

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

const GetTopItemsSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    limit: z.number().min(1).max(20).default(5),
    threshold: z.number().min(0).default(1),
})

/**
 * Get top purchased items for a store.
 * Reusable for autocomplete empty state and GRO-15 common items.
 */
export async function getTopItemsForStore(
    data: z.infer<typeof GetTopItemsSchema>
): Promise<ActionResult<SearchResult[]>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { storeId, limit, threshold } = GetTopItemsSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

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

