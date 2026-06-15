import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  beginAuthLogout,
  consumeAuthFallbackFlag,
  getCachedAccessToken,
  getCachedUser,
  markAuthFallbackAvailable,
  readCachedAuth,
  writeCachedAuth,
} from '../token-cache'

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(payload)}.`
}

describe('token-cache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('stores and reads a fresh token', () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 })

    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub', name: 'Mobile User' } })

    expect(getCachedAccessToken()).toBe(token)
    expect(getCachedUser()).toEqual({ sub: 'google-sub', name: 'Mobile User' })
  })

  it('rejects expired tokens and clears malformed cache', () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) - 1 })

    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub' } })

    expect(readCachedAuth()).toBeNull()
    expect(getCachedAccessToken()).toBeNull()
  })

  it('does not reseed cache during the logout guard window', () => {
    beginAuthLogout()
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 600 })

    writeCachedAuth({ accessToken: token, user: { sub: 'google-sub' } })

    expect(readCachedAuth()).toBeNull()
  })

  it('consumes the fallback flag only once', () => {
    markAuthFallbackAvailable()

    expect(consumeAuthFallbackFlag()).toBe(true)
    expect(consumeAuthFallbackFlag()).toBe(false)
  })
})
