import { z } from 'zod'

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Auth
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required'),
    AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required'),

    // Optional
    AUTH_TRUST_HOST: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),

    // Node
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
    // Allow skipping validation in test/build environments if needed, 
    // but strictly we want to fail fast. 
    // However, during CI build, sometimes not all secrets are present (e.g. docker build args).
    // For now, full strict validation.

    // Note: process.env is a regular object, safeParse works fine.
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        console.error('❌ Invalid environment variables:')
        console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))
        // Don't throw during build time if we want to allow 'next build' without secrets?
        // Usually 'next build' requires database url for prisma generation maybe?
        // Let's throw.
        if (process.env.NODE_ENV !== 'test') { // Prevent test runner crash if we mock differently?
            throw new Error('Invalid environment variables')
        }
    }

    return result.data || process.env as any // Fallback for tests if needed
}

export const env = validateEnv()
