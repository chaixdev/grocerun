"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { verifyHouseholdAccess, verifyStoreAccess } from "@/lib/auth-helpers"

const StoreSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
    householdId: z.string().min(1, "Household ID is required"),
})

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

    revalidatePath("/dashboard/stores")
}

export async function deleteStore(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify ownership via household
    const hasAccess = await verifyStoreAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.store.delete({ where: { id } })
    revalidatePath("/dashboard/stores")
}
