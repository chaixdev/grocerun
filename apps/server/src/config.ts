import { existsSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Load .env if present. process.loadEnvFile does NOT override variables that
// are already set, so test/CI-injected values always win.
const envFilePath = path.resolve(process.cwd(), '.env');
if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1).default('file:dev.db'),
    // CORS origin for the web app
    WEB_URL: z.string().url().default('http://localhost:3000'),
    APP_VERSION: z.string().min(1).default('dev'),
    // Optional override for the built SPA directory served in production
    SPA_DIST_DIR: z.string().min(1).optional(),
    OIDC_ISSUER_URI: z.string().url().default('https://accounts.google.com'),
    // Must equal the OIDC client ID. Required in every non-test environment —
    // the app is fully auth-gated, so there is no legitimate mode that runs
    // without audience validation. NODE_ENV=test is exempt because the guard
    // bypasses OIDC entirely there (hermetic local-JWT bypass).
    OIDC_AUDIENCE: z.string().min(1).optional(),
    // Provider name used for Account records (e.g. 'google', 'authentik')
    OIDC_PROVIDER: z.string().min(1).default('google'),
    // Database driver seam (declared now; driver logic lands in GROCERUN-53)
    DB_DRIVER: z.enum(['sqlite', 'postgres']).default('sqlite'),
    // Storage driver seam (declared now; no logic yet)
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    // Local storage root when STORAGE_DRIVER=local
    STORAGE_LOCAL_FS_PATH: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'test' && !data.OIDC_AUDIENCE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OIDC_AUDIENCE'],
        message: 'is required when NODE_ENV is not "test"',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => {
      const field = issue.path.join('.');
      return `  - ${field}: ${issue.message}`;
    })
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
