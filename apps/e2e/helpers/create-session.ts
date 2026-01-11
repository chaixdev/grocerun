import { encode } from 'next-auth/jwt';

/**
 * Creates a NextAuth v5 compatible JWT session token for testing
 * Uses NextAuth's own encode function to create encrypted JWT (JWE)
 */
export async function createTestSession(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const authSecret = process.env.AUTH_SECRET;
  
  if (!authSecret) {
    throw new Error('AUTH_SECRET not set in test environment');
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Create JWT payload matching NextAuth structure
  const token = {
    sub: userId,
    email: email,
    name: name || email.split('@')[0],
    iat: now,
    exp: now + 3600,
  };

  // Use NextAuth's encode - matches what the debug script confirmed works
  return await encode({
    token,
    secret: authSecret,
    salt: 'authjs.session-token', // v5 default salt
  });
}
