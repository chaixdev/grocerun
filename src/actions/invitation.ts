"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { nanoid, customAlphabet } from "nanoid"

// Use a readable alphabet for tokens (no confusing chars like 0/O, 1/l)
const generateToken = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8)

export async function createInvitation(householdId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

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

    if (!membership) {
        return { success: false, error: "You are not a member of this household" }
    }

    try {
        const token = generateToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        const invitation = await prisma.invitation.create({
            data: {
                token,
                householdId,
                creatorId: session.user.id,
                expiresAt,
            }
        })

        return { success: true, token: invitation.token, expiresAt: invitation.expiresAt }
    } catch (error) {
        console.error("Failed to create invitation:", error)
        return { success: false, error: "Failed to create invitation" }
    }
}

export async function joinHousehold(token: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { household: true }
        })

        if (!invitation) {
            return { success: false, error: "Invalid invitation code" }
        }

        if (invitation.status !== "ACTIVE") {
            return { success: false, error: "This invitation is no longer active" }
        }

        if (new Date() > invitation.expiresAt) {
            // Lazily mark as expired if we catch it here
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" }
            })
            return { success: false, error: "This invitation has expired" }
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

        if (existingMembership) {
            return { success: false, error: "You are already a member of this household" }
        }

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
        return { success: true, householdName: invitation.household.name }

    } catch (error) {
        console.error("Failed to join household:", error)
        return { success: false, error: "Failed to join household" }
    }
}

export async function revokeInvitation(invitationId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { household: { include: { users: true } } }
        })

        if (!invitation) {
            return { success: false, error: "Invitation not found" }
        }

        // Check if user is authorized to revoke (must be member of household)
        const isMember = invitation.household.users.some(u => u.id === session?.user?.id)
        if (!isMember) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: "REVOKED" }
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to revoke invitation:", error)
        return { success: false, error: "Failed to revoke invitation" }
    }
}
