import { z } from "zod"

export const HouseholdSchema = z.object({
    name: z.string().min(1, "Name is required"),
})
