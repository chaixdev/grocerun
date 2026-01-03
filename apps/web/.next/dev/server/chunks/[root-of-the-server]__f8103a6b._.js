module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/web/src/core/config/env.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "env",
    ()=>env
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [middleware] (ecmascript) <export * as z>");
;
const envSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Database
    DATABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'DATABASE_URL is required'),
    // Auth
    AUTH_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'AUTH_SECRET is required'),
    AUTH_GOOGLE_ID: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'AUTH_GOOGLE_ID is required'),
    AUTH_GOOGLE_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'AUTH_GOOGLE_SECRET is required'),
    // Optional
    AUTH_TRUST_HOST: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_APP_VERSION: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Node
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).default('development')
});
function validateEnv() {
    // Allow skipping validation in test/build environments if needed, 
    // but strictly we want to fail fast. 
    // However, during CI build, sometimes not all secrets are present (e.g. docker build args).
    // For now, full strict validation.
    // Note: process.env is a regular object, safeParse works fine.
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
        // Don't throw during build time if we want to allow 'next build' without secrets?
        // Usually 'next build' requires database url for prisma generation maybe?
        // Let's throw.
        if ("TURBOPACK compile-time truthy", 1) {
            throw new Error('Invalid environment variables');
        }
        // Return mock values for test environment if actual env vars are missing
        return {
            DATABASE_URL: 'file:./test.db',
            AUTH_SECRET: 'test-secret',
            AUTH_GOOGLE_ID: 'test-client-id',
            AUTH_GOOGLE_SECRET: 'test-client-secret',
            NODE_ENV: 'test'
        };
    }
    return result.data;
}
const env = validateEnv();
}),
"[project]/apps/web/src/core/config/app.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appConfig",
    ()=>appConfig
]);
const appConfig = {
    invitation: {
        // Default to 24 hours (1440 minutes), but allow override via env var
        expiresInMinutes: Number(process.env.INVITATION_TIMEOUT_MINUTES) || 1440
    }
};
}),
"[project]/apps/web/src/core/config/navigation.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "navigationItems",
    ()=>navigationItems
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/store.js [middleware] (ecmascript) <export default as Store>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [middleware] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scroll$2d$text$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__ScrollText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/scroll-text.js [middleware] (ecmascript) <export default as ScrollText>");
;
const navigationItems = [
    {
        title: 'Lists',
        href: '/lists',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scroll$2d$text$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__ScrollText$3e$__["ScrollText"]
    },
    {
        title: 'Stores',
        href: '/stores',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__["Store"]
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
}),
"[project]/apps/web/src/core/config/index.ts [middleware] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/env.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$app$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/app.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$navigation$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/navigation.ts [middleware] (ecmascript)");
;
;
;
}),
"[externals]/better-sqlite3 [external] (better-sqlite3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("better-sqlite3", () => require("better-sqlite3"));

module.exports = mod;
}),
"[project]/apps/web/src/core/db/prisma.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/env.ts [middleware] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../generated/prisma/client'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$better$2d$sqlite3$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/adapter-better-sqlite3/dist/index.mjs [middleware] (ecmascript)");
;
;
;
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$better$2d$sqlite3$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__["PrismaBetterSqlite3"]({
    url: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].DATABASE_URL
});
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/apps/web/src/core/db/index.ts [middleware] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [middleware] (ecmascript)");
;
}),
"[project]/apps/web/src/core/auth/auth.config.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authConfig",
    ()=>authConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/env.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$google$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/google.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$google$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/node_modules/@auth/core/providers/google.js [middleware] (ecmascript)");
;
;
const authConfig = {
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$google$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"])({
            clientId: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].AUTH_GOOGLE_ID,
            clientSecret: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].AUTH_GOOGLE_SECRET
        })
    ],
    pages: {
        signIn: "/login"
    },
    callbacks: {
        authorized ({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            if (isLoggedIn) {
                if (nextUrl.pathname === '/login') {
                    return Response.redirect(new URL('/stores', nextUrl));
                }
            }
            return true;
        },
        async signIn ({ user, account, profile }) {
            // Ensure user exists in database for JWT strategy
            // PrismaAdapter handles this for database sessions, but with JWT we need to do it manually
            return true;
        },
        async session ({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt ({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    },
    session: {
        strategy: "jwt"
    }
};
}),
"[project]/apps/web/src/core/auth/auth.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$prisma$2d$adapter$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@auth/prisma-adapter/index.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$config$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.config.ts [middleware] (ecmascript)");
;
;
;
;
const { handlers, auth, signIn, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$config$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["authConfig"],
    adapter: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$prisma$2d$adapter$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["PrismaAdapter"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"])
});
}),
"[project]/apps/web/src/core/auth/helpers.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "verifyHouseholdAccess",
    ()=>verifyHouseholdAccess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [middleware] (ecmascript)");
;
async function verifyHouseholdAccess(userId, householdId) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        include: {
            households: {
                where: {
                    id: householdId
                }
            }
        }
    });
    return user?.households.length === 1;
}
}),
"[project]/apps/web/src/core/auth/store-access.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "verifyStoreAccess",
    ()=>verifyStoreAccess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [middleware] (ecmascript)");
;
async function verifyStoreAccess(storeId, userId) {
    if (!userId) {
        throw new Error("Unauthorized");
    }
    const store = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].store.findUnique({
        where: {
            id: storeId
        },
        include: {
            household: {
                include: {
                    users: true
                }
            }
        }
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const hasAccess = store.household.users.some((u)=>u.id === userId);
    if (!hasAccess) {
        throw new Error("Unauthorized access to store");
    }
    return store;
}
}),
"[project]/apps/web/src/core/auth/index.ts [middleware] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$config$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.config.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$helpers$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/helpers.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/store-access.ts [middleware] (ecmascript)");
;
;
;
;
}),
"[project]/apps/web/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [middleware] (ecmascript)");
;
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["auth"];
const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)"
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f8103a6b._.js.map