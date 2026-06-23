/**
 * Shared OIDC config resolution — used by __root.tsx at runtime and by
 * oidc-config.test.ts for unit testing.
 *
 * Extracted to ensure the test exercises the real production logic,
 * not a duplicated copy.
 */

export interface RawOidcConfig {
  clientId?: string;
  clientSecret?: string;
  issuerUri?: string;
}

export interface EnvOidcConfig {
  VITE_OIDC_CLIENT_ID?: string;
  VITE_OIDC_CLIENT_SECRET?: string;
  VITE_OIDC_ISSUER_URI?: string;
}

export interface BootstrapOidcConfig {
  implementation: 'real';
  issuerUri: string;
  clientId: string;
  __unsafe_clientSecret?: string;
  __unsafe_useIdTokenAsAccessToken?: boolean;
}

export interface ResolvedOidcConfig {
  issuerUri: string;
  isGoogle: boolean;
  clientId: string | undefined;
  bootstrapConfig: BootstrapOidcConfig;
}

/**
 * Returns true only if the issuer URI's hostname is exactly
 * `accounts.google.com`. Uses URL parsing instead of substring matching
 * to prevent spoofed domains like `accounts.google.com.evil.tld` from
 * unlocking the `__unsafe_*` options.
 */
export function isGoogleIssuer(issuerUri: string): boolean {
  try {
    return new URL(issuerUri).hostname === 'accounts.google.com';
  } catch {
    return false;
  }
}

export function resolveOidcConfig(
  rawConfig: RawOidcConfig | undefined,
  envConfig: EnvOidcConfig,
): ResolvedOidcConfig {
  const merged = rawConfig ?? {
    clientId: envConfig.VITE_OIDC_CLIENT_ID,
    clientSecret: envConfig.VITE_OIDC_CLIENT_SECRET,
    issuerUri: envConfig.VITE_OIDC_ISSUER_URI,
  };

  const issuerUri = merged.issuerUri || 'https://accounts.google.com';
  const isGoogle = isGoogleIssuer(issuerUri);

  const bootstrapConfig: BootstrapOidcConfig = {
    implementation: 'real',
    issuerUri,
    clientId: merged.clientId ?? '',
    ...(isGoogle && merged.clientSecret
      ? { __unsafe_clientSecret: merged.clientSecret }
      : {}),
    ...(isGoogle ? { __unsafe_useIdTokenAsAccessToken: true } : {}),
  };

  return { issuerUri, isGoogle, clientId: merged.clientId, bootstrapConfig };
}
