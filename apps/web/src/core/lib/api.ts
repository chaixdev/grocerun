/**
 * Client-side API client.
 *
 * Browser-side fetch wrapper that calls /api/v1/* (proxied to NestJS via
 * Vite proxy). Auth tokens are managed by oidc-spa.
 *
 * Mirrors the server-side API client pattern but runs in the browser.
 * See ADR 001 for the simple REST + Zod approach.
 *
 * Auth tokens (including the Playwright test-token bypass) are resolved by
 * `@/core/auth/session` — see session.ts. This client never touches
 * `__grocerun_test_token__` directly.
 */

import { z } from 'zod'
import { invalidateSession, getAccessToken, refreshAccessToken } from '@/core/auth/session'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const accessToken = await getAccessToken()

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && {
        Authorization: `Bearer ${accessToken}`
      }),
      ...options.headers,
    },
  })

  // On 401, try refreshing tokens once and retry
  if (res.status === 401 && accessToken) {
    const retryToken = await refreshAccessToken()
    if (!retryToken) {
      invalidateSession()
      throw new ApiError('Session expired', 401)
    }

    try {
      const retryRes = await fetch(`/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retryToken}`,
          ...options.headers,
        },
      })

      if (!retryRes.ok) {
        const errorData = await retryRes.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `API request failed: ${retryRes.statusText}`,
          retryRes.status,
          errorData
        )
      }

      const data = await retryRes.json()
      return schema ? schema.parse(data) : data as T
    } catch (err) {
      if (err instanceof ApiError) throw err
      invalidateSession()
      throw err  // re-throw original to preserve actual error type/message
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new ApiError(
      errorData.message || `API request failed: ${res.statusText}`,
      res.status,
      errorData
    )
  }

  const data = await res.json()
  return schema ? schema.parse(data) : data as T
}

/**
 * Client-side API client.
 */
export const api = {
  get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return request(endpoint, { method: 'GET' }, schema)
  },

  post<T>(endpoint: string, body?: unknown, schema?: z.ZodSchema<T>): Promise<T> {
    return request(
      endpoint,
      { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined },
      schema
    )
  },

  patch<T>(endpoint: string, body: unknown, schema?: z.ZodSchema<T>): Promise<T> {
    return request(
      endpoint,
      { method: 'PATCH', body: JSON.stringify(body) },
      schema
    )
  },

  delete<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return request(endpoint, { method: 'DELETE' }, schema)
  },
}
