/**
 * OIDC client setup using oidc-spa.
 *
 * Provides Google OIDC authentication for the frontend, replacing next-auth.
 * Exports utilities for React components, route guards, and API token access.
 *
 * See https://github.com/garronej/oidc-spa for full API documentation.
 *
 * --- Test mode bypass ---
 * When a test JWT is present in sessionStorage under
 * `__grocerun_test_token__`, oidc-spa is NOT bootstrapped
 * (avoiding Google OIDC network calls) and mock utilities
 * are returned instead.  Playwright tests inject the token
 * via `page.addInitScript()` before the app loads.
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
