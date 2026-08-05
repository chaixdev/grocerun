import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, isAuthenticated } from '../session'
import { writeCachedAuth } from '../token-cache'
import { getOidc } from '../oidc'

vi.mock('../oidc', () => ({
  getOidc: vi.fn(),
}))

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(payload)}.`
}

function oidcLoggedIn(): Awaited<ReturnType<typeof getOidc>> {
  return {
    isUserLoggedIn: true,
    getAccessToken: async () => 'live-token',
    getDecodedIdToken: () => ({ sub: 'google-sub' }),
  } as unknown as Awaited<ReturnType<typeof getOidc>>
}

describe('app auth session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getOidc).mockReset()
  })

  it('accepts cached auth before waiting for OIDC initialization', () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 })
    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub' } })
    vi.mocked(getOidc).mockImplementation(() => new Promise<Awaited<ReturnType<typeof getOidc>>>(() => {}))

    expect(isAuthenticated()).toBe(true)
    expect(getOidc).not.toHaveBeenCalled()
  })

  it('reports unauthenticated when neither cache nor test token exists', () => {
    vi.mocked(getOidc).mockResolvedValue(oidcLoggedIn())

    expect(isAuthenticated()).toBe(false)
    expect(getOidc).not.toHaveBeenCalled()
  })

  it('falls back to live OIDC for token retrieval when cached auth is unavailable', async () => {
    vi.mocked(getOidc).mockResolvedValue(oidcLoggedIn())

    await expect(getAccessToken()).resolves.toBe('live-token')
  })

  it('returns cached access token when OIDC is not logged in', async () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 })
    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub' } })
    vi.mocked(getOidc).mockResolvedValue({ isUserLoggedIn: false } as Awaited<ReturnType<typeof getOidc>>)

    await expect(getAccessToken()).resolves.toBe(token)
  })
})
