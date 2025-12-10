"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"

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
        // Fetch households where the user is a member
        // Include stores and their ACTIVE lists (status != 'COMPLETED')
        const households = await prisma.household.findMany({
            where: {
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            },
            include: {
                stores: {
                    include: {
                        lists: {
                            where: {
                                status: { not: "COMPLETED" }
                            },
                            orderBy: { updatedAt: "desc" },
                            include: {
                                _count: {
                                    select: { items: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return households
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        throw new Error("Failed to load dashboard data")
    }
}
