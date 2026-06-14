import { z } from 'zod'
import { auth } from '@/core/auth'
import { SignJWT } from 'jose'

/**
 * API Client for Phase 2 Migration
 * 
 * Simple REST client with Zod validation for type-safe API calls.
 * See ADR 001 for rationale: https://github.com/grocerun/wiki/adr/001-phase2-api-approach.md
 * 
 * Usage:
 *   const jwt = await getAuthJwt()
 *   const items = await apiClient.get('/items', ItemsSchema, jwt)
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001'

/**
 * Get a signed JWT for the current session. Returns null if not authenticated.
 */
export async function getAuthJwt(): Promise<string | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const token = (session as any).accessToken
    if (!token?.sub) return null

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    return new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
}

/**
 * Custom error class for API errors with status code and details
 */
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

/**
 * Make an HTTP request with optional Zod validation
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
  authToken?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    })

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || `API request failed: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    // Parse JSON response
    const data = await response.json()

    // Validate with Zod schema if provided
    if (schema) {
      return schema.parse(data)
    }

    return data as T
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Wrap other errors (network failures, etc.)
    if (error instanceof Error) {
      throw new ApiError(
        `API request failed: ${error.message}`,
        0,
        error
      )
    }

    throw error
  }
}

/**
 * API Client with RESTful methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get<T>(endpoint: string, schema?: z.ZodSchema<T>, authToken?: string): Promise<T> {
    return request(endpoint, { method: 'GET' }, schema, authToken)
  },

  /**
   * POST request
   */
  post<T>(
    endpoint: string,
    body: unknown,
    schema?: z.ZodSchema<T>,
    authToken?: string
  ): Promise<T> {
    return request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      schema,
      authToken
    )
  },

  /**
   * PATCH request
   */
  patch<T>(
    endpoint: string,
    body: unknown,
    schema?: z.ZodSchema<T>,
    authToken?: string
  ): Promise<T> {
    return request(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      schema,
      authToken
    )
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, schema?: z.ZodSchema<T>, authToken?: string): Promise<T> {
    return request(endpoint, { method: 'DELETE' }, schema, authToken)
  },
}

/**
 * Development-only request logger
 * TODO: Remove or make conditional in production
 */
if (process.env.NODE_ENV === 'development') {
  const originalRequest = request
  
  // Intercept requests for logging (development only)
  Object.assign(apiClient, {
    get: <T>(endpoint: string, schema?: z.ZodSchema<T>, authToken?: string) => {
      console.log(`[API] GET ${endpoint}`)
      return originalRequest(endpoint, { method: 'GET' }, schema, authToken)
    },
    post: <T>(endpoint: string, body: unknown, schema?: z.ZodSchema<T>, authToken?: string) => {
      console.log(`[API] POST ${endpoint}`, body)
      return originalRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }, schema, authToken)
    },
    patch: <T>(endpoint: string, body: unknown, schema?: z.ZodSchema<T>, authToken?: string) => {
      console.log(`[API] PATCH ${endpoint}`, body)
      return originalRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, schema, authToken)
    },
    delete: <T>(endpoint: string, schema?: z.ZodSchema<T>, authToken?: string) => {
      console.log(`[API] DELETE ${endpoint}`)
      return originalRequest(endpoint, { method: 'DELETE' }, schema, authToken)
    },
  })
}
