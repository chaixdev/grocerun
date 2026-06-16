import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { validateAndDecodeAccessToken } from './oidc-server';
import { AuthService } from './auth.service';

import 'express';

declare module 'express' {
    interface Request {
        user?: JwtPayload;
    }
}

export interface JwtPayload {
    sub: string;       // Google OIDC subject — matches frontend decodedIdToken.sub
    userId?: string;   // Internal DB user ID — for access control queries
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
}

const TEST_SECRET = 'grocerun-test-secret-do-not-use-in-production';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No authentication token provided');
        }

        // --- Test mode bypass ---
        // The NestJS testing module's `overrideGuard` method has a known bug
        // that loses controller DI bindings in vitest.  Instead of overriding
        // the guard in tests, we detect test tokens here and handle them with
        // local JWT verification — no Google JWKS call, no DB access needed
        // (the test user is seeded with a known ID by seedBaseFixtures).
        if (process.env.NODE_ENV === 'test') {
            try {
                const payload = jwt.verify(token, TEST_SECRET) as JwtPayload;
                if (payload.sub) {
                    request.user = { ...payload, userId: payload.sub };
                    return true;
                }
            } catch {
                // Fall through to production flow
            }
        }

        const { isSuccess, debugErrorMessage, decodedAccessToken } =
            await validateAndDecodeAccessToken({
                scheme: 'Bearer',
                accessToken: token,
                rejectIfAccessTokenDPoPBound: false,
            });

        if (!isSuccess) {
            this.logger.warn('Token validation failed: ' + debugErrorMessage);
            throw new UnauthorizedException('Invalid or expired token');
        }

        // Map Google OIDC sub → internal DB user ID
        const dbUserId = await this.authService.resolveGoogleUser(decodedAccessToken);

        request.user = {
            sub: decodedAccessToken.sub,
            userId: dbUserId,
            email: decodedAccessToken.email,
            name: decodedAccessToken.name,
            picture: decodedAccessToken.picture,
            email_verified: decodedAccessToken.email_verified,
        };

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type === 'Bearer' && token) return token;

        // ── SSE query-token fallback ──────────────────────────────────────
        // EventSource (used by RxDB sync protocol) cannot send custom HTTP
        // headers (no Authorization header).  To work around this limitation,
        // the client appends ?token=<JWT> to the sync stream URL.
        //
        // Security notes:
        //   • This fallback is ONLY accepted for SSE stream endpoints matching
        //     the pattern `/api/v1/sync/{collection}/stream`.
        //   • Non-stream endpoints (pull, push) are NOT accessible via query
        //     param — they must use the standard Authorization header.
        //   • The JWT in the query string has the same lifetime as one sent
        //     via header, so the exposure window is identical.
        //   • In production this runs over HTTPS, so the token is encrypted
        //     in transit.  No server-side logging of the token value.
        // ───────────────────────────────────────────────────────────────────
        const isSseStream = /^\/(api\/v1\/)?sync\/(\w+\/)?stream$/.test(request.path);
        if (!isSseStream) return undefined;

        const queryToken = (request.query as Record<string, string>)['token'];
        if (queryToken) {
            this.logger.warn('Token provided via query param (SSE fallback)');
        }
        return queryToken || undefined;
    }
}
