"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { verifyHouseholdAccess, verifyStoreAccess } from "@/lib/auth-helpers"

import { StoreSchema } from "@/schemas/store"

export async function getStores(householdId?: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    // Get user's household (create if none)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { households: true },
    })

    if (!user) return []

    let targetHouseholdId = householdId

    // If no specific household requested, or requested one not found in user's list
    if (!targetHouseholdId || !user.households.find((h: { id: string }) => h.id === targetHouseholdId)) {
        targetHouseholdId = user.households[0]?.id
    }

    if (!targetHouseholdId) {
        // Create default household
        const household = await prisma.household.create({
            data: {
                name: "My Household",
                users: { connect: { id: user.id } },
            },
        })
        targetHouseholdId = household.id
    }

    const stores = await prisma.store.findMany({
        where: { householdId: targetHouseholdId },
        orderBy: { createdAt: "desc" },
    })

    return stores
}

export async function createStore(data: z.infer<typeof StoreSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = StoreSchema.parse(data)

    // Verify access to household
    const hasAccess = await verifyHouseholdAccess(session.user.id, validated.householdId)
    if (!hasAccess) throw new Error("Unauthorized access to household")

    await prisma.store.create({
        data: {
            name: validated.name,
            location: validated.location,
            householdId: validated.householdId,
        },
    })

    revalidatePath("/stores")
}

export async function deleteStore(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify ownership via household
    const hasAccess = await verifyStoreAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.store.delete({ where: { id } })
    revalidatePath("/stores")
}

export async function getStore(id: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const hasAccess = await verifyStoreAccess(session.user.id, id)
    if (!hasAccess) return null

    return prisma.store.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
            householdId: true
        }
    })
}

export async function updateStore(id: string, data: z.infer<typeof StoreSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Zod validation is partial for updates usually, but here we expect full form data or partial?
    // Let's use the same schema but maybe allow partial if needed. 
    // For now, let's assume the form sends all fields.
    const validated = StoreSchema.parse(data)

    const hasAccess = await verifyStoreAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.store.update({
        where: { id },
        data: {
            name: validated.name,
            location: validated.location,
            imageUrl: validated.imageUrl,
        }
    })

    revalidatePath("/stores")
    revalidatePath(`/stores/${id}/settings`)
}
