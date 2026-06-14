import { z } from "zod"

export const StoreSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
    imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
    householdId: z.string().min(1, "Household ID is required"),
})
