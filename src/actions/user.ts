"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    image: z.string().optional(),
})

export async function updateProfile(data: z.infer<typeof ProfileSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = ProfileSchema.parse(data)

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: validated.name,
            image: validated.image,
        },
    })

    revalidatePath("/settings")
}
