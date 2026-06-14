/**
 * Client-side API client for Phase 3.
 *
 * Browser-side fetch wrapper that calls /api/v1/* (proxied to NestJS via
 * Next.js rewrite). Auth tokens are managed by auth-token.ts.
 *
 * Mirrors the server-side apiClient pattern (api-client.ts) but runs in
 * the browser. See ADR 001 for the simple REST + Zod approach.
 */

import { z } from 'zod'
import { getToken, refreshToken, clearToken } from './auth-token'

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
  const token = await getToken()

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  // On 401, try refreshing the token once and retry
  if (res.status === 401) {
    const newToken = await refreshToken()
    if (!newToken) {
      clearToken()
      window.location.href = '/login'
      throw new ApiError('Session expired', 401)
    }

    const retryRes = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
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
 * Client-side API client — browser equivalent of apiClient from api-client.ts.
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
