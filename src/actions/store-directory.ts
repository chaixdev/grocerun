"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
// Define the return type based on inferred return from the function
// We will rely on simple type inference for the action return

// Update type
export type DirectoryHousehold = {
    id: string
    name: string
    stores: {
        id: string
        name: string
        location: string | null
        activeListId: string | null
    }[]
}

export async function getStoreDirectoryData(): Promise<DirectoryHousehold[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        const households = await prisma.household.findMany({
            where: {
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            },
            select: {
                id: true,
                name: true,
                stores: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        lists: {
                            where: {
                                status: { not: "COMPLETED" }
                            },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: { id: true }
                        }
                    },
                    orderBy: { name: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Transform results to flatten activeListId
        return households.map(h => ({
            ...h,
            stores: h.stores.map(s => ({
                id: s.id,
                name: s.name,
                location: s.location,
                activeListId: s.lists[0]?.id || null
            }))
        }))
    } catch (error) {
        console.error("Failed to fetch store directory data:", error)
        throw new Error("Failed to load store directory")
    }
}
