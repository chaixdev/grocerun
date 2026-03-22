"use server"

import { auth } from "@/core/auth"
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

// Alias for backwards compatibility
const SectionSchema = CreateSectionSchema;

// Extended schemas for actions that need storeId for cache revalidation.
// storeId is NOT sent to the API — it's used only for revalidatePath.
const UpdateSectionActionSchema = UpdateSectionSchema.extend({
    storeId: z.string().min(1, "Store ID is required"),
})
const DeleteSectionActionSchema = DeleteSectionSchema.extend({
    storeId: z.string().min(1, "Store ID is required"),
})


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

export async function updateSection(data: z.infer<typeof UpdateSectionActionSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { id, name, storeId } = UpdateSectionActionSchema.parse(data)

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

export async function deleteSection(data: z.infer<typeof DeleteSectionActionSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { id, storeId } = DeleteSectionActionSchema.parse(data)

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

