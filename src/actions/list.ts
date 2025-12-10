"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { verifyStoreAccess } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import type { List, ListItem, Item } from "@/core/db"

const CreateListSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    name: z.string().optional(),
})

export async function createList(data: z.infer<typeof CreateListSchema>): Promise<ActionResult<List>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = CreateListSchema.parse(data)

        await verifyStoreAccess(validated.storeId, session.user.id)

        const existingList = await prisma.list.findFirst({
            where: {
                storeId: validated.storeId,
                status: { not: "COMPLETED" }
            },
            orderBy: { createdAt: "desc" }
        })

        if (existingList) {
            return success(existingList)
        }

        const list = await prisma.list.create({
            data: {
                name: validated.name || "Shopping List",
                storeId: validated.storeId,
            },
        })

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

    try {
        await verifyStoreAccess(storeId, session.user.id)
    } catch {
        return []
    }

    return prisma.list.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { items: true }
            }
        }
    })
}

export async function getActiveListForStore(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        await verifyStoreAccess(storeId, session.user.id)
    } catch {
        return null
    }

    return prisma.list.findFirst({
        where: {
            storeId,
            status: {
                not: "COMPLETED"
            }
        },
        orderBy: { createdAt: "desc" },
        select: { id: true }
    })
}

export async function getList(listId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const list = await prisma.list.findUnique({
        where: { id: listId },
        include: {
            store: {
                include: {
                    sections: {
                        orderBy: { order: "asc" }
                    }
                }
            },
            items: {
                include: {
                    item: true
                }
            }
        }
    })

    if (!list) return null

    try {
        await verifyStoreAccess(list.storeId, session.user.id)
    } catch {
        return null
    }

    return list
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

        const list = await prisma.list.findUnique({ where: { id: listId } })
        if (!list) return { status: "ERROR", error: "List not found" }

        if (list.status === "COMPLETED") return { status: "ERROR", error: "List is completed" }

        await verifyStoreAccess(list.storeId, session.user.id)

        // 1. Check if item exists in catalog
        let item = await prisma.item.findUnique({
            where: {
                storeId_name: {
                    storeId: list.storeId,
                    name: name,
                }
            }
        })

        // 2. If item exists, add to list
        if (item) {
            // Update default unit if provided
            if (unit && unit !== item.defaultUnit) {
                await prisma.item.update({
                    where: { id: item.id },
                    data: { defaultUnit: unit }
                })
            }

            // Check if already in list
            const existingListItem = await prisma.listItem.findUnique({
                where: {
                    listId_itemId: {
                        listId,
                        itemId: item.id
                    }
                }
            })

            if (existingListItem) {
                return { status: "ALREADY_EXISTS" }
            }

            const listItem = await prisma.listItem.create({
                data: {
                    listId,
                    itemId: item.id,
                    quantity,
                    unit: unit || item.defaultUnit,
                },
                include: { item: true }
            })

            revalidatePath(`/lists/${listId}`)
            return { status: "ADDED", listItem }
        }

        // 3. If item is new...
        // If sectionId is undefined (not provided), ask for it.
        // If sectionId is null (explicitly uncategorized) or string (categorized), create it.
        if (sectionId === undefined) {
            return { status: "NEEDS_SECTION" }
        }

        // Create item (with or without section)
        item = await prisma.item.create({
            data: {
                name,
                storeId: list.storeId,
                sectionId: sectionId,
                defaultUnit: unit,
            }
        })

        const listItem = await prisma.listItem.create({
            data: {
                listId,
                itemId: item.id,
                quantity,
                unit,
            },
            include: { item: true }
        })

        revalidatePath(`/lists/${listId}`)
        return { status: "ADDED", listItem }
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

        const listItem = await prisma.listItem.findUnique({
            where: { id: itemId },
            include: { list: true }
        })

        if (!listItem) return failure("Item not found")

        if (listItem.list.status === "COMPLETED") return failure("List is completed")

        await verifyStoreAccess(listItem.list.storeId, session.user.id)

        // Logic:
        // If checking (true): use provided purchasedQuantity OR default to requested quantity
        // If unchecking (false): reset purchasedQuantity to null
        const finalPurchasedQuantity = isChecked
            ? (purchasedQuantity ?? listItem.quantity)
            : null

        await prisma.listItem.update({
            where: { id: itemId },
            data: {
                isChecked,
                purchasedQuantity: finalPurchasedQuantity
            }
        })

        revalidatePath(`/lists/${listItem.listId}`)
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

        const listItem = await prisma.listItem.findUnique({
            where: { id: listItemId },
            include: { list: true }
        })

        if (!listItem) return failure("Item not found")

        if (listItem.list.status === "COMPLETED") return failure("List is completed")

        await verifyStoreAccess(listItem.list.storeId, session.user.id)

        await prisma.listItem.update({
            where: { id: listItemId },
            data: {
                quantity,
                ...(unit !== undefined ? { unit } : {})
            }
        })

        revalidatePath(`/lists/${listItem.listId}`)
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

        const listItem = await prisma.listItem.findUnique({
            where: { id: listItemId },
            include: { list: true }
        })

        if (!listItem) return failure("Item not found")

        if (listItem.list.status === "COMPLETED") return failure("List is completed")

        await verifyStoreAccess(listItem.list.storeId, session.user.id)

        await prisma.listItem.delete({
            where: { id: listItemId }
        })

        revalidatePath(`/lists/${listItem.listId}`)
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

        const list = await prisma.list.findUnique({
            where: { id: listId },
            include: { items: true }
        })

        if (!list) return failure("List not found")

        if (list.status === "COMPLETED") return failure("List is already completed")

        await verifyStoreAccess(list.storeId, session.user.id)

        // Update list status and item stats in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Mark list as completed
            await tx.list.update({
                where: { id: listId },
                data: { status: "COMPLETED" }
            })

            // 2. Update catalog stats for checked items
            const checkedItems = list.items.filter(i => i.isChecked)
            for (const listItem of checkedItems) {
                await tx.item.update({
                    where: { id: listItem.itemId },
                    data: {
                        purchaseCount: { increment: 1 },
                        lastPurchased: new Date()
                    }
                })
            }
        })

        revalidatePath(`/stores/${list.storeId}`)
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

        const list = await prisma.list.findUnique({
            where: { id: listId },
        })

        if (!list) return failure("List not found")

        await verifyStoreAccess(list.storeId, session.user.id)

        if (list.status !== "PLANNING") return failure("List must be in PLANNING state to start shopping")

        await prisma.list.update({
            where: { id: listId },
            data: { status: "SHOPPING" }
        })

        revalidatePath(`/lists/${listId}`)
        revalidatePath(`/stores/${list.storeId}`)
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

        const list = await prisma.list.findUnique({
            where: { id: listId },
        })

        if (!list) return failure("List not found")

        await verifyStoreAccess(list.storeId, session.user.id)

        if (list.status !== "SHOPPING") return failure("List must be in SHOPPING state to cancel")

        await prisma.list.update({
            where: { id: listId },
            data: { status: "PLANNING" }
        })

        revalidatePath(`/lists/${listId}`)
        revalidatePath(`/stores/${list.storeId}`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to cancel shopping:", error)
        return failure("Failed to cancel shopping")
    }
}

