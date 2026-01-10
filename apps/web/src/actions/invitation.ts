"use server"

import { auth } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { type ActionResult, success, failure } from "@/core/types"
import { z } from "zod"
import { rateLimit } from "@/core/lib/rate-limit"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from 'jose'

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max users active per interval
})

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

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const result = await apiClient.post(
            '/invitations',
            { householdId },
            z.object({ token: z.string(), expiresAt: z.coerce.date() }),
            jwt
        )
        return success(result)
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

        const authToken = (session as any).accessToken
        if (!authToken?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(authToken)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const result = await apiClient.post(
            '/invitations/join',
            { token },
            z.object({ householdName: z.string() }),
            jwt
        )

        revalidatePath("/settings")
        revalidatePath("/households")
        return success(result)
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

        const token = (session as any).accessToken
        if (!token?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.patch(
            '/invitations/revoke',
            { invitationId },
            z.object({ success: z.boolean() }),
            jwt
        )

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

        const authToken = (session as any).accessToken
        if (!authToken?.sub) throw new Error('No valid session token')

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(authToken)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        const result = await apiClient.get(
            `/invitations/${token}/details`,
            z.object({
                householdName: z.string(),
                ownerName: z.string(),
                creatorName: z.string()
            }),
            jwt
        )
        return success(result)
    } catch (error: unknown) {
        console.error("Failed to get invitation details:", error)
        return failure("Failed to fetch invitation details")
    }
}
