"use server"

import { auth } from "@/core/auth"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'
import { z } from 'zod'

import { Prisma } from "../generated/prisma/client"

// Define the return type based on the query structure
export type DashboardHousehold = Prisma.HouseholdGetPayload<{
    include: {
        stores: {
            include: {
                lists: {
                    include: {
                        _count: {
                            select: { items: true }
                        }
                    }
                }
            }
        }
    }
}>

export async function getDashboardData(): Promise<DashboardHousehold[]> {
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
        return households
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        throw new Error("Failed to load dashboard data")
    }
}
