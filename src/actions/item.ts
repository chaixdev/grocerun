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

export async function updateItem(data: z.infer<typeof UpdateItemSchema>) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const { itemId, name, sectionId, defaultUnit } = UpdateItemSchema.parse(data)

    // 1. Verify access to the store via the item (and its household)
    const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
            store: {
                include: {
                    household: {
                        include: {
                            users: true
                        }
                    }
                }
            }
        }
    })

    if (!item) {
        throw new Error("Item not found")
    }

    const hasAccess = item.store.household.users.some(u => u.id === session.user?.id)
    if (!hasAccess) {
        throw new Error("Unauthorized access to store")
    }

    // 2. Update the item
    await prisma.item.update({
        where: { id: itemId },
        data: {
            name,
            sectionId,
            defaultUnit: defaultUnit || null, // Handle empty string as null
        }
    })

    revalidatePath(`/dashboard/lists/[id]`, "page")
    revalidatePath(`/dashboard/stores/${item.storeId}`)

    return { status: "UPDATED" }
}
