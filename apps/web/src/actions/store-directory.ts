"use server"

import { auth } from "@/core/auth"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'
import { z } from 'zod'

// Shared type for store directory item
export type DirectoryStore = {
    id: string
    name: string
    location: string | null
    activeListId: string | null
}

// Update type
export type DirectoryHousehold = {
    id: string
    name: string
    stores: DirectoryStore[]
}

export async function getStoreDirectoryData(): Promise<DirectoryHousehold[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        const token = (session as any).accessToken
        if (!token?.sub) return []

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const households = await apiClient.get(
            '/household-overview',
            z.array(z.any()),
            jwt
        )

        // Map the household-overview response to the DirectoryHousehold shape
        return households.map((h: any) => ({
            id: h.id,
            name: h.name,
            stores: (h.stores ?? []).map((s: any) => ({
                id: s.id,
                name: s.name,
                location: s.location ?? null,
                activeListId: s.lists?.[0]?.id ?? null,
            })),
        }))
    } catch (error) {
        console.error("Failed to fetch store directory data:", error)
        throw new Error("Failed to load store directory")
    }
}
