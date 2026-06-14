import { oidcSpa, extractRequestAuthContext } from 'oidc-spa/server';
import { z } from 'zod';

export const { bootstrapAuth, validateAndDecodeAccessToken } = oidcSpa
    .withExpectedDecodedAccessTokenShape({
        decodedAccessTokenSchema: z.object({
            sub: z.string(),
            name: z.string().optional(),
            email: z.string().email().optional(),
            picture: z.string().url().optional(),
            email_verified: z.boolean().optional(),
        }),
    })
    .createUtils();

// Re-export so guard can use it
export { extractRequestAuthContext };
