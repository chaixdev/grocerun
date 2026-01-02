"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { customAlphabet } from "nanoid"
import { appConfig } from "@/core/config"
import { type ActionResult, success, failure } from "@/core/types"
import { z } from "zod"
import { rateLimit } from "@/core/lib/rate-limit"

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max users active per interval
})

// Use a readable alphabet for tokens (no confusing chars like 0/O, 1/l)
const generateToken = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8)

const CreateInvitationSchema = z.object({
    householdId: z.string().min(1, "Household ID is required"),
})

type InvitationData = {
    token: string
    expiresAt: Date
}

export async function createInvitation(data: z.infer<typeof CreateInvitationSchema>): Promise<ActionResult<InvitationData>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { householdId } = CreateInvitationSchema.parse(data)

        const { isRateLimited } = await limiter.check(5, session.user.id) // 5 requests per minute
        if (isRateLimited) return failure("Rate limit exceeded. Please try again later.")

        // Verify user is a member of the household
        const membership = await prisma.household.findFirst({
            where: {
                id: householdId,
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            }
        })

        if (!membership) return failure("Household not found")

        const token = generateToken()
        const expiresAt = new Date(Date.now() + appConfig.invitation.expiresInMinutes * 60 * 1000)

        const invitation = await prisma.invitation.create({
            data: {
                token,
                householdId,
                creatorId: session.user.id,
                expiresAt,
            }
        })

        return success({ token: invitation.token, expiresAt: invitation.expiresAt })
    } catch (error: unknown) {
        console.error("Failed to create invitation:", error)
        return failure("Failed to create invitation")
    }
}

const JoinHouseholdSchema = z.object({
    token: z.string().min(1, "Token is required"),
})

export async function joinHousehold(data: z.infer<typeof JoinHouseholdSchema>): Promise<ActionResult<{ householdName: string }>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { token } = JoinHouseholdSchema.parse(data)

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { household: true }
        })

        if (!invitation) return failure("Invalid invitation code")

        if (invitation.status !== "ACTIVE") return failure("This invitation is no longer active")

        if (new Date() > invitation.expiresAt) {
            // Lazily mark as expired if we catch it here
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" }
            })
            return failure("This invitation has expired")
        }

        // Check if user is already a member
        const existingMembership = await prisma.household.findFirst({
            where: {
                id: invitation.householdId,
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            }
        })

        if (existingMembership) return failure("You are already a member of this household")

        // Transaction: Add user to household AND mark invitation as completed
        await prisma.$transaction([
            prisma.household.update({
                where: { id: invitation.householdId },
                data: {
                    users: {
                        connect: { id: session.user.id }
                    }
                }
            }),
            prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "COMPLETED" }
            })
        ])

        revalidatePath("/settings")
        revalidatePath("/households")
        return success({ householdName: invitation.household.name })
    } catch (error: unknown) {
        console.error("Failed to join household:", error)
        return failure("Failed to join household")
    }
}

const RevokeInvitationSchema = z.object({
    invitationId: z.string().min(1, "Invitation ID is required"),
})

export async function revokeInvitation(data: z.infer<typeof RevokeInvitationSchema>): Promise<ActionResult<void>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { invitationId } = RevokeInvitationSchema.parse(data)

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { household: { include: { users: true } } }
        })

        if (!invitation) return failure("Invitation not found")

        // Check if user is authorized to revoke (must be member of household)
        const isMember = invitation.household.users.some(u => u.id === session?.user?.id)
        if (!isMember) return failure("Unauthorized")

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: "REVOKED" }
        })

        revalidatePath("/settings")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to revoke invitation:", error)
        return failure("Failed to revoke invitation")
    }
}

const GetInvitationSchema = z.object({
    token: z.string().min(1, "Token is required"),
})

type InvitationDetails = {
    householdName: string
    ownerName: string
    creatorName: string
}

export async function getInvitationDetails(data: z.infer<typeof GetInvitationSchema>): Promise<ActionResult<InvitationDetails>> {
    const session = await auth()
    if (!session?.user?.id) return failure("Unauthorized")

    try {
        const { token } = GetInvitationSchema.parse(data)

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                household: {
                    include: {
                        owner: { select: { name: true, email: true } }
                    }
                },
                creator: { select: { name: true } }
            }
        })

        if (!invitation) return failure("Invalid invitation code")
        if (invitation.status !== "ACTIVE") return failure("Invitation is not active")
        if (new Date() > invitation.expiresAt) return failure("Invitation has expired")

        return success({
            householdName: invitation.household.name,
            ownerName: invitation.household.owner?.name || "Unknown",
            creatorName: invitation.creator.name || "Unknown"
        })
    } catch (error: unknown) {
        console.error("Failed to get invitation details:", error)
        return failure("Failed to fetch invitation details")
    }
}
