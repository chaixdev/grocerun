"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { z, ZodError } from "zod"

import { verifyHouseholdAccess } from "@/core/auth"
import { type ActionResult, success, failure } from "@/core/types"
import { usePrisma } from "@/core/config/migration"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'

const CreateHouseholdSchema = z.object({
    name: z.string().min(1, "Name is required"),
})

const RenameHouseholdSchema = z.object({
    householdId: z.string().min(1, "Household ID is required"),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
})

export async function getHouseholds() {
    const session = await auth()
    if (!session?.user?.id) return []

    if (usePrisma.households) {
        // OLD PATH: Direct Prisma
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                households: {
                    orderBy: { createdAt: "desc" },
                    include: { _count: { select: { users: true } } }
                }
            },
        })

        return user?.households || []
    } else {
        // NEW PATH: API call
        const token = (session as any).accessToken
        if (!token?.sub) return []

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        try {
            const households = await apiClient.get(
                '/households',
                z.array(z.any()),
                jwt
            )
            return households
        } catch (error) {
            console.error('Failed to fetch households:', error)
            return []
        }
    }
}

export async function createHousehold(data: z.infer<typeof CreateHouseholdSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const validated = CreateHouseholdSchema.parse(data)

        if (usePrisma.households) {
            // OLD PATH: Direct Prisma
            await prisma.household.create({
                data: {
                    ...validated,
                    ownerId: session.user.id,
                    users: { connect: { id: session.user.id } },
                },
            })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.post(
                '/households',
                validated,
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath("/households")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to create household:", error)
        return failure("Failed to create household")
    }
}

export async function renameHousehold(data: z.infer<typeof RenameHouseholdSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { householdId, name } = RenameHouseholdSchema.parse(data)

        if (usePrisma.households) {
            // OLD PATH: Direct Prisma
            const household = await prisma.household.findUnique({
                where: { id: householdId },
                select: { ownerId: true }
            })

            if (!household) return failure("Household not found")

            // Only owner can rename
            if (household.ownerId && household.ownerId !== session.user.id) {
                return failure("Only the owner can rename the household")
            }

            await prisma.household.update({
                where: { id: householdId },
                data: {
                    name,
                    // If it was a legacy household (no owner), claim ownership
                    ...(household.ownerId === null ? { ownerId: session.user.id } : {})
                }
            })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.patch(
                `/households/${householdId}`,
                { name },
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath("/settings")
        return success(undefined)
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return failure((error as any).errors[0].message)
        }
        console.error("Failed to rename household:", error)
        return failure("Failed to rename household")
    }
}

export async function leaveHousehold(id: string): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        if (usePrisma.households) {
            // OLD PATH: Direct Prisma
            const household = await prisma.household.findUnique({
                where: { id },
                select: { ownerId: true }
            })

            if (!household) return failure("Household not found")

            if (household.ownerId === session.user.id) {
                return failure("Owners cannot leave their own household. Delete it instead.")
            }

            await prisma.household.update({
                where: { id },
                data: {
                    users: { disconnect: { id: session.user.id } }
                }
            })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.post(
                `/households/${id}/leave`,
                {},
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath("/settings")
        revalidatePath("/households")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to leave household:", error)
        return failure("Failed to leave household")
    }
}

export async function deleteHousehold(id: string): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        if (usePrisma.households) {
            // OLD PATH: Direct Prisma
            const household = await prisma.household.findUnique({
                where: { id },
                include: { _count: { select: { users: true } } }
            })

            if (!household) return failure("Household not found")

            // Verify ownership - allow if ownerId matches OR if it's a legacy household (null ownerId)
            if (household.ownerId && household.ownerId !== session.user.id) {
                return failure("Only the owner can delete the household")
            }

            // Verify member count
            if (household._count.users > 1) {
                return failure("Cannot delete household with other members. Remove them first.")
            }

            await prisma.household.delete({ where: { id } })
        } else {
            // NEW PATH: API call
            const token = (session as any).accessToken
            if (!token?.sub) throw new Error('No valid session token')

            const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
            const jwt = await new SignJWT(token)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret)

            await apiClient.delete(
                `/households/${id}`,
                z.object({ success: z.boolean() }),
                jwt
            )
        }

        revalidatePath("/households")
        revalidatePath("/settings")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to delete household:", error)
        return failure("Failed to delete household")
    }
}
