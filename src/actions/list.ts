"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { verifyStoreAccess } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CreateListSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    name: z.string().optional(),
})

export async function createList(data: z.infer<typeof CreateListSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = CreateListSchema.parse(data)

    const hasAccess = await verifyStoreAccess(session.user.id, validated.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    const existingList = await prisma.list.findFirst({
        where: {
            storeId: validated.storeId,
            status: { not: "COMPLETED" }
        }
    })

    if (existingList) {
        return existingList
    }

    const list = await prisma.list.create({
        data: {
            name: validated.name || "Shopping List",
            storeId: validated.storeId,
        },
    })

    revalidatePath(`/stores/${validated.storeId}`)
    return list
}

export async function getLists(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const hasAccess = await verifyStoreAccess(session.user.id, storeId)
    if (!hasAccess) return []

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

    const hasAccess = await verifyStoreAccess(session.user.id, storeId)
    if (!hasAccess) return null

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

    const hasAccess = await verifyStoreAccess(session.user.id, list.storeId)
    if (!hasAccess) return null

    return list
}

const AddItemSchema = z.object({
    listId: z.string(),
    name: z.string().min(1),
    sectionId: z.string().nullable().optional(),
    quantity: z.number().min(0.1).default(1),
    unit: z.string().optional(),
})

// Returns:
// - { status: "ADDED", listItem: ... } if item existed and was added
// - { status: "NEEDS_SECTION" } if item is new and needs a section
export async function addItemToList(data: z.infer<typeof AddItemSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { listId, name, sectionId, quantity, unit } = AddItemSchema.parse(data)

    const list = await prisma.list.findUnique({ where: { id: listId } })
    if (!list) throw new Error("List not found")

    if (list.status === "COMPLETED") throw new Error("List is completed")

    const hasAccess = await verifyStoreAccess(session.user.id, list.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

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
                unit: unit || item.defaultUnit, // Use provided unit or fallback to default
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
            sectionId: sectionId, // null or string
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
}

export async function toggleListItem(itemId: string, isChecked: boolean, purchasedQuantity?: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const listItem = await prisma.listItem.findUnique({
        where: { id: itemId },
        include: { list: true }
    })

    if (!listItem) throw new Error("Item not found")

    if (listItem.list.status === "COMPLETED") throw new Error("List is completed")

    const hasAccess = await verifyStoreAccess(session.user.id, listItem.list.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

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
}

export async function removeItemFromList(listItemId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const listItem = await prisma.listItem.findUnique({
        where: { id: listItemId },
        include: { list: true }
    })

    if (!listItem) throw new Error("Item not found")

    if (listItem.list.status === "COMPLETED") throw new Error("List is completed")

    const hasAccess = await verifyStoreAccess(session.user.id, listItem.list.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.listItem.delete({
        where: { id: listItemId }
    })

    revalidatePath(`/lists/${listItem.listId}`)
}

export async function completeList(listId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const list = await prisma.list.findUnique({
        where: { id: listId },
        include: { items: true }
    })

    if (!list) throw new Error("List not found")

    if (list.status === "COMPLETED") throw new Error("List is already completed")

    const hasAccess = await verifyStoreAccess(session.user.id, list.storeId)
    if (!hasAccess) throw new Error("Unauthorized")


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
}
