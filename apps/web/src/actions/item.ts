"use server"

import { auth, verifyStoreAccess } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"

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

        // 1. Get storeId from item
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            select: { storeId: true }
        })

        if (!item) return failure("Item not found")

        // 2. Verify access
        await verifyStoreAccess(item.storeId, session.user.id)

        // 3. Update the item
        await prisma.item.update({
            where: { id: itemId },
            data: {
                name,
                sectionId,
                defaultUnit: defaultUnit || null,
            }
        })

        // Revalidate list pages that may display this item
        revalidatePath(`/lists`, "layout")
        revalidatePath(`/stores/${item.storeId}`)

        return success({ status: "UPDATED" })
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

        await verifyStoreAccess(storeId, session.user.id)

        // SQLite doesn't support case-insensitive mode in Prisma, use raw query
        // Build the LIKE pattern before passing to tagged template
        const likePattern = `%${query}%`

        const items = await prisma.$queryRaw<SearchResult[]>`
            SELECT id, name, sectionId, defaultUnit, purchaseCount
            FROM Item
            WHERE storeId = ${storeId}
              AND LOWER(name) LIKE LOWER(${likePattern})
            ORDER BY purchaseCount DESC, name ASC
            LIMIT 10
        `

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

        await verifyStoreAccess(storeId, session.user.id)

        const items = await prisma.item.findMany({
            where: {
                storeId,
                purchaseCount: {
                    gte: threshold,
                },
            },
            orderBy: {
                purchaseCount: "desc",
            },
            take: limit,
            select: {
                id: true,
                name: true,
                sectionId: true,
                defaultUnit: true,
                purchaseCount: true,
            },
        })

        return success(items)
    } catch (error: unknown) {
        console.error("Failed to get top items:", error)
        return failure("Failed to get top items")
    }
}

