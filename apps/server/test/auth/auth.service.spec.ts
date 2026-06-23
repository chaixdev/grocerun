import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma.service';

// ---------------------------------------------------------------------------
// AuthService.resolveOidcUser — unit tests
//
// Mocks PrismaService directly using as-unknown-as cast pattern.
// Each scenario is self-contained; no NestJS testing module, no real DB.
// ---------------------------------------------------------------------------

describe('AuthService.resolveOidcUser', () => {
  let authService: AuthService;
  let mockAccountFindUnique: ReturnType<typeof vi.fn>;
  let mockUserFindUnique: ReturnType<typeof vi.fn>;
  let mockAccountCreate: ReturnType<typeof vi.fn>;
  let mockUserCreate: ReturnType<typeof vi.fn>;

  // Capture the original so we can restore it after each test that
  // modifies OIDC_PROVIDER.
  const OIDC_PROVIDER_BAK = process.env.OIDC_PROVIDER;

  beforeEach(() => {
    // Start each test with OIDC_PROVIDER unset so the default 'google' is used,
    // unless a specific test (group 5) overrides it.
    delete process.env.OIDC_PROVIDER;

    mockAccountFindUnique = vi.fn();
    mockUserFindUnique = vi.fn();
    mockAccountCreate = vi.fn();
    mockUserCreate = vi.fn();

    const mockPrisma = {
      account: {
        findUnique: mockAccountFindUnique,
        create: mockAccountCreate,
      },
      user: {
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
      },
    } as unknown as PrismaService;

    authService = new AuthService(mockPrisma);
  });

  afterEach(() => {
    process.env.OIDC_PROVIDER = OIDC_PROVIDER_BAK;
  });

  // -----------------------------------------------------------------------
  // 1. Known account (2 tests)
  // -----------------------------------------------------------------------
  describe('1. Known account', () => {
    it('returns existing userId when Account is found by (provider, sub)', async () => {
      mockAccountFindUnique.mockResolvedValue({ userId: 'existing-user-id' });

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-1',
        email: 'irrelevant@test.com',
      });

      expect(result).toBe('existing-user-id');
      expect(mockAccountFindUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'oidc-sub-1',
          },
        },
        select: { userId: true },
      });
      // No further queries/creations for a known account
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockAccountCreate).not.toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it('does not reach email-linking or user-creation for a known account', async () => {
      mockAccountFindUnique.mockResolvedValue({ userId: 'another-user-id' });

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-2',
      });

      expect(result).toBe('another-user-id');
      expect(mockAccountFindUnique).toHaveBeenCalledTimes(1);
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockAccountCreate).not.toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 2. Existing user by verified email (2 tests)
  // -----------------------------------------------------------------------
  describe('2. Existing user by verified email', () => {
    it('links Account to existing User when email_verified is true', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue({ id: 'email-user-id' });
      mockAccountCreate.mockResolvedValue({});

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-3',
        email: 'existing@test.com',
        email_verified: true,
      });

      expect(result).toBe('email-user-id');
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'existing@test.com' },
        select: { id: true },
      });
      expect(mockAccountCreate).toHaveBeenCalledWith({
        data: {
          userId: 'email-user-id',
          type: 'oidc',
          provider: 'google',
          providerAccountId: 'oidc-sub-3',
        },
      });
      // No standalone user creation
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it('links Account when email_verified is undefined (treated as !false)', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue({ id: 'email-user-id-2' });
      mockAccountCreate.mockResolvedValue({});

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-4',
        email: 'existing2@test.com',
        // email_verified is intentionally omitted — should still link
      });

      expect(result).toBe('email-user-id-2');
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'existing2@test.com' },
        select: { id: true },
      });
      expect(mockAccountCreate).toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 3. Unverified email does NOT link (2 tests)
  // -----------------------------------------------------------------------
  describe('3. Unverified email does NOT link', () => {
    it('skips email lookup entirely when email_verified is false', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      const newUserId = 'new-user-from-false';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-5',
        email: 'unverified@test.com',
        email_verified: false,
      });

      expect(result).toBe(newUserId);
      // The guard `payload.email_verified !== false` prevents this branch
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserCreate).toHaveBeenCalled();
    });

    it('creates a new user+account for unverified email instead of linking', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      const newUserId = 'new-user-unverified';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-6',
        email: 'unverified2@test.com',
        email_verified: false,
      });

      expect(result).toBe(newUserId);
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: 'unverified2@test.com',
          name: null,
          image: null,
          accounts: {
            create: {
              type: 'oidc',
              provider: 'google',
              providerAccountId: 'oidc-sub-6',
            },
          },
        },
        select: { id: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // 4. Brand new user (3 tests)
  // -----------------------------------------------------------------------
  describe('4. Brand new user', () => {
    it('creates User+Account when no Account and no existing User found by email', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue(null);
      const newUserId = 'brand-new-user';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-7',
        email: 'new@test.com',
        name: 'New User',
        picture: 'https://pic.com/1',
      });

      expect(result).toBe(newUserId);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          name: 'New User',
          image: 'https://pic.com/1',
          accounts: {
            create: {
              type: 'oidc',
              provider: 'google',
              providerAccountId: 'oidc-sub-7',
            },
          },
        },
        select: { id: true },
      });
      // Account is created via nested create, not standalone call
      expect(mockAccountCreate).not.toHaveBeenCalled();
    });

    it('sets null for missing email field', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      const newUserId = 'no-email-user';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      // No email → email-linking step is skipped entirely
      const result = await authService.resolveOidcUser({
        sub: 'oidc-sub-8',
        name: 'No Email User',
      });

      expect(result).toBe(newUserId);
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: null,
          name: 'No Email User',
          image: null,
          accounts: {
            create: {
              type: 'oidc',
              provider: 'google',
              providerAccountId: 'oidc-sub-8',
            },
          },
        },
        select: { id: true },
      });
    });

    it('handles payload with only sub — all optional fields become null', async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      const newUserId = 'sparse-user';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      const result = await authService.resolveOidcUser({ sub: 'oidc-sub-9' });

      expect(result).toBe(newUserId);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: null,
          name: null,
          image: null,
          accounts: {
            create: {
              type: 'oidc',
              provider: 'google',
              providerAccountId: 'oidc-sub-9',
            },
          },
        },
        select: { id: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // 5. Provider from env var (3 tests)
  // -----------------------------------------------------------------------
  describe('5. Provider from env var', () => {
    it('uses env provider when looking up existing Account', async () => {
      process.env.OIDC_PROVIDER = 'authentik';
      mockAccountFindUnique.mockResolvedValue({ userId: 'authentik-user' });

      const result = await authService.resolveOidcUser({
        sub: 'authentik-sub-1',
      });

      expect(result).toBe('authentik-user');
      expect(mockAccountFindUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'authentik',
            providerAccountId: 'authentik-sub-1',
          },
        },
        select: { userId: true },
      });
    });

    it('uses env provider when linking Account to existing User by email', async () => {
      process.env.OIDC_PROVIDER = 'authentik';
      mockAccountFindUnique.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue({ id: 'authentik-email-user' });
      mockAccountCreate.mockResolvedValue({});

      const result = await authService.resolveOidcUser({
        sub: 'authentik-sub-2',
        email: 'auth@test.com',
        email_verified: true,
      });

      expect(result).toBe('authentik-email-user');
      expect(mockAccountCreate).toHaveBeenCalledWith({
        data: {
          userId: 'authentik-email-user',
          type: 'oidc',
          provider: 'authentik',
          providerAccountId: 'authentik-sub-2',
        },
      });
    });

    it('uses env provider when creating a brand new User+Account', async () => {
      process.env.OIDC_PROVIDER = 'authentik';
      mockAccountFindUnique.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue(null);
      const newUserId = 'authentik-new-user';
      mockUserCreate.mockResolvedValue({ id: newUserId });

      const result = await authService.resolveOidcUser({
        sub: 'authentik-sub-3',
        email: 'new-auth@test.com',
      });

      expect(result).toBe(newUserId);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new-auth@test.com',
          accounts: {
            create: expect.objectContaining({ provider: 'authentik' }),
          },
        }),
        select: { id: true },
      });
    });
  });
});
