"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getDashboardData() {
    const session = await auth()
    if (!session?.user?.id) return []

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
}
