"use server"

import { revalidatePath } from "next/cache"
import { UpdateProfileSchema, type UpdateProfileDto } from "@grocerun/dto"
import { apiClient, getAuthJwt } from "@/core/lib/api-client"
import { z } from "zod"

const UserResponseSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
})

export async function updateProfile(data: UpdateProfileDto) {
    const jwt = await getAuthJwt()
    if (!jwt) return { success: false, error: "Unauthorized" }

    const validated = UpdateProfileSchema.safeParse(data)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    try {
        await apiClient.patch(
            '/users/me',
            { name: validated.data.name, image: validated.data.image },
            UserResponseSchema,
            jwt
        )

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update profile"
        }
    }
}
