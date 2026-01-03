import { describe, it, expect, vi } from 'vitest'
import { getHouseholds } from '../household'

// Mock dependencies to prevent DB/Auth side effects during smoke test
vi.mock('@/core/auth', () => ({
    auth: vi.fn(),
}))

vi.mock('@/core/db', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Household Actions Smoke Test', () => {
    it('should define exported functions', () => {
        expect(getHouseholds).toBeDefined()
    })

    it('basic math check to verify runner', () => {
        expect(1 + 1).toBe(2)
    })
})
