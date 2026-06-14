"use server"

import { revalidatePath } from "next/cache"
import { z, ZodError } from "zod"

import { CreateHouseholdSchema, UpdateHouseholdSchema } from "@grocerun/dto"
import { type ActionResult, success, failure } from "@/core/types"
import { apiClient, getAuthJwt } from "@/core/lib/api-client"

const RenameHouseholdSchema = UpdateHouseholdSchema.extend({
    householdId: z.string().min(1, "Household ID is required"),
})

export async function getHouseholds() {
    const jwt = await getAuthJwt()
    if (!jwt) return []

    try {
        return await apiClient.get('/households', z.array(z.any()), jwt)
    } catch (error) {
        console.error('Failed to fetch households:', error)
        return []
    }
}

/**
 * Creates a default household for a user during onboarding.
 * Should be called explicitly, not as a side effect of reads.
 */
export async function createDefaultHousehold(): Promise<ActionResult<any>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const household = await apiClient.post('/households', { name: "My Household" }, z.any(), jwt)

        revalidatePath("/stores")
        revalidatePath("/households")
        return success(household)
    } catch (error: unknown) {
        console.error("Failed to create default household:", error)
        return failure("Failed to create household")
    }
}

export async function createHousehold(data: z.infer<typeof CreateHouseholdSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const validated = CreateHouseholdSchema.parse(data)
        await apiClient.post('/households', validated, z.object({ success: z.boolean() }), jwt)

        revalidatePath("/households")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to create household:", error)
        return failure("Failed to create household")
    }
}

export async function renameHousehold(data: z.infer<typeof RenameHouseholdSchema>): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        const { householdId, name } = RenameHouseholdSchema.parse(data)
        await apiClient.patch(`/households/${householdId}`, { name }, z.object({ success: z.boolean() }), jwt)

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
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        await apiClient.post(`/households/${id}/leave`, {}, z.object({ success: z.boolean() }), jwt)

        revalidatePath("/settings")
        revalidatePath("/households")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to leave household:", error)
        return failure("Failed to leave household")
    }
}

export async function deleteHousehold(id: string): Promise<ActionResult<void>> {
    const jwt = await getAuthJwt()
    if (!jwt) return failure("Unauthorized")

    try {
        await apiClient.delete(`/households/${id}`, z.object({ success: z.boolean() }), jwt)

        revalidatePath("/households")
        revalidatePath("/settings")
        return success(undefined)
    } catch (error: unknown) {
        console.error("Failed to delete household:", error)
        return failure("Failed to delete household")
    }
}
