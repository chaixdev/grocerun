import { describe, expect, it } from 'vitest';
import { resolveOidcConfig, isGoogleIssuer } from '../oidc-config';

describe('isGoogleIssuer', () => {
  it('returns true for the real Google issuer', () => {
    expect(isGoogleIssuer('https://accounts.google.com')).toBe(true);
  });

  it('returns false for a spoofed domain with Google as prefix', () => {
    expect(isGoogleIssuer('https://accounts.google.com.evil.tld')).toBe(false);
  });

  it('returns false for a spoofed domain with Google as substring', () => {
    expect(isGoogleIssuer('https://fake-accounts.google.com')).toBe(false);
  });

  it('returns false for Authentik', () => {
    expect(isGoogleIssuer('http://localhost:9000/application/o/grocerun/')).toBe(false);
  });

  it('returns false for an invalid URL', () => {
    expect(isGoogleIssuer('not-a-url')).toBe(false);
  });
});

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

  it('Spoofed Google domain does not unlock unsafe options', () => {
    const result = resolveOidcConfig(
      {
        clientId: 'my-client',
        clientSecret: 'my-secret',
        issuerUri: 'https://accounts.google.com.evil.tld',
      },
      {},
    );

    expect(result.isGoogle).toBe(false);
    expect(result.bootstrapConfig.__unsafe_clientSecret).toBeUndefined();
    expect(result.bootstrapConfig.__unsafe_useIdTokenAsAccessToken).toBeUndefined();
  });
});
