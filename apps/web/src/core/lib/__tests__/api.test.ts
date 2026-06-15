import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../api'
import { clearInvalidAppAuth, getAppAccessToken, refreshAppAccessToken } from '@/core/auth/session'

vi.mock('@/core/auth/session', () => ({
  clearInvalidAppAuth: vi.fn(),
  getAppAccessToken: vi.fn(),
  refreshAppAccessToken: vi.fn(),
}))

describe('api auth handling', () => {
  beforeEach(() => {
    vi.mocked(clearInvalidAppAuth).mockReset()
    vi.mocked(getAppAccessToken).mockReset()
    vi.mocked(refreshAppAccessToken).mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uses the cached/app token as Bearer auth', async () => {
    vi.mocked(getAppAccessToken).mockResolvedValue('cached-token')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await api.get('/users/me')

    expect(fetch).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer cached-token' }),
    }))
  })

  it('clears invalid cached auth when 401 cannot be refreshed', async () => {
    vi.mocked(getAppAccessToken).mockResolvedValue('cached-token')
    vi.mocked(refreshAppAccessToken).mockResolvedValue(null)
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }))

    await expect(api.get('/users/me')).rejects.toBeInstanceOf(ApiError)
    expect(clearInvalidAppAuth).toHaveBeenCalled()
  })
})
