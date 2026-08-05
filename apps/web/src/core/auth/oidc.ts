/**
 * OIDC client setup using oidc-spa.
 *
 * Provides Google OIDC authentication for the frontend, replacing next-auth.
 * Exports the bootstrap + state-access utilities used by the app shell and the
 * imperative session layer.
 *
 * See https://github.com/garronej/oidc-spa for full API documentation.
 *
 * `useOidc` is intentionally NOT part of the public auth facade (see
 * `@/core/auth/index.ts`). Only `use-auth.ts` — the single React consumer of
 * OIDC state — and legacy in-flight consumers import it directly.
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
