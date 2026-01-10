"use server"

import { auth } from "@/core/auth"
import { revalidatePath } from "next/cache"
import { ProfileSchema, type ProfileFormValues } from "@/core/schemas"
import { apiClient } from "@/core/lib/api-client"
import { z } from "zod"
import { SignJWT } from 'jose'

const UserResponseSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
})

export async function updateProfile(data: ProfileFormValues) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    const validated = ProfileSchema.safeParse(data)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    try {
        const token = (session as any).accessToken
        
        if (!token || !token.sub) {
            throw new Error('No valid session token found')
        }

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        await apiClient.patch(
            '/users/me',
            {
                name: validated.data.name,
                image: validated.data.image,
            },
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
