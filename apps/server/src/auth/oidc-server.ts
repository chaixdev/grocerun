import { oidcSpa, extractRequestAuthContext } from 'oidc-spa/server';
import { z } from 'zod';
import { Logger } from '@nestjs/common';

const logger = new Logger('OidcServer');

const oidcBuilder = oidcSpa.withExpectedDecodedAccessTokenShape({
    decodedAccessTokenSchema: z.object({
        sub: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        picture: z.string().url().optional(),
        email_verified: z.boolean().optional(),
    }),
});

let currentInstance = oidcBuilder.createUtils();
let lastBootstrapParams: Parameters<typeof currentInstance.bootstrapAuth>[0] | null = null;

// Coalesces concurrent JWKS refreshes so that only ONE bootstrap/JWKS fetch
// happens when many requests fail simultaneously (e.g. the 7-parallel sync
// pull burst seen in prod). Concurrent callers await the same in-flight
// promise instead of each starting their own refresh.
let refreshInFlight: Promise<typeof currentInstance | null> | null = null;

export const bootstrapAuth = async (params: Parameters<typeof currentInstance.bootstrapAuth>[0]) => {
    lastBootstrapParams = params;
    await currentInstance.bootstrapAuth(params);
};

async function getRefreshedInstance(): Promise<typeof currentInstance | null> {
    if (!lastBootstrapParams) {
        logger.warn(`Cannot refresh JWKS: bootstrapAuth was never called with params.`);
        return null;
    }
    const newInstance = oidcBuilder.createUtils();
    await newInstance.bootstrapAuth(lastBootstrapParams);
    return newInstance;
}

export const validateAndDecodeAccessToken = async (
    params: Parameters<typeof currentInstance.validateAndDecodeAccessToken>[0]
) => {
    const result = await currentInstance.validateAndDecodeAccessToken(params);

    if (
        !result.isSuccess &&
        result.debugErrorMessage &&
        result.debugErrorMessage.includes('No public signing key found with kid')
    ) {
        if (!refreshInFlight) {
            logger.warn(
                `Key mismatch detected (kid not found). Coalescing a single JWKS refresh...`
            );
            refreshInFlight = getRefreshedInstance();
        }

        try {
            const newInstance = await refreshInFlight;
            if (newInstance) {
                const retryResult = await newInstance.validateAndDecodeAccessToken(params);
                if (retryResult.isSuccess) {
                    logger.log(`JWKS refreshed successfully! Updating current OIDC client instance.`);
                    currentInstance = newInstance;
                    return retryResult;
                }
                logger.error(
                    `JWKS refresh failed: retry validation still failed with: ${retryResult.debugErrorMessage}`
                );
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            logger.error(`Failed to refresh JWKS and re-authenticate: ${msg}`, stack);
        } finally {
            refreshInFlight = null;
        }
    }

    return result;
};

// Re-export so guard can use it
export { extractRequestAuthContext };
