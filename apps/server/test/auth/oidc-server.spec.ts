import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure these mocks are hoisted and available during vi.mock initialization
const { mockBootstrapAuth, mockValidateAndDecodeAccessToken, mockCreateUtils } = vi.hoisted(() => {
  const bootstrap = vi.fn();
  const validate = vi.fn();
  const create = vi.fn(() => ({
    bootstrapAuth: bootstrap,
    validateAndDecodeAccessToken: validate,
  }));
  return {
    mockBootstrapAuth: bootstrap,
    mockValidateAndDecodeAccessToken: validate,
    mockCreateUtils: create,
  };
});

vi.mock('oidc-spa/server', () => {
  return {
    extractRequestAuthContext: vi.fn(),
    oidcSpa: {
      withExpectedDecodedAccessTokenShape: () => ({
        createUtils: mockCreateUtils,
      }),
    },
  };
});

// Import after mocking
import { bootstrapAuth, validateAndDecodeAccessToken } from '../../src/auth/oidc-server';

describe('OidcServer Self-Healing Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates successful validation directly to the active instance', async () => {
    mockValidateAndDecodeAccessToken.mockResolvedValue({
      isSuccess: true,
      decodedAccessToken: { sub: 'user-123' },
    });

    const result = await validateAndDecodeAccessToken({ accessToken: 'valid-token' });

    expect(result.isSuccess).toBe(true);
    expect(result.decodedAccessToken?.sub).toBe('user-123');
    expect(mockValidateAndDecodeAccessToken).toHaveBeenCalledTimes(1);
    expect(mockCreateUtils).toHaveBeenCalledTimes(0); // No new instance created
  });

  it('automatically refreshes JWKS and retries validation when kid is missing', async () => {
    // 1. Initial call to bootstrapAuth stores bootstrap parameters
    await bootstrapAuth({
      implementation: 'real',
      issuerUri: 'https://accounts.google.com',
      expectedAudience: 'some-client-id',
    });

    // 2. Setup first call to fail with kid mismatch, and second (on new instance) to succeed
    let callCount = 0;
    mockValidateAndDecodeAccessToken.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          isSuccess: false,
          debugErrorMessage: 'No public signing key found with kid f36191371c',
        };
      }
      return {
        isSuccess: true,
        decodedAccessToken: { sub: 'user-456' },
      };
    });

    mockBootstrapAuth.mockResolvedValue(undefined);

    const result = await validateAndDecodeAccessToken({ accessToken: 'new-kid-token' });

    // Should return the successful retry result
    expect(result.isSuccess).toBe(true);
    expect(result.decodedAccessToken?.sub).toBe('user-456');

    // Should have created a second instance of the OIDC client
    expect(mockCreateUtils).toHaveBeenCalledTimes(1);
    expect(mockBootstrapAuth).toHaveBeenCalledTimes(2); // Initial + Retry bootstrap
  });

  it('coalesces concurrent kid-missing refreshes into a single JWKS fetch', async () => {
    await bootstrapAuth({
      implementation: 'real',
      issuerUri: 'https://accounts.google.com',
    });

    // All concurrent requests fail the first validation with kid-missing.
    // After the single refreshed instance is ready, every caller's retry
    // succeeds.
    let firstCallCount = 0;
    mockValidateAndDecodeAccessToken.mockImplementation(async () => {
      firstCallCount++;
      if (firstCallCount <= 7) {
        return {
          isSuccess: false,
          debugErrorMessage: 'No public signing key found with kid rotated-kid',
        };
      }
      return {
        isSuccess: true,
        decodedAccessToken: { sub: 'coalesced-user' },
      };
    });

    // Delay the mock bootstrap on a macrotask so that all 7 concurrent
    // callers latch onto the same in-flight refresh promise before it
    // resolves (mirrors the real ~100ms+ JWKS fetch latency).
    mockBootstrapAuth.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 0)),
    );

    const tokens = Array.from({ length: 7 }, (_, i) => `t-${i}`);
    const results = await Promise.all(
      tokens.map((t) => validateAndDecodeAccessToken({ accessToken: t })),
    );

    // Every caller succeeds after the shared refresh.
    expect(results.every((r) => r.isSuccess)).toBe(true);

    // Only ONE new OIDC instance was created and only ONE retry bootstrap
    // served all 7 concurrent callers (setup bootstrap + 1 retry = 2 total;
    // without coalescing it would be setup + 7 = 8).
    expect(mockCreateUtils).toHaveBeenCalledTimes(1);
    expect(mockBootstrapAuth).toHaveBeenCalledTimes(2);
  });

  it('returns initial failure if retry also fails', async () => {
    await bootstrapAuth({
      implementation: 'real',
      issuerUri: 'https://accounts.google.com',
    });

    mockValidateAndDecodeAccessToken.mockResolvedValue({
      isSuccess: false,
      debugErrorMessage: 'No public signing key found with kid f36191371c',
    });

    const result = await validateAndDecodeAccessToken({ accessToken: 'bad-token' });

    expect(result.isSuccess).toBe(false);
    expect(result.debugErrorMessage).toContain('No public signing key found with kid');
    expect(mockCreateUtils).toHaveBeenCalledTimes(1); // Tried once, failed, returned failure
  });
});
