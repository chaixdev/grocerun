/**
 * Client-side API client.
 *
 * Browser-side fetch wrapper that calls /api/v1/* (proxied to NestJS via
 * Vite proxy). Auth tokens are managed by oidc-spa.
 *
 * Mirrors the server-side API client pattern but runs in the browser.
 * See ADR 001 for the simple REST + Zod approach.
 */

import { z } from 'zod'
import { getOidc } from '@/core/auth/oidc'

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
  const oidc = await getOidc()

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(oidc.isUserLoggedIn && {
        Authorization: `Bearer ${await oidc.getAccessToken()}`
      }),
      ...options.headers,
    },
  })

  // On 401, try refreshing tokens once and retry
  if (res.status === 401 && oidc.isUserLoggedIn) {
    try {
      await oidc.renewTokens()
      const accessToken = await oidc.getAccessToken()

      const retryRes = await fetch(`/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
    } catch {
      // Token renewal failed — redirect to login
      oidc.logout({ redirectTo: "home" })
      throw new ApiError('Session expired', 401)
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
