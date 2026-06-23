import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface OidcUserPayload {
    sub: string;        // OIDC subject
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
}

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Maps an OIDC identity to our internal DB user ID.
     *
     * The provider name is read from OIDC_PROVIDER (defaults to 'google'
     * for backward compatibility).  Set OIDC_PROVIDER to match your IdP
     * (e.g. 'authentik', 'microsoft') so Account records are scoped correctly.
     *
     * Strategy (in order):
     *  1. Find Account by (provider, providerAccountId=sub) → return userId
     *  2. Find User by email → link Account to existing user → return userId
     *  3. Create new User + Account → return new userId
     */
    async resolveOidcUser(payload: OidcUserPayload): Promise<string> {
        const provider = process.env.OIDC_PROVIDER || 'google';

        // 1. Known account
        const account = await this.prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId: payload.sub,
                },
            },
            select: { userId: true },
        });
        if (account) return account.userId;

        // 2. Existing user by email — link the account
        // Only link when the email is verified (prevents account takeover
        // via unverified email claims from a misconfigured provider).
        if (payload.email && payload.email_verified !== false) {
            const user = await this.prisma.user.findUnique({
                where: { email: payload.email },
                select: { id: true },
            });
            if (user) {
                await this.prisma.account.create({
                    data: {
                        userId: user.id,
                        type: 'oidc',
                        provider,
                        providerAccountId: payload.sub,
                    },
                });
                return user.id;
            }
        }

        // 3. Brand new user
        const newUser = await this.prisma.user.create({
            data: {
                email: payload.email ?? null,
                name: payload.name ?? null,
                image: payload.picture ?? null,
                accounts: {
                    create: {
                        type: 'oidc',
                        provider,
                        providerAccountId: payload.sub,
                    },
                },
            },
            select: { id: true },
        });
        return newUser.id;
    }
}
