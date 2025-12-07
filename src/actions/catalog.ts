"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
// Define the return type based on inferred return from the function
// We will rely on simple type inference for the action return

export type CatalogHousehold = {
    id: string
    name: string
    stores: {
        id: string
        name: string
        location: string | null
    }[]
}

export async function getStoreCatalogData(): Promise<CatalogHousehold[]> {
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
            include: {
                stores: {
                    orderBy: { name: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return households
    } catch (error) {
        console.error("Failed to fetch catalog data:", error)
        throw new Error("Failed to load store catalog")
    }
}
