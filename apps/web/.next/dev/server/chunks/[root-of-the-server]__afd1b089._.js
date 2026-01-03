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
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client/runtime/client", () => require("@prisma/client/runtime/client"));

module.exports = mod;
}),
"[project]/apps/web/src/generated/prisma/internal/class.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * Please import the `PrismaClient` class from the `client.ts` file instead.
 */ __turbopack_context__.s([
    "getPrismaClientClass",
    ()=>getPrismaClientClass
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs)");
;
const config = {
    "previewFeatures": [],
    "clientVersion": "7.2.0",
    "engineVersion": "0c8ef2ce45c83248ab3df073180d5eda9e8be7a3",
    "activeProvider": "sqlite",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider      = \"prisma-client\"\n  output        = \"../src/generated/prisma\"\n  binaryTargets = [\"native\", \"linux-musl-openssl-3.0.x\"]\n}\n\ndatasource db {\n  provider = \"sqlite\"\n}\n\nmodel User {\n  id                 String       @id @default(cuid())\n  name               String?\n  email              String?      @unique\n  emailVerified      DateTime?\n  image              String?\n  accounts           Account[]\n  sessions           Session[]\n  households         Household[]\n  ownedHouseholds    Household[]  @relation(\"HouseholdOwner\")\n  invitationsCreated Invitation[]\n}\n\nmodel Household {\n  id        String   @id @default(cuid())\n  name      String\n  users     User[]\n  stores    Store[]\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  ownerId     String?\n  owner       User?        @relation(\"HouseholdOwner\", fields: [ownerId], references: [id])\n  invitations Invitation[]\n}\n\nmodel Store {\n  id          String    @id @default(cuid())\n  name        String\n  location    String?\n  imageUrl    String?\n  householdId String\n  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n  sections    Section[]\n  items       Item[]\n  lists       List[]\n}\n\nmodel Section {\n  id        String   @id @default(cuid())\n  name      String\n  order     Int      @default(0)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  storeId   String\n  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)\n  items     Item[]\n}\n\nmodel Item {\n  id            String     @id @default(cuid())\n  name          String\n  storeId       String\n  store         Store      @relation(fields: [storeId], references: [id], onDelete: Cascade)\n  sectionId     String?\n  section       Section?   @relation(fields: [sectionId], references: [id], onDelete: SetNull)\n  createdAt     DateTime   @default(now())\n  updatedAt     DateTime   @updatedAt\n  purchaseCount Int        @default(0)\n  lastPurchased DateTime?\n  defaultUnit   String?\n  listItems     ListItem[]\n\n  @@unique([storeId, name])\n  @@index([purchaseCount])\n  @@index([storeId, purchaseCount])\n}\n\nmodel List {\n  id        String     @id @default(cuid())\n  name      String     @default(\"Shopping List\")\n  storeId   String\n  store     Store      @relation(fields: [storeId], references: [id], onDelete: Cascade)\n  status    ListStatus @default(PLANNING)\n  createdAt DateTime   @default(now())\n  updatedAt DateTime   @updatedAt\n  items     ListItem[]\n\n  @@index([status])\n  @@index([storeId, status])\n}\n\nenum ListStatus {\n  PLANNING\n  SHOPPING\n  COMPLETED\n}\n\nmodel ListItem {\n  id                String   @id @default(cuid())\n  listId            String\n  list              List     @relation(fields: [listId], references: [id], onDelete: Cascade)\n  itemId            String\n  item              Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)\n  isChecked         Boolean  @default(false)\n  quantity          Float    @default(1)\n  unit              String?\n  purchasedQuantity Float?\n  createdAt         DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n\n  @@unique([listId, itemId])\n  @@index([isChecked])\n  @@index([listId, isChecked])\n}\n\nmodel Account {\n  id                String  @id @default(cuid())\n  userId            String\n  type              String\n  provider          String\n  providerAccountId String\n  refresh_token     String?\n  access_token      String?\n  expires_at        Int?\n  token_type        String?\n  scope             String?\n  id_token          String?\n  session_state     String?\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerAccountId])\n}\n\nmodel Session {\n  id           String   @id @default(cuid())\n  sessionToken String   @unique\n  userId       String\n  expires      DateTime\n  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n}\n\nmodel VerificationToken {\n  identifier String\n  token      String   @unique\n  expires    DateTime\n\n  @@unique([identifier, token])\n}\n\nmodel Invitation {\n  id          String           @id @default(cuid())\n  token       String           @unique\n  householdId String\n  household   Household        @relation(fields: [householdId], references: [id], onDelete: Cascade)\n  creatorId   String\n  creator     User             @relation(fields: [creatorId], references: [id])\n  status      InvitationStatus @default(ACTIVE)\n  expiresAt   DateTime\n  createdAt   DateTime         @default(now())\n  updatedAt   DateTime         @updatedAt\n\n  @@index([token])\n}\n\nenum InvitationStatus {\n  ACTIVE\n  COMPLETED\n  EXPIRED\n  REVOKED\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"households\",\"kind\":\"object\",\"type\":\"Household\",\"relationName\":\"HouseholdToUser\"},{\"name\":\"ownedHouseholds\",\"kind\":\"object\",\"type\":\"Household\",\"relationName\":\"HouseholdOwner\"},{\"name\":\"invitationsCreated\",\"kind\":\"object\",\"type\":\"Invitation\",\"relationName\":\"InvitationToUser\"}],\"dbName\":null},\"Household\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"users\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"HouseholdToUser\"},{\"name\":\"stores\",\"kind\":\"object\",\"type\":\"Store\",\"relationName\":\"HouseholdToStore\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"ownerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"owner\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"HouseholdOwner\"},{\"name\":\"invitations\",\"kind\":\"object\",\"type\":\"Invitation\",\"relationName\":\"HouseholdToInvitation\"}],\"dbName\":null},\"Store\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"householdId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"household\",\"kind\":\"object\",\"type\":\"Household\",\"relationName\":\"HouseholdToStore\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"sections\",\"kind\":\"object\",\"type\":\"Section\",\"relationName\":\"SectionToStore\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"Item\",\"relationName\":\"ItemToStore\"},{\"name\":\"lists\",\"kind\":\"object\",\"type\":\"List\",\"relationName\":\"ListToStore\"}],\"dbName\":null},\"Section\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"order\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"storeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"store\",\"kind\":\"object\",\"type\":\"Store\",\"relationName\":\"SectionToStore\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"Item\",\"relationName\":\"ItemToSection\"}],\"dbName\":null},\"Item\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"storeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"store\",\"kind\":\"object\",\"type\":\"Store\",\"relationName\":\"ItemToStore\"},{\"name\":\"sectionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"section\",\"kind\":\"object\",\"type\":\"Section\",\"relationName\":\"ItemToSection\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"purchaseCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"lastPurchased\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"defaultUnit\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"listItems\",\"kind\":\"object\",\"type\":\"ListItem\",\"relationName\":\"ItemToListItem\"}],\"dbName\":null},\"List\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"storeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"store\",\"kind\":\"object\",\"type\":\"Store\",\"relationName\":\"ListToStore\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"ListStatus\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"ListItem\",\"relationName\":\"ListToListItem\"}],\"dbName\":null},\"ListItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"listId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"list\",\"kind\":\"object\",\"type\":\"List\",\"relationName\":\"ListToListItem\"},{\"name\":\"itemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"item\",\"kind\":\"object\",\"type\":\"Item\",\"relationName\":\"ItemToListItem\"},{\"name\":\"isChecked\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"unit\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"purchasedQuantity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session_state\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":null},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"}],\"dbName\":null},\"VerificationToken\":{\"fields\":[{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Invitation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"householdId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"household\",\"kind\":\"object\",\"type\":\"Household\",\"relationName\":\"HouseholdToInvitation\"},{\"name\":\"creatorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"creator\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"InvitationToUser\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"InvitationStatus\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await __turbopack_context__.A("[externals]/node:buffer [external] (node:buffer, cjs, async loader)");
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async ()=>await __turbopack_context__.A("[externals]/@prisma/client/runtime/query_compiler_bg.sqlite.mjs [external] (@prisma/client/runtime/query_compiler_bg.sqlite.mjs, esm_import, async loader)"),
    getQueryCompilerWasmModule: async ()=>{
        const { wasm } = await __turbopack_context__.A("[externals]/@prisma/client/runtime/query_compiler_bg.sqlite.wasm-base64.mjs [external] (@prisma/client/runtime/query_compiler_bg.sqlite.wasm-base64.mjs, esm_import, async loader)");
        return await decodeBase64AsWasm(wasm);
    }
};
function getPrismaClientClass() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["getPrismaClient"](config);
}
}),
"[project]/apps/web/src/generated/prisma/internal/prismaNamespace.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * All exports from this file are wrapped under a `Prisma` namespace object in the client.ts file.
 * While this enables partial backward compatibility, it is not part of the stable public API.
 *
 * If you are looking for your Models, Enums, and Input Types, please import them from the respective
 * model files in the `model` directory!
 */ __turbopack_context__.s([
    "AccountScalarFieldEnum",
    ()=>AccountScalarFieldEnum,
    "AnyNull",
    ()=>AnyNull,
    "DbNull",
    ()=>DbNull,
    "Decimal",
    ()=>Decimal,
    "HouseholdScalarFieldEnum",
    ()=>HouseholdScalarFieldEnum,
    "InvitationScalarFieldEnum",
    ()=>InvitationScalarFieldEnum,
    "ItemScalarFieldEnum",
    ()=>ItemScalarFieldEnum,
    "JsonNull",
    ()=>JsonNull,
    "ListItemScalarFieldEnum",
    ()=>ListItemScalarFieldEnum,
    "ListScalarFieldEnum",
    ()=>ListScalarFieldEnum,
    "ModelName",
    ()=>ModelName,
    "NullTypes",
    ()=>NullTypes,
    "NullsOrder",
    ()=>NullsOrder,
    "PrismaClientInitializationError",
    ()=>PrismaClientInitializationError,
    "PrismaClientKnownRequestError",
    ()=>PrismaClientKnownRequestError,
    "PrismaClientRustPanicError",
    ()=>PrismaClientRustPanicError,
    "PrismaClientUnknownRequestError",
    ()=>PrismaClientUnknownRequestError,
    "PrismaClientValidationError",
    ()=>PrismaClientValidationError,
    "SectionScalarFieldEnum",
    ()=>SectionScalarFieldEnum,
    "SessionScalarFieldEnum",
    ()=>SessionScalarFieldEnum,
    "SortOrder",
    ()=>SortOrder,
    "Sql",
    ()=>Sql,
    "StoreScalarFieldEnum",
    ()=>StoreScalarFieldEnum,
    "TransactionIsolationLevel",
    ()=>TransactionIsolationLevel,
    "UserScalarFieldEnum",
    ()=>UserScalarFieldEnum,
    "VerificationTokenScalarFieldEnum",
    ()=>VerificationTokenScalarFieldEnum,
    "defineExtension",
    ()=>defineExtension,
    "empty",
    ()=>empty,
    "getExtensionContext",
    ()=>getExtensionContext,
    "join",
    ()=>join,
    "prismaVersion",
    ()=>prismaVersion,
    "raw",
    ()=>raw,
    "sql",
    ()=>sql
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs)");
;
const PrismaClientKnownRequestError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["PrismaClientKnownRequestError"];
const PrismaClientUnknownRequestError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["PrismaClientUnknownRequestError"];
const PrismaClientRustPanicError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["PrismaClientRustPanicError"];
const PrismaClientInitializationError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["PrismaClientInitializationError"];
const PrismaClientValidationError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["PrismaClientValidationError"];
const sql = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["sqltag"];
const empty = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["empty"];
const join = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["join"];
const raw = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["raw"];
const Sql = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["Sql"];
const Decimal = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["Decimal"];
const getExtensionContext = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["Extensions"].getExtensionContext;
const prismaVersion = {
    client: "7.2.0",
    engine: "0c8ef2ce45c83248ab3df073180d5eda9e8be7a3"
};
const NullTypes = {
    DbNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["NullTypes"].DbNull,
    JsonNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["NullTypes"].JsonNull,
    AnyNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["NullTypes"].AnyNull
};
const DbNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["DbNull"];
const JsonNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["JsonNull"];
const AnyNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["AnyNull"];
const ModelName = {
    User: 'User',
    Household: 'Household',
    Store: 'Store',
    Section: 'Section',
    Item: 'Item',
    List: 'List',
    ListItem: 'ListItem',
    Account: 'Account',
    Session: 'Session',
    VerificationToken: 'VerificationToken',
    Invitation: 'Invitation'
};
const TransactionIsolationLevel = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["makeStrictEnum"]({
    Serializable: 'Serializable'
});
const UserScalarFieldEnum = {
    id: 'id',
    name: 'name',
    email: 'email',
    emailVerified: 'emailVerified',
    image: 'image'
};
const HouseholdScalarFieldEnum = {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    ownerId: 'ownerId'
};
const StoreScalarFieldEnum = {
    id: 'id',
    name: 'name',
    location: 'location',
    imageUrl: 'imageUrl',
    householdId: 'householdId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
const SectionScalarFieldEnum = {
    id: 'id',
    name: 'name',
    order: 'order',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    storeId: 'storeId'
};
const ItemScalarFieldEnum = {
    id: 'id',
    name: 'name',
    storeId: 'storeId',
    sectionId: 'sectionId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    purchaseCount: 'purchaseCount',
    lastPurchased: 'lastPurchased',
    defaultUnit: 'defaultUnit'
};
const ListScalarFieldEnum = {
    id: 'id',
    name: 'name',
    storeId: 'storeId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
const ListItemScalarFieldEnum = {
    id: 'id',
    listId: 'listId',
    itemId: 'itemId',
    isChecked: 'isChecked',
    quantity: 'quantity',
    unit: 'unit',
    purchasedQuantity: 'purchasedQuantity',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
const AccountScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    type: 'type',
    provider: 'provider',
    providerAccountId: 'providerAccountId',
    refresh_token: 'refresh_token',
    access_token: 'access_token',
    expires_at: 'expires_at',
    token_type: 'token_type',
    scope: 'scope',
    id_token: 'id_token',
    session_state: 'session_state'
};
const SessionScalarFieldEnum = {
    id: 'id',
    sessionToken: 'sessionToken',
    userId: 'userId',
    expires: 'expires'
};
const VerificationTokenScalarFieldEnum = {
    identifier: 'identifier',
    token: 'token',
    expires: 'expires'
};
const InvitationScalarFieldEnum = {
    id: 'id',
    token: 'token',
    householdId: 'householdId',
    creatorId: 'creatorId',
    status: 'status',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
const NullsOrder = {
    first: 'first',
    last: 'last'
};
const defineExtension = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$29$__["Extensions"].defineExtension;
}),
"[project]/apps/web/src/generated/prisma/enums.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
* This file exports all enum related types from the schema.
*
* 🟢 You can import this file directly.
*/ __turbopack_context__.s([
    "InvitationStatus",
    ()=>InvitationStatus,
    "ListStatus",
    ()=>ListStatus
]);
const ListStatus = {
    PLANNING: 'PLANNING',
    SHOPPING: 'SHOPPING',
    COMPLETED: 'COMPLETED'
};
const InvitationStatus = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED'
};
}),
"[project]/apps/web/src/generated/prisma/client.ts [middleware] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * This file should be your main import to use Prisma. Through it you get access to all the models, enums, and input types.
 * If you're looking for something you can import in the client-side of your application, please refer to the `browser.ts` file instead.
 *
 * 🟢 You can import this file directly.
 */ __turbopack_context__.s([
    "PrismaClient",
    ()=>PrismaClient
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$internal$2f$class$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/generated/prisma/internal/class.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/generated/prisma/internal/prismaNamespace.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$enums$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/generated/prisma/enums.ts [middleware] (ecmascript)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("apps/web/src/generated/prisma/client.ts")}`;
    }
};
;
;
globalThis['__dirname'] = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"]((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"])(__TURBOPACK__import$2e$meta__.url));
;
;
;
;
const PrismaClient = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$internal$2f$class$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["getPrismaClientClass"]();
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
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$client$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/generated/prisma/client.ts [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$better$2d$sqlite3$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/adapter-better-sqlite3/dist/index.mjs [middleware] (ecmascript)");
;
;
;
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$better$2d$sqlite3$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__["PrismaBetterSqlite3"]({
    url: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].DATABASE_URL
});
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$generated$2f$prisma$2f$client$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__["PrismaClient"]({
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

//# sourceMappingURL=%5Broot-of-the-server%5D__afd1b089._.js.map