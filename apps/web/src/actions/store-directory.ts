"use server"

import { apiClient, getAuthJwt } from "@/core/lib/api-client"
import { z } from 'zod'

export type DirectoryStore = {
    id: string
    name: string
    location: string | null
    activeListId: string | null
}

export type DirectoryHousehold = {
    id: string
    name: string
    stores: DirectoryStore[]
}

export async function getStoreDirectoryData(): Promise<DirectoryHousehold[]> {
    const jwt = await getAuthJwt()
    if (!jwt) return []

    try {
        const households = await apiClient.get('/household-overview', z.array(z.any()), jwt)

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
