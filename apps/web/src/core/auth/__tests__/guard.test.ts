import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAuth } from '../guard'
import { isAuthenticated } from '../session'

vi.mock('../session', () => ({
  isAuthenticated: vi.fn(),
}))

describe('requireAuth', () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReset()
  })

  it('allows protected routes when app auth exists', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)

    expect(requireAuth()).toBeUndefined()
  })

  it('redirects to login when app auth is missing', () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)

    let thrown: unknown
    try {
      requireAuth()
    } catch (err) {
      thrown = err
    }
    // TanStack's redirect() throws a Response subclass — match its options.
    expect(thrown).toMatchObject({ options: { to: '/login' } })
  })
})
