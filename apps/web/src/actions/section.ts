"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { verifyStoreAccess } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import type { Section } from "@/core/db"
import { usePrisma } from "@/core/config/migration"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'

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

    if (usePrisma.sections) {
        // OLD PATH: Direct Prisma
        try {
            await verifyStoreAccess(storeId, session.user.id)
        } catch {
            return []
        }

        return prisma.section.findMany({
            where: { storeId },
            orderBy: { order: "asc" },
        })
    } else {
        // NEW PATH: API call
        const token = (session as any).accessToken
        if (!token?.sub) return []

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        try {
            const sections = await apiClient.get(
                `/sections/store/${storeId}`,
                z.array(z.any()),
                jwt
            )
            return sections
        } catch (error) {
            console.error('Failed to fetch sections:', error)
            return []
        }
    }
}

export async function createSection(data: z.infer<typeof SectionSchema>): Promise<ActionResult<Section>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = SectionSchema.parse(data)

        let section: Section

        if (usePrisma.sections) {
            // OLD PATH: Direct Prisma
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

            section = await prisma.section.create({
                data: {
                    name: validated.name,
                    storeId: validated.storeId,
                    order: newOrder,
                },
            })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            section = await apiClient.post(
                '/sections',
                validated,
                z.any(),
                jwt
            )
        }

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

        // Fetch section first to get storeId (needed for both paths)
        const section = await prisma.section.findUnique({ 
            where: { id },
            select: { storeId: true }
        })
        if (!section) return failure("Section not found")
        const storeId = section.storeId

        if (usePrisma.sections) {
            // OLD PATH: Direct Prisma
            await verifyStoreAccess(storeId, session.user.id)

            await prisma.section.update({
                where: { id },
                data: { name },
            })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.patch(
                `/sections/${id}`,
                { name },
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath(`/stores/${storeId}/settings`)
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

        // Fetch section first to get storeId (needed for both paths)
        const section = await prisma.section.findUnique({ 
            where: { id },
            select: { storeId: true }
        })
        if (!section) return failure("Section not found")
        const storeId = section.storeId

        if (usePrisma.sections) {
            // OLD PATH: Direct Prisma
            await verifyStoreAccess(storeId, session.user.id)

            await prisma.section.delete({ where: { id } })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.delete(
                `/sections/${id}`,
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath(`/stores/${storeId}/settings`)
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

        if (usePrisma.sections) {
            // OLD PATH: Direct Prisma
            await verifyStoreAccess(storeId, session.user.id)

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
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.post(
                `/sections/store/${storeId}/reorder`,
                { orderedIds },
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath(`/stores/${storeId}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to reorder sections:", error)
        return failure("Failed to reorder sections")
    }
}

