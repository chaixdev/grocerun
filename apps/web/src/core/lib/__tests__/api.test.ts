import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../api'
import { invalidateSession, getAccessToken, refreshAccessToken } from '@/core/auth/session'

vi.mock('@/core/auth/session', () => ({
  invalidateSession: vi.fn(),
  getAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

describe('api auth handling', () => {
  beforeEach(() => {
    vi.mocked(invalidateSession).mockReset()
    vi.mocked(getAccessToken).mockReset()
    vi.mocked(refreshAccessToken).mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uses the cached/app token as Bearer auth', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('cached-token')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await api.get('/users/me')

    expect(fetch).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer cached-token' }),
    }))
  })

  it('clears invalid cached auth when 401 cannot be refreshed', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('cached-token')
    vi.mocked(refreshAccessToken).mockResolvedValue(null)
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }))

    await expect(api.get('/users/me')).rejects.toBeInstanceOf(ApiError)
    expect(invalidateSession).toHaveBeenCalled()
  })
})
