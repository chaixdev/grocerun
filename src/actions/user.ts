"use server"

import { auth } from "@/core/auth"
import { prisma } from "@/core/db"
import { revalidatePath } from "next/cache"
import { ProfileSchema, type ProfileFormValues } from "@/core/schemas"

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
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: validated.data.name,
                image: validated.data.image,
            },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update profile"
        }
    }
}
