"use server"

import { auth } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { CreateStoreSchema, UpdateStoreSchema } from "@grocerun/dto"
import { type ActionResult, success, failure } from "@/core/types"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'

/**
 * Pure query - returns stores for the user's household.
 * Returns empty array if user has no households (caller should handle onboarding).
 */
export async function getStores(householdId?: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const token = (session as any).accessToken
    if (!token?.sub) return []

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const jwt = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)

    try {
        const url = householdId ? `/stores?householdId=${householdId}` : '/stores'
        const stores = await apiClient.get(
            url,
            z.array(z.any()),
            jwt
        )
        return stores
    } catch (error) {
        console.error('Failed to fetch stores:', error)
        return []
    }
}

export async function createStore(data: z.infer<typeof CreateStoreSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = CreateStoreSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.post(
            '/stores',
            validated,
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath("/stores")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to create store:", error)
        return failure("Failed to create store")
    }
}

export async function deleteStore(id: string): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.delete(
            `/stores/${id}`,
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath("/stores")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to delete store:", error)
        return failure("Failed to delete store")
    }
}

export async function getStore(id: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const token = (session as any).accessToken
    if (!token?.sub) return null

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const jwt = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)

    try {
        const store = await apiClient.get(
            `/stores/${id}`,
            z.object({
                id: z.string(),
                name: z.string(),
                location: z.string().nullable(),
                imageUrl: z.string().nullable(),
                householdId: z.string(),
            }),
            jwt
        )
        return store
    } catch (error) {
        // Silently return null for 404s (store not found/deleted)
        // Only log unexpected errors
        if (error instanceof Error && 'status' in error && (error as any).status === 404) {
            return null
        }
        console.error('Failed to fetch store:', error)
        return null
    }
}

export async function updateStore(id: string, data: z.infer<typeof UpdateStoreSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = UpdateStoreSchema.parse(data)

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.patch(
            `/stores/${id}`,
            {
                name: validated.name,
                location: validated.location,
                imageUrl: validated.imageUrl,
            },
            z.object({ success: z.boolean() }),
            jwt
        )

        revalidatePath("/stores")
        revalidatePath(`/stores/${id}/settings`)
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to update store:", error)
        return failure("Failed to update store")
    }
}

