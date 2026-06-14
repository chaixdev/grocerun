import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        console.error('❌ Invalid environment variables:')
        console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))

        if (process.env.NODE_ENV === 'test') {
            return { NODE_ENV: 'test' } as z.infer<typeof envSchema>
        }

        throw new Error('Invalid environment variables')
    }

    return result.data
}

export const env = validateEnv()
