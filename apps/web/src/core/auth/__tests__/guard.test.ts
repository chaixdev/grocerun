import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enforceAppLogin } from '../guard'
import { hasAppAuth } from '../session'

vi.mock('../session', () => ({
  hasAppAuth: vi.fn(),
}))

describe('enforceAppLogin', () => {
  beforeEach(() => {
    vi.mocked(hasAppAuth).mockReset()
  })

  it('allows protected routes when app auth exists', async () => {
    vi.mocked(hasAppAuth).mockResolvedValue(true)

    await expect(enforceAppLogin()).resolves.toBeUndefined()
  })

  it('redirects to login when app auth is missing', async () => {
    vi.mocked(hasAppAuth).mockResolvedValue(false)

    await expect(enforceAppLogin()).rejects.toMatchObject({ options: { to: '/login' } })
  })
})
