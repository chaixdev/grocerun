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
            users: { connect: { id: session.user.id } },
        },
    })

    revalidatePath("/dashboard/households")
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

    revalidatePath("/dashboard/households")
}

export async function deleteHousehold(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify membership
    const hasAccess = await verifyHouseholdAccess(session.user.id, id)
    if (!hasAccess) throw new Error("Unauthorized")

    await prisma.household.delete({ where: { id } })
    revalidatePath("/dashboard/households")
}
