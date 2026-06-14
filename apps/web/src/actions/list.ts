"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import { apiClient, getAuthJwt } from "@/core/lib/api-client"
import {
    CreateListSchema,
    AddItemSchema,
    ToggleItemSchema,
    RemoveItemSchema,
    UpdateQuantitySchema,
    ListIdSchema
} from "@grocerun/dto"

// Extended schemas for actions that need parent IDs for cache revalidation.
// These IDs are NOT sent to the API — they are used only for revalidatePath.
const ToggleItemActionSchema = ToggleItemSchema.extend({
    listId: z.string().min(1, "List ID is required"),
})
const UpdateQuantityActionSchema = UpdateQuantitySchema.extend({
    listId: z.string().min(1, "List ID is required"),
})
const RemoveItemActionSchema = RemoveItemSchema.extend({
    listId: z.string().min(1, "List ID is required"),
})
const ListIdWithStoreSchema = ListIdSchema.extend({
    storeId: z.string().min(1, "Store ID is required"),
})

// Response types — match API response shapes.
// Defined here (not in dto) because these are read-only view types, not shared contracts.
type ListItem = {
    id: string
    quantity: number | null
    unit: string | null
    isChecked: boolean
    item: Item
}

type Item = {
    id: string
    name: string
    sectionId: string | null
}

type AddItemResult =
    | { status: "ADDED"; listItem: ListItem }
    | { status: "ALREADY_EXISTS" }
    | { status: "NEEDS_SECTION" }
    | { status: "ERROR"; error: string }


export async function createList(data: z.infer<typeof CreateListSchema>): Promise<ActionResult<unknown>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const validated = CreateListSchema.parse(data)

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
    const jwt = await getAuthJwt()
    if (!jwt) return []

    try {
        return await apiClient.get(
            `/lists/store/${storeId}`,
            z.array(z.any()),
            jwt
        )
    } catch (error) {
        console.error('Failed to fetch lists:', error)
        return []
    }
}

export async function getActiveListForStore(storeId: string) {
    const jwt = await getAuthJwt()
    if (!jwt) return null

    try {
        return await apiClient.get(
            `/lists/store/${storeId}/active`,
            z.object({ id: z.string() }).nullable(),
            jwt
        )
    } catch (error) {
        console.error('Failed to fetch active list:', error)
        return null
    }
}

export async function getList(listId: string) {
    const jwt = await getAuthJwt()
    if (!jwt) return null

    try {
        return await apiClient.get(
            `/lists/${listId}`,
            z.any(),
            jwt
        )
    } catch (error) {
        console.error('Failed to fetch list:', error)
        return null
    }
}

/**
 * Add an item to a list.
 * Returns:
 * - { status: "ADDED", listItem: ... } if item was added
 * - { status: "ALREADY_EXISTS" } if item is already in the list
 * - { status: "NEEDS_SECTION" } if item is new and needs a section
 * - { status: "ERROR", error: string } if an error occurred
 */
export async function addItemToList(data: z.infer<typeof AddItemSchema>): Promise<AddItemResult> {
    const jwt = await getAuthJwt()
    if (!jwt) return { status: "ERROR", error: "Unauthorized" }

    try {
        const { listId, name, sectionId, quantity, unit } = AddItemSchema.parse(data)

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

export async function toggleListItem(data: z.infer<typeof ToggleItemActionSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { itemId, isChecked, purchasedQuantity, listId } = ToggleItemActionSchema.parse(data)

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

export async function updateListItemQuantity(data: z.infer<typeof UpdateQuantityActionSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { listItemId, quantity, unit, listId } = UpdateQuantityActionSchema.parse(data)

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

export async function removeItemFromList(data: z.infer<typeof RemoveItemActionSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { listItemId, listId } = RemoveItemActionSchema.parse(data)

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

export async function completeList(data: z.infer<typeof ListIdWithStoreSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { listId, storeId } = ListIdWithStoreSchema.parse(data)

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

export async function startShopping(data: z.infer<typeof ListIdWithStoreSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { listId, storeId } = ListIdWithStoreSchema.parse(data)

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

export async function cancelShopping(data: z.infer<typeof ListIdWithStoreSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { listId, storeId } = ListIdWithStoreSchema.parse(data)

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
