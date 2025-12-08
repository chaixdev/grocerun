"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { verifyStoreAccess } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const SectionSchema = z.object({
    name: z.string(),
    storeId: z.string().min(1, "Store ID is required"),
    order: z.number().optional(),
})

export async function getSections(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const hasAccess = await verifyStoreAccess(session.user.id, storeId)
    if (!hasAccess) return []

    return prisma.section.findMany({
        where: { storeId },
        orderBy: { order: "asc" },
    })
}

export async function createSection(data: z.infer<typeof SectionSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = SectionSchema.parse(data)

    const hasAccess = await verifyStoreAccess(session.user.id, validated.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    // If order is provided, shift everything down
    if (validated.order !== undefined) {
        await prisma.section.updateMany({
            where: {
                storeId: validated.storeId,
                order: { gte: validated.order },
            },
            data: {
                order: { increment: 1 },
            },
        })
    }

    // Get max order if not provided
    let newOrder = validated.order
    if (newOrder === undefined) {
        const lastSection = await prisma.section.findFirst({
            where: { storeId: validated.storeId },
            orderBy: { order: "desc" },
        })
        newOrder = (lastSection?.order ?? -1) + 1
    }

    const section = await prisma.section.create({
        data: {
            name: validated.name,
            storeId: validated.storeId,
            order: newOrder,
        },
    })

    revalidatePath(`/stores/${validated.storeId}/settings`)
    return section
}

export async function updateSection(id: string, name: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // We need to find the storeId to verify access
    const section = await prisma.section.findUnique({ where: { id } })
    if (!section) throw new Error("Section not found")

    const hasAccess = await verifyStoreAccess(session.user.id, section.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.section.update({
        where: { id },
        data: { name },
    })

    revalidatePath(`/stores/${section.storeId}/settings`)
}

export async function deleteSection(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const section = await prisma.section.findUnique({ where: { id } })
    if (!section) throw new Error("Section not found")

    const hasAccess = await verifyStoreAccess(session.user.id, section.storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.section.delete({ where: { id } })
    revalidatePath(`/stores/${section.storeId}/settings`)
}

export async function reorderSections(storeId: string, orderedIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const hasAccess = await verifyStoreAccess(session.user.id, storeId)
    if (!hasAccess) throw new Error("Unauthorized")

    // Transaction to update all orders
    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.section.update({
                where: { id },
                data: { order: index },
            })
        )
    )

    revalidatePath(`/stores/${storeId}/settings`)
}
