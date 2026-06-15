import { redirect } from '@tanstack/react-router'
import { hasAppAuth } from './session'

export async function enforceAppLogin() {
  if (await hasAppAuth()) return
  throw redirect({ to: '/login' })
}
