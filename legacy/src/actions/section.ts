"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { verifyStoreAccess } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import type { Section } from "@/core/db"

const SectionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    storeId: z.string().min(1, "Store ID is required"),
    order: z.number().optional(),
})

const UpdateSectionSchema = z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
})

const DeleteSectionSchema = z.object({
    id: z.string().min(1, "ID is required"),
})

const ReorderSectionsSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    orderedIds: z.array(z.string().min(1)).min(1),
})

export async function getSections(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        await verifyStoreAccess(storeId, session.user.id)
    } catch {
        return []
    }

    return prisma.section.findMany({
        where: { storeId },
        orderBy: { order: "asc" },
    })
}

export async function createSection(data: z.infer<typeof SectionSchema>): Promise<ActionResult<Section>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = SectionSchema.parse(data)

        await verifyStoreAccess(validated.storeId, session.user.id)

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
        return success(section)
    } catch (error: unknown) {
        console.error("Failed to create section:", error)
        return failure("Failed to create section")
    }
}

export async function updateSection(data: z.infer<typeof UpdateSectionSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { id, name } = UpdateSectionSchema.parse(data)

        // We need to find the storeId to verify access
        const section = await prisma.section.findUnique({ where: { id } })
        if (!section) return failure("Section not found")

        await verifyStoreAccess(section.storeId, session.user.id)

        await prisma.section.update({
            where: { id },
            data: { name },
        })

        revalidatePath(`/stores/${section.storeId}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to update section:", error)
        return failure("Failed to update section")
    }
}

export async function deleteSection(data: z.infer<typeof DeleteSectionSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { id } = DeleteSectionSchema.parse(data)

        const section = await prisma.section.findUnique({ where: { id } })
        if (!section) return failure("Section not found")

        await verifyStoreAccess(section.storeId, session.user.id)

        await prisma.section.delete({ where: { id } })
        revalidatePath(`/stores/${section.storeId}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to delete section:", error)
        return failure("Failed to delete section")
    }
}

export async function reorderSections(data: z.infer<typeof ReorderSectionsSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { storeId, orderedIds } = ReorderSectionsSchema.parse(data)

        await verifyStoreAccess(storeId, session.user.id)

        // Transaction to update all orders

        // Security check: verify all IDs belong to the store
        const count = await prisma.section.count({
            where: {
                id: { in: orderedIds },
                storeId: storeId
            }
        })

        if (count !== orderedIds.length) {
            return failure("Invalid section ids for store")
        }

        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.section.update({
                    where: { id, storeId }, // Ensure cross-store updates are impossible
                    data: { order: index },
                })
            )
        )

        revalidatePath(`/stores/${storeId}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to reorder sections:", error)
        return failure("Failed to reorder sections")
    }
}

