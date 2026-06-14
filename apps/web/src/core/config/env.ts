import { z } from 'zod'

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Auth
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required'),
    AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required'),

    // API
    API_URL: z.string().url().optional(),

    // Optional
    AUTH_TRUST_HOST: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),

    // Node
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
    // Skip validation at Next.js build time — secrets are not available in the
    // build container and are not needed (no requests are served during build).
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {} as z.infer<typeof envSchema>
    }

    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        console.error('❌ Invalid environment variables:')
        console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))

        if (process.env.NODE_ENV === 'test') {
            return {
                DATABASE_URL: 'file:./test.db',
                AUTH_SECRET: 'test-secret',
                AUTH_GOOGLE_ID: 'test-client-id',
                AUTH_GOOGLE_SECRET: 'test-client-secret',
                NODE_ENV: 'test'
            } as z.infer<typeof envSchema>
        }

        throw new Error('Invalid environment variables')
    }

    return result.data
}

export const env = validateEnv()
