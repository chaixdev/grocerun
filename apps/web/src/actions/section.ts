"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { type ActionResult, success, failure } from "@/core/types"
import type { Section } from "@/core/db"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'
import {
    CreateSectionSchema,
    UpdateSectionSchema,
    DeleteSectionSchema,
    ReorderSectionsSchema
} from "@grocerun/dto"

// Alias for backwards compatibility if needed, though we should just use CreateSectionSchema
const SectionSchema = CreateSectionSchema;


export async function getSections(storeId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

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

export async function createSection(data: z.infer<typeof SectionSchema>): Promise<ActionResult<Section>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = SectionSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const section = await apiClient.post(
            '/sections',
            validated,
            z.any(),
            jwt
        )

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

        // Fetch section first to get storeId (needed for revalidation)
        const section = await prisma.section.findUnique({ 
            where: { id },
            select: { storeId: true }
        })
        if (!section) return failure("Section not found")
        const storeId = section.storeId

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

        // Fetch section first to get storeId (needed for revalidation)
        const section = await prisma.section.findUnique({ 
            where: { id },
            select: { storeId: true }
        })
        if (!section) return failure("Section not found")
        const storeId = section.storeId

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

        revalidatePath(`/stores/${storeId}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to reorder sections:", error)
        return failure("Failed to reorder sections")
    }
}

