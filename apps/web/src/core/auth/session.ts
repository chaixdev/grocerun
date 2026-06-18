import { getOidc } from './oidc'
import {
  beginAuthLogout,
  clearCachedAuth,
  getCachedAccessToken,
  getCachedUser,
  readCachedAuth,
  writeCachedAuth,
} from './token-cache'

export type AppAuthUser = {
  sub: string
  name?: string
  email?: string
  picture?: string
}

export function getCachedAppUser(): AppAuthUser | null {
  return getCachedUser()
}

export async function hasAppAuth(): Promise<boolean> {
  if (readCachedAuth() !== null) return true

  const oidc = await getOidc()
  return oidc.isUserLoggedIn
}

export async function getAppAccessToken(): Promise<string | null> {
  const oidc = await getOidc()
  if (!oidc.isUserLoggedIn) return getCachedAccessToken()

  const accessToken = await oidc.getAccessToken()
  writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
  return accessToken
}

export async function refreshAppAccessToken(): Promise<string | null> {
  const oidc = await getOidc()
  if (!oidc.isUserLoggedIn) return null

  await oidc.renewTokens()
  const accessToken = await oidc.getAccessToken()
  writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
  return accessToken
}

export async function persistLiveOidcSession(): Promise<void> {
  const oidc = await getOidc()
  if (!oidc.isUserLoggedIn) return

  const accessToken = await oidc.getAccessToken()
  writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
}

export function clearAppAuth(): void {
  beginAuthLogout()
}

export function clearInvalidAppAuth(): void {
  clearCachedAuth()
}
