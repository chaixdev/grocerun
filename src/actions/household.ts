"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { verifyHouseholdAccess } from "@/lib/auth-helpers"

const HouseholdSchema = z.object({
    name: z.string().min(1, "Name is required"),
})

export async function getHouseholds() {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { households: { orderBy: { createdAt: "desc" } } },
    })

    return user?.households || []
}

export async function createHousehold(data: z.infer<typeof HouseholdSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = HouseholdSchema.parse(data)

    await prisma.household.create({
        data: {
            ...validated,
            ownerId: session.user.id,
            users: { connect: { id: session.user.id } },
        },
    })

    revalidatePath("/households")
}

export async function renameHousehold(id: string, name: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const household = await prisma.household.findUnique({
            where: { id },
            select: { ownerId: true }
        })

        if (!household) return { success: false, error: "Household not found" }

        // Only owner can rename
        if (household.ownerId && household.ownerId !== session.user.id) {
            return { success: false, error: "Only the owner can rename the household" }
        }

        // If no ownerId (legacy), allow any member? Or enforce ownership?
        // For now, if ownerId is null, we might want to allow it or claim ownership.
        // Let's assume strict ownership if ownerId exists.

        await prisma.household.update({
            where: { id },
            data: {
                name,
                // If it was a legacy household (no owner), claim ownership
                ...(household.ownerId === null ? { ownerId: session.user.id } : {})
            }
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to rename household" }
    }
}

export async function updateHousehold(id: string, data: z.infer<typeof HouseholdSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = HouseholdSchema.parse(data)

    // Verify membership
    // ... (inside updateHousehold)
    const hasAccess = await verifyHouseholdAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.household.update({
        where: { id },
        data: validated
    })

    revalidatePath("/households")
}

export async function deleteHousehold(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify membership
    const hasAccess = await verifyHouseholdAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.household.delete({ where: { id } })
    revalidatePath("/households")
}
