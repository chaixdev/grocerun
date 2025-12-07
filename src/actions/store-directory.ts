"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
// Define the return type based on inferred return from the function
// We will rely on simple type inference for the action return

export type DirectoryHousehold = {
    id: string
    name: string
    stores: {
        id: string
        name: string
        location: string | null
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
                        location: true
                    },
                    orderBy: { name: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return households
    } catch (error) {
        console.error("Failed to fetch store directory data:", error)
        throw new Error("Failed to load store directory")
    }
}
