import { z } from "zod"

export const StoreSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    householdId: z.string().min(1, "Household ID is required"),
})
