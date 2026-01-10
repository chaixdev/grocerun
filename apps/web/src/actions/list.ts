"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import type { List, ListItem, Item } from "@/core/db"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'
import { CreateListSchema } from "@grocerun/dto"


export async function createList(data: z.infer<typeof CreateListSchema>): Promise<ActionResult<List>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = CreateListSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const list = await apiClient.post(
            '/lists',
            validated,
            z.any(),
            jwt
        )

        revalidatePath(`/stores/${validated.storeId}`)
        return success(list)
    } catch (error: unknown) {
        console.error("Failed to create list:", error)
        return failure("Failed to create list")
    }
}

export async function getLists(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const token = (session as any).accessToken
    if (!token?.sub) return []

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const jwt = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)

    try {
        const lists = await apiClient.get(
            `/lists/store/${storeId}`,
            z.array(z.any()),
            jwt
        )
        return lists
    } catch (error) {
        console.error('Failed to fetch lists:', error)
        return []
    }
}

export async function getActiveListForStore(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const token = (session as any).accessToken
    if (!token?.sub) return null

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const jwt = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)

    try {
        const list = await apiClient.get(
            `/lists/store/${storeId}/active`,
            z.object({ id: z.string() }).nullable(),
            jwt
        )
        return list
    } catch (error) {
        console.error('Failed to fetch active list:', error)
        return null
    }
}

export async function getList(listId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const token = (session as any).accessToken
    if (!token?.sub) return null

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const jwt = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)

    try {
        const list = await apiClient.get(
            `/lists/${listId}`,
            z.any(),
            jwt
        )
        return list
    } catch (error) {
        console.error('Failed to fetch list:', error)
        return null
    }
}

const AddItemSchema = z.object({
    listId: z.string(),
    name: z.string().min(1),
    sectionId: z.string().nullable().optional(),
    quantity: z.number().min(0.1).default(1),
    unit: z.string().optional(),
})

type AddItemResult =
    | { status: "ADDED"; listItem: ListItem & { item: Item } }
    | { status: "ALREADY_EXISTS" }
    | { status: "NEEDS_SECTION" }
    | { status: "ERROR"; error: string }

/**
 * Add an item to a list.
 * Returns:
 * - { status: "ADDED", listItem: ... } if item was added
 * - { status: "ALREADY_EXISTS" } if item is already in the list
 * - { status: "NEEDS_SECTION" } if item is new and needs a section
 * - { status: "ERROR", error: string } if an error occurred
 */
export async function addItemToList(data: z.infer<typeof AddItemSchema>): Promise<AddItemResult> {
    const session = await auth()
    if (!session?.user?.id) return { status: "ERROR", error: "Unauthorized" }

    try {
        const { listId, name, sectionId, quantity, unit } = AddItemSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) return { status: "ERROR", error: "Unauthorized" }

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const result = await apiClient.post(
            '/lists/items/add',
            { listId, name, sectionId, quantity, unit },
            z.any(),
            jwt
        )

        if (result.status === "ADDED") {
            revalidatePath(`/lists/${listId}`)
        }
        return result
    } catch (error: unknown) {
        console.error("Failed to add item to list:", error)
        return { status: "ERROR", error: "Failed to add item" }
    }
}

const ToggleItemSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    isChecked: z.boolean(),
    purchasedQuantity: z.number().optional(),
})

export async function toggleListItem(data: z.infer<typeof ToggleItemSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { itemId, isChecked, purchasedQuantity } = ToggleItemSchema.parse(data)

        // Fetch listId first for revalidation
        const listItem = await prisma.listItem.findUnique({
            where: { id: itemId },
            select: { listId: true }
        })
        if (!listItem) return failure("Item not found")
        const listId = listItem.listId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.patch(
            '/lists/items/toggle',
            { itemId, isChecked, purchasedQuantity },
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/lists/${listId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to toggle list item:", error)
        return failure("Failed to update item")
    }
}

const RemoveItemSchema = z.object({
    listItemId: z.string().min(1, "Item ID is required"),
})

const UpdateQuantitySchema = z.object({
    listItemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().min(0.1, "Quantity must be at least 0.1"),
    unit: z.string().optional(),
})

export async function updateListItemQuantity(data: z.infer<typeof UpdateQuantitySchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { listItemId, quantity, unit } = UpdateQuantitySchema.parse(data)

        // Fetch listId first for revalidation
        const listItem = await prisma.listItem.findUnique({
            where: { id: listItemId },
            select: { listId: true }
        })
        if (!listItem) return failure("Item not found")
        const listId = listItem.listId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.patch(
            '/lists/items/quantity',
            { listItemId, quantity, unit },
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/lists/${listId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to update item quantity:", error)
        return failure("Failed to update quantity")
    }
}

export async function removeItemFromList(data: z.infer<typeof RemoveItemSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { listItemId } = RemoveItemSchema.parse(data)

        // Fetch listId first for revalidation
        const listItem = await prisma.listItem.findUnique({
            where: { id: listItemId },
            select: { listId: true }
        })
        if (!listItem) return failure("Item not found")
        const listId = listItem.listId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.delete(
            `/lists/items/${listItemId}`,
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/lists/${listId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to remove item from list:", error)
        return failure("Failed to remove item")
    }
}

const ListIdSchema = z.object({
    listId: z.string().min(1, "List ID is required"),
})

export async function completeList(data: z.infer<typeof ListIdSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { listId } = ListIdSchema.parse(data)

        // Fetch storeId first for revalidation
        const list = await prisma.list.findUnique({
            where: { id: listId },
            select: { storeId: true }
        })
        if (!list) return failure("List not found")
        const storeId = list.storeId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.post(
            `/lists/${listId}/complete`,
            {},
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/stores/${storeId}`)
        revalidatePath(`/lists/${listId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to complete list:", error)
        return failure("Failed to complete list")
    }
}

export async function startShopping(data: z.infer<typeof ListIdSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { listId } = ListIdSchema.parse(data)

        // Fetch storeId first for revalidation
        const list = await prisma.list.findUnique({
            where: { id: listId },
            select: { storeId: true }
        })
        if (!list) return failure("List not found")
        const storeId = list.storeId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.post(
            `/lists/${listId}/start-shopping`,
            {},
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/lists/${listId}`)
        revalidatePath(`/stores/${storeId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to start shopping:", error)
        return failure("Failed to start shopping")
    }
}

export async function cancelShopping(data: z.infer<typeof ListIdSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { listId } = ListIdSchema.parse(data)

        // Fetch storeId first for revalidation
        const list = await prisma.list.findUnique({
            where: { id: listId },
            select: { storeId: true }
        })
        if (!list) return failure("List not found")
        const storeId = list.storeId

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.post(
            `/lists/${listId}/cancel-shopping`,
            {},
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath(`/lists/${listId}`)
        revalidatePath(`/stores/${storeId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to cancel shopping:", error)
        return failure("Failed to cancel shopping")
    }
}

