'use server'

import { apiClient } from '@/core/lib/api-client'
import { z } from 'zod'

const HealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string(),
  version: z.string(),
})

export async function testApiConnection() {
  try {
    const health = await apiClient.get('/health', HealthSchema)
    return {
      success: true,
      data: health,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
