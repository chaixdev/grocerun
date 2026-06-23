import { describe, expect, it } from 'vitest';

interface RawConfig {
  clientId?: string;
  clientSecret?: string;
  issuerUri?: string;
}

interface EnvConfig {
  VITE_OIDC_CLIENT_ID?: string;
  VITE_OIDC_CLIENT_SECRET?: string;
  VITE_OIDC_ISSUER_URI?: string;
}

interface BootstrapConfig {
  implementation: string;
  issuerUri: string;
  clientId: string | undefined;
  __unsafe_clientSecret?: string;
  __unsafe_useIdTokenAsAccessToken?: boolean;
}

interface ResolvedOidcConfig {
  issuerUri: string;
  isGoogle: boolean;
  clientId: string | undefined;
  bootstrapConfig: BootstrapConfig;
}

function resolveOidcConfig(
  rawConfig: RawConfig | undefined,
  envConfig: EnvConfig,
): ResolvedOidcConfig {
  const merged = rawConfig ?? {
    clientId: envConfig.VITE_OIDC_CLIENT_ID,
    clientSecret: envConfig.VITE_OIDC_CLIENT_SECRET,
    issuerUri: envConfig.VITE_OIDC_ISSUER_URI,
  };

  const issuerUri = merged.issuerUri || 'https://accounts.google.com';
  const isGoogle = issuerUri.includes('accounts.google.com');

  const bootstrapConfig: BootstrapConfig = {
    implementation: 'real',
    issuerUri,
    clientId: merged.clientId,
    ...(isGoogle && merged.clientSecret
      ? { __unsafe_clientSecret: merged.clientSecret }
      : {}),
    ...(isGoogle ? { __unsafe_useIdTokenAsAccessToken: true } : {}),
  };

  return { issuerUri, isGoogle, clientId: merged.clientId, bootstrapConfig };
}

describe('resolveOidcConfig', () => {
  it('Google issuer includes unsafe options', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
        issuerUri: 'https://accounts.google.com',
      },
      {},
    );

    expect(result.issuerUri).toBe('https://accounts.google.com');
    expect(result.isGoogle).toBe(true);
    expect(result.clientId).toBe('my-client');
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBe('my-secret');
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBe(true);
  });

  it('Non-Google issuer omits unsafe options', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
        issuerUri: 'https://authentik.example.com',
      },
      {},
    );

    expect(result.issuerUri).toBe('https://authentik.example.com');
    expect(result.isGoogle).toBe(false);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBeUndefined();
  });

  it('Missing issuer falls back to Google', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
      },
      {},
    );

    expect(result.issuerUri).toBe('https://accounts.google.com');
    expect(result.isGoogle).toBe(true);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBe('my-secret');
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBe(true);
  });

  it('No config at all', () => {
    const result = resolveOidcConfig(undefined, {});

    expect(result.issuerUri).toBe('https://accounts.google.com');
    expect(result.isGoogle).toBe(true);
    expect(result.clientId).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBe(true);
  });

  it('Env var precedence: rawConfig takes precedence over envConfig', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'raw-client',
        clientSecret: 'raw-secret',
        issuerUri: 'https://accounts.google.com',
      },
      {
        VITE_OIDC_CLIENT_ID: 'env-client',
        VITE_OIDC_CLIENT_SECRET: 'env-secret',
        VITE_OIDC_ISSUER_URI: 'https://authentik.example.com',
      },
    );

    expect(result.issuerUri).toBe('https://accounts.google.com');
    expect(result.clientId).toBe('raw-client');
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBe('raw-secret');
    expect(result.isGoogle).toBe(true);
  });

  it('rawConfig-over-env precedence for clientId', () => {
    const result = resolveOidcConfig(
      { clientId: 'raw-client' },
      { VITE_OIDC_CLIENT_ID: 'env-client' },
    );

    expect(result.clientId).toBe('raw-client');
  });

  it('Google without clientSecret', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        issuerUri: 'https://accounts.google.com',
      },
      {},
    );

    expect(result.issuerUri).toBe('https://accounts.google.com');
    expect(result.isGoogle).toBe(true);
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBe(true);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
  });

  it('Authentik issuer', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
        issuerUri: 'https://authentik.example.com',
      },
      {},
    );

    expect(result.issuerUri).toBe('https://authentik.example.com');
    expect(result.isGoogle).toBe(false);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBeUndefined();
  });

  it('Self-hosted Keycloak issuer', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
        issuerUri: 'http://localhost:8080/realms/myrealm',
      },
      {},
    );

    expect(result.issuerUri).toBe('http://localhost:8080/realms/myrealm');
    expect(result.isGoogle).toBe(false);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBeUndefined();
  });
});
