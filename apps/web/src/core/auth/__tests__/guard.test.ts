import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAuth } from '../guard'
import { isAuthenticated } from '../session'
import { getOidc } from '../oidc'

vi.mock('../session', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('../oidc', () => ({
  getOidc: vi.fn(),
}))

describe('requireAuth', () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReset()
    vi.mocked(getOidc).mockReset()
  })

  it('allows protected routes when cache auth exists (fast path)', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    await expect(requireAuth()).resolves.toBeUndefined()
  })

  it('allows protected routes when live OIDC is logged in (slow path)', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    vi.mocked(getOidc).mockResolvedValue({ isUserLoggedIn: true } as unknown as Awaited<ReturnType<typeof getOidc>>)

    await expect(requireAuth()).resolves.toBeUndefined()
  })

  it('redirects to login when both cache and live OIDC fail', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    vi.mocked(getOidc).mockResolvedValue({ isUserLoggedIn: false } as unknown as Awaited<ReturnType<typeof getOidc>>)

    await expect(requireAuth()).rejects.toMatchObject({ options: { to: '/login' } })
  })
})
