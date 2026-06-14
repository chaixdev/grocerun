import { getAuthJwt } from '@/core/lib/api-client'

export async function GET() {
  const token = await getAuthJwt()
  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return Response.json({ token })
}
