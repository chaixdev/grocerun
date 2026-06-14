/**
 * OIDC client setup using oidc-spa.
 *
 * Provides Google OIDC authentication for the frontend, replacing next-auth.
 * Exports utilities for React components, route guards, and API token access.
 *
 * See https://github.com/garronej/oidc-spa for full API documentation.
 */

import { oidcSpa } from "oidc-spa/react-spa";
import { z } from "zod";

export const {
    bootstrapOidc,
    useOidc,
    getOidc,
    enforceLogin,
    OidcInitializationGate
} = oidcSpa
    .withExpectedDecodedIdTokenShape({
        decodedIdTokenSchema: z.object({
            sub: z.string(),
            name: z.string(),
            email: z.string().email().optional(),
            picture: z.string().url().optional(),
        })
    })
    .createUtils();
