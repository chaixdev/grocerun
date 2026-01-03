"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { verifyHouseholdAccess, verifyStoreAccess } from "@/core/auth"
import { StoreSchema } from "@/core/schemas"
import { type ActionResult, success, failure } from "@/core/types"
import type { Household } from "@/core/db"

/**
 * Pure query - returns stores for the user's household.
 * Returns empty array if user has no households (caller should handle onboarding).
 */
export async function getStores(householdId?: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { households: true },
    })

    if (!user || user.households.length === 0) return []

    let targetHouseholdId = householdId

    // If no specific household requested, or requested one not found in user's list
    if (!targetHouseholdId || !user.households.find((h: { id: string }) => h.id === targetHouseholdId)) {
        targetHouseholdId = user.households[0]?.id
    }

    const stores = await prisma.store.findMany({
        where: { householdId: targetHouseholdId },
        orderBy: { createdAt: "desc" },
    })

    return stores
}

/**
 * Creates a default household for a user during onboarding.
 * Should be called explicitly, not as a side effect of reads.
 */
export async function createDefaultHousehold(): Promise<ActionResult<Household>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { households: true },
        })

        if (!user) return failure("User not found")

        // Don't create if user already has households
        if (user.households.length > 0) {
            return success(user.households[0])
        }

        const household = await prisma.household.create({
            data: {
                name: "My Household",
                users: { connect: { id: session.user.id } },
                ownerId: session.user.id,
            },
        })

        revalidatePath("/stores")
        revalidatePath("/households")
        return success(household)
    } catch (error: unknown) {
        console.error("Failed to create default household:", error)
        return failure("Failed to create household")
    }
}

export async function createStore(data: z.infer<typeof StoreSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = StoreSchema.parse(data)

        // Verify access to household
        const hasAccess = await verifyHouseholdAccess(session.user.id, validated.householdId)
        if (!hasAccess) return failure("Unauthorized access to household")

        await prisma.store.create({
            data: {
                name: validated.name,
                location: validated.location,
                householdId: validated.householdId,
            },
        })

        revalidatePath("/stores")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to create store:", error)
        return failure("Failed to create store")
    }
}

export async function deleteStore(id: string): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        // Verify ownership via household
        await verifyStoreAccess(id, session.user.id)

        await prisma.store.delete({ where: { id } })
        revalidatePath("/stores")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to delete store:", error)
        return failure("Failed to delete store")
    }
}

export async function getStore(id: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        await verifyStoreAccess(id, session.user.id)
    } catch {
        return null
    }

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

export async function updateStore(id: string, data: z.infer<typeof StoreSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = StoreSchema.parse(data)

        await verifyStoreAccess(id, session.user.id)

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
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to update store:", error)
        return failure("Failed to update store")
    }
}

