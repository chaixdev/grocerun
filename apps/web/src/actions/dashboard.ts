"use server"

import { apiClient, getAuthJwt } from "@/core/lib/api-client"
import { z } from 'zod'

// Dashboard response type — matches the household-overview API response shape.
// Defined here (not in dto) because this is a read-only view type, not a shared contract.
export type DashboardHousehold = {
    id: string
    name: string
    stores: Array<{
        id: string
        name: string
        location: string | null
        lists: Array<{
            id: string
            name: string
            status: string
            updatedAt: Date
            _count: { items: number }
        }>
    }>
}

export async function getDashboardData(): Promise<DashboardHousehold[]> {
    const jwt = await getAuthJwt()
    if (!jwt) return []

    try {
        return await apiClient.get('/household-overview', z.array(z.any()), jwt)
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        throw new Error("Failed to load dashboard data")
    }
}
