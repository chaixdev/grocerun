"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const UpdateItemSchema = z.object({
    itemId: z.string(),
    name: z.string().min(1, "Name is required"),
    sectionId: z.string().optional(),
    defaultUnit: z.string().optional(),
})

import { verifyStoreAccess } from "@/lib/store-access"

// ...

export async function updateItem(data: z.infer<typeof UpdateItemSchema>) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const { itemId, name, sectionId, defaultUnit } = UpdateItemSchema.parse(data)

    // 1. Get storeId from item
    const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { storeId: true }
    })

    if (!item) {
        throw new Error("Item not found")
    }

    // 2. Verify access
    await verifyStoreAccess(item.storeId, session.user.id)

    // 3. Update the item
    await prisma.item.update({
        where: { id: itemId },
        data: {
            name,
            sectionId,
            defaultUnit: defaultUnit || null, // Handle empty string as null
        }
    })

    revalidatePath(`/lists/[id]`, "page")
    revalidatePath(`/stores/${item.storeId}`)

    return { status: "UPDATED" }
}

// --- GRO-13: Autocomplete Actions ---

const SearchItemsSchema = z.object({
    storeId: z.string(),
    query: z.string().min(1),
})

/**
 * Search items in a store by name (case-insensitive).
 * Returns top 10 matches sorted by purchaseCount DESC.
 */
export async function searchItems(data: z.infer<typeof SearchItemsSchema>) {
    const session = await auth()

    const { storeId, query } = SearchItemsSchema.parse(data)

    // Verify store access
    await verifyStoreAccess(storeId, session?.user?.id)

    // SQLite doesn't support case-insensitive mode in Prisma, use raw query
    // Build the LIKE pattern before passing to tagged template
    const likePattern = `%${query}%`

    const items = await prisma.$queryRaw<Array<{
        id: string
        name: string
        sectionId: string | null
        defaultUnit: string | null
        purchaseCount: number
    }>>`
        SELECT id, name, sectionId, defaultUnit, purchaseCount
        FROM Item
        WHERE storeId = ${storeId}
          AND LOWER(name) LIKE LOWER(${likePattern})
        ORDER BY purchaseCount DESC, name ASC
        LIMIT 10
    `

    return items
}

const GetTopItemsSchema = z.object({
    storeId: z.string(),
    limit: z.number().min(1).max(20).default(5),
    threshold: z.number().min(0).default(1),
})

/**
 * Get top purchased items for a store.
 * Reusable for autocomplete empty state and GRO-15 common items.
 */
export async function getTopItemsForStore(
    data: z.infer<typeof GetTopItemsSchema>
) {
    const session = await auth()

    const { storeId, limit, threshold } = GetTopItemsSchema.parse(data)

    // Verify store access
    await verifyStoreAccess(storeId, session?.user?.id)

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

    return items
}
