import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasAppAuth } from '../session'
import { writeCachedAuth } from '../token-cache'
import { getOidc } from '../oidc'

vi.mock('../oidc', () => ({
  getOidc: vi.fn(),
}))

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(payload)}.`
}

function oidcState(isUserLoggedIn: boolean): Awaited<ReturnType<typeof getOidc>> {
  return { isUserLoggedIn } as unknown as Awaited<ReturnType<typeof getOidc>>
}

describe('app auth session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getOidc).mockReset()
  })

  it('accepts cached auth before waiting for OIDC initialization', async () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 })
    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub' } })
    vi.mocked(getOidc).mockImplementation(() => new Promise<Awaited<ReturnType<typeof getOidc>>>(() => {}))

    await expect(hasAppAuth()).resolves.toBe(true)
    expect(getOidc).not.toHaveBeenCalled()
  })

  it('falls back to live OIDC when cached auth is unavailable', async () => {
    vi.mocked(getOidc).mockResolvedValue(oidcState(true))

    await expect(hasAppAuth()).resolves.toBe(true)
  })
})
