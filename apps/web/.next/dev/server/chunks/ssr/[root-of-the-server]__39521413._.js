module.exports = [
"[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00e5bda3b02db6ad778e5cf054e48d6dfc453c7746":"getStoreDirectoryData"},"",""] */ __turbopack_context__.s([
    "getStoreDirectoryData",
    ()=>getStoreDirectoryData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function getStoreDirectoryData() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    try {
        const households = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findMany({
            where: {
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            },
            select: {
                id: true,
                name: true,
                stores: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        lists: {
                            where: {
                                status: {
                                    not: "COMPLETED"
                                }
                            },
                            orderBy: {
                                createdAt: "desc"
                            },
                            take: 1,
                            select: {
                                id: true
                            }
                        }
                    },
                    orderBy: {
                        name: "asc"
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        // Transform results to flatten activeListId
        return households.map((h)=>({
                ...h,
                stores: h.stores.map((s)=>({
                        id: s.id,
                        name: s.name,
                        location: s.location,
                        activeListId: s.lists[0]?.id || null
                    }))
            }));
    } catch (error) {
        console.error("Failed to fetch store directory data:", error);
        throw new Error("Failed to load store directory");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getStoreDirectoryData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getStoreDirectoryData, "00e5bda3b02db6ad778e5cf054e48d6dfc453c7746", null);
}),
"[project]/apps/web/src/core/schemas/store.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StoreSchema",
    ()=>StoreSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
;
const StoreSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required"),
    location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    imageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url(),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")
    ]).optional(),
    householdId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Household ID is required")
});
}),
"[project]/apps/web/src/core/schemas/household.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HouseholdSchema",
    ()=>HouseholdSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
;
const HouseholdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required")
});
}),
"[project]/apps/web/src/core/schemas/user.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProfileSchema",
    ()=>ProfileSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
;
const ProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, {
        message: "Name is required"
    }),
    image: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
}),
"[project]/apps/web/src/core/schemas/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/schemas/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/schemas/household.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/schemas/user.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Standard response type for server actions.
 * All actions should return this type for consistent error handling.
 */ __turbopack_context__.s([
    "failure",
    ()=>failure,
    "isSuccess",
    ()=>isSuccess,
    "success",
    ()=>success
]);
function success(data) {
    return {
        success: true,
        data
    };
}
function failure(error) {
    return {
        success: false,
        error
    };
}
function isSuccess(result) {
    return result.success === true;
}
}),
"[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
;
}),
"[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"003f55b1f59c8555a9baf6f149126dd839805e6731":"createDefaultHousehold","4041c7b91d43fc347bd1c53288815762c9f9e985bb":"deleteStore","405e44639ae4a2ea2bd78f89ab130c7e15394121e7":"createStore","4098b6dea3837902662443ec26ac7c624dd5044080":"getStores","40c5a54ddcafb6253c542a83665ad08d65c4dabafe":"getStore","602e6db461483c8e2728fbb5094e1c8f7a5c86dbe4":"updateStore"},"",""] */ __turbopack_context__.s([
    "createDefaultHousehold",
    ()=>createDefaultHousehold,
    "createStore",
    ()=>createStore,
    "deleteStore",
    ()=>deleteStore,
    "getStore",
    ()=>getStore,
    "getStores",
    ()=>getStores,
    "updateStore",
    ()=>updateStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/helpers.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/store-access.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/schemas/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/schemas/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
async function getStores(householdId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: session.user.id
        },
        include: {
            households: true
        }
    });
    if (!user || user.households.length === 0) return [];
    let targetHouseholdId = householdId;
    // If no specific household requested, or requested one not found in user's list
    if (!targetHouseholdId || !user.households.find((h)=>h.id === targetHouseholdId)) {
        targetHouseholdId = user.households[0]?.id;
    }
    const stores = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].store.findMany({
        where: {
            householdId: targetHouseholdId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    return stores;
}
async function createDefaultHousehold() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                id: session.user.id
            },
            include: {
                households: true
            }
        });
        if (!user) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("User not found");
        // Don't create if user already has households
        if (user.households.length > 0) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(user.households[0]);
        }
        const household = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.create({
            data: {
                name: "My Household",
                users: {
                    connect: {
                        id: session.user.id
                    }
                },
                ownerId: session.user.id
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/stores");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/households");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(household);
    } catch (error) {
        console.error("Failed to create default household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create household");
    }
}
async function createStore(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const validated = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StoreSchema"].parse(data);
        // Verify access to household
        const hasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyHouseholdAccess"])(session.user.id, validated.householdId);
        if (!hasAccess) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized access to household");
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].store.create({
            data: {
                name: validated.name,
                location: validated.location,
                householdId: validated.householdId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/stores");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to create store:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create store");
    }
}
async function deleteStore(id) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        // Verify ownership via household
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(id, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].store.delete({
            where: {
                id
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/stores");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to delete store:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to delete store");
    }
}
async function getStore(id) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return null;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(id, session.user.id);
    } catch  {
        return null;
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].store.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
            householdId: true
        }
    });
}
async function updateStore(id, data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const validated = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$schemas$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StoreSchema"].parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(id, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].store.update({
            where: {
                id
            },
            data: {
                name: validated.name,
                location: validated.location,
                imageUrl: validated.imageUrl
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/stores");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${id}/settings`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to update store:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to update store");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getStores,
    createDefaultHousehold,
    createStore,
    deleteStore,
    getStore,
    updateStore
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getStores, "4098b6dea3837902662443ec26ac7c624dd5044080", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createDefaultHousehold, "003f55b1f59c8555a9baf6f149126dd839805e6731", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createStore, "405e44639ae4a2ea2bd78f89ab130c7e15394121e7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteStore, "4041c7b91d43fc347bd1c53288815762c9f9e985bb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getStore, "40c5a54ddcafb6253c542a83665ad08d65c4dabafe", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateStore, "602e6db461483c8e2728fbb5094e1c8f7a5c86dbe4", null);
}),
"[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4002a829495177879a23dea4046887659d25bf313c":"createSection","4055671e9ea37ab018e26df1f111a3c80d30388018":"updateSection","409d8968ea2dc0076d686166c3e1c1266ddd3f0a79":"deleteSection","40b2b32cb400bf01e88db1c0aed89f0db43f65ec63":"reorderSections","40e9a4ea0552a85209230d7fa7b4e7443730e819ff":"getSections"},"",""] */ __turbopack_context__.s([
    "createSection",
    ()=>createSection,
    "deleteSection",
    ()=>deleteSection,
    "getSections",
    ()=>getSections,
    "reorderSections",
    ()=>reorderSections,
    "updateSection",
    ()=>updateSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/store-access.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const SectionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required"),
    storeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Store ID is required"),
    order: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
const UpdateSectionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "ID is required"),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required")
});
const DeleteSectionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "ID is required")
});
const ReorderSectionsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    storeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Store ID is required"),
    orderedIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)).min(1)
});
async function getSections(storeId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
    } catch  {
        return [];
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.findMany({
        where: {
            storeId
        },
        orderBy: {
            order: "asc"
        }
    });
}
async function createSection(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const validated = SectionSchema.parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(validated.storeId, session.user.id);
        // If order is provided, shift everything down
        if (validated.order !== undefined) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.updateMany({
                where: {
                    storeId: validated.storeId,
                    order: {
                        gte: validated.order
                    }
                },
                data: {
                    order: {
                        increment: 1
                    }
                }
            });
        }
        // Get max order if not provided
        let newOrder = validated.order;
        if (newOrder === undefined) {
            const lastSection = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.findFirst({
                where: {
                    storeId: validated.storeId
                },
                orderBy: {
                    order: "desc"
                }
            });
            newOrder = (lastSection?.order ?? -1) + 1;
        }
        const section = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.create({
            data: {
                name: validated.name,
                storeId: validated.storeId,
                order: newOrder
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${validated.storeId}/settings`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(section);
    } catch (error) {
        console.error("Failed to create section:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create section");
    }
}
async function updateSection(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { id, name } = UpdateSectionSchema.parse(data);
        // We need to find the storeId to verify access
        const section = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.findUnique({
            where: {
                id
            }
        });
        if (!section) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Section not found");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(section.storeId, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.update({
            where: {
                id
            },
            data: {
                name
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${section.storeId}/settings`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to update section:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to update section");
    }
}
async function deleteSection(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { id } = DeleteSectionSchema.parse(data);
        const section = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.findUnique({
            where: {
                id
            }
        });
        if (!section) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Section not found");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(section.storeId, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.delete({
            where: {
                id
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${section.storeId}/settings`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to delete section:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to delete section");
    }
}
async function reorderSections(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { storeId, orderedIds } = ReorderSectionsSchema.parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
        // Transaction to update all orders
        // Security check: verify all IDs belong to the store
        const count = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.count({
            where: {
                id: {
                    in: orderedIds
                },
                storeId: storeId
            }
        });
        if (count !== orderedIds.length) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invalid section ids for store");
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(orderedIds.map((id, index)=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].section.update({
                where: {
                    id,
                    storeId
                },
                data: {
                    order: index
                }
            })));
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${storeId}/settings`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to reorder sections:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to reorder sections");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getSections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getSections, "40e9a4ea0552a85209230d7fa7b4e7443730e819ff", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createSection, "4002a829495177879a23dea4046887659d25bf313c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateSection, "4055671e9ea37ab018e26df1f111a3c80d30388018", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteSection, "409d8968ea2dc0076d686166c3e1c1266ddd3f0a79", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(reorderSections, "40b2b32cb400bf01e88db1c0aed89f0db43f65ec63", null);
}),
"[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4041a18e25bc6b0f9e8863cf1e98f0989dfc5a0ce9":"createList","406c4e9e1a295c95eb754bafe0ca926e1e28c81909":"updateListItemQuantity","4074b0b840c256752f70d41a40db311f43aa35c23b":"getActiveListForStore","407a7473a06fe3491e67c217880dc25231749d384a":"completeList","409f0a8c3eceddcfda5282ccb0a72aa60db2395aab":"toggleListItem","40ba0097819cf6421514c5d02c364dcae5f5730227":"getLists","40c2323c53419c89d05c9e55f7b1c4ec42baa8c7b1":"cancelShopping","40e8dfaf7efbc9be6051792adc0a499d876ca83b01":"startShopping","40ed34dd3dfebae265432146f776445f86e9c179f7":"removeItemFromList","40f1e8f092b6f933a0ebced004a73c30eaa05ae561":"addItemToList","40f77fb17d45b759e06cae414c2ad139dd3f0e34ac":"getList"},"",""] */ __turbopack_context__.s([
    "addItemToList",
    ()=>addItemToList,
    "cancelShopping",
    ()=>cancelShopping,
    "completeList",
    ()=>completeList,
    "createList",
    ()=>createList,
    "getActiveListForStore",
    ()=>getActiveListForStore,
    "getList",
    ()=>getList,
    "getLists",
    ()=>getLists,
    "removeItemFromList",
    ()=>removeItemFromList,
    "startShopping",
    ()=>startShopping,
    "toggleListItem",
    ()=>toggleListItem,
    "updateListItemQuantity",
    ()=>updateListItemQuantity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/store-access.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const CreateListSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    storeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Store ID is required"),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
async function createList(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const validated = CreateListSchema.parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(validated.storeId, session.user.id);
        const existingList = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findFirst({
            where: {
                storeId: validated.storeId,
                status: {
                    not: "COMPLETED"
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        if (existingList) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(existingList);
        }
        const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.create({
            data: {
                name: validated.name || "Shopping List",
                storeId: validated.storeId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${validated.storeId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(list);
    } catch (error) {
        console.error("Failed to create list:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create list");
    }
}
async function getLists(storeId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
    } catch  {
        return [];
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findMany({
        where: {
            storeId
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            _count: {
                select: {
                    items: true
                }
            }
        }
    });
}
async function getActiveListForStore(storeId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return null;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
    } catch  {
        return null;
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findFirst({
        where: {
            storeId,
            status: {
                not: "COMPLETED"
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true
        }
    });
}
async function getList(listId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return null;
    const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findUnique({
        where: {
            id: listId
        },
        include: {
            store: {
                include: {
                    sections: {
                        orderBy: {
                            order: "asc"
                        }
                    }
                }
            },
            items: {
                orderBy: {
                    createdAt: "asc"
                },
                include: {
                    item: true
                }
            }
        }
    });
    if (!list) return null;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(list.storeId, session.user.id);
    } catch  {
        return null;
    }
    return list;
}
const AddItemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    sectionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
    quantity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0.1).default(1),
    unit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
async function addItemToList(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return {
        status: "ERROR",
        error: "Unauthorized"
    };
    try {
        const { listId, name, sectionId, quantity, unit } = AddItemSchema.parse(data);
        const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findUnique({
            where: {
                id: listId
            }
        });
        if (!list) return {
            status: "ERROR",
            error: "List not found"
        };
        if (list.status === "COMPLETED") return {
            status: "ERROR",
            error: "List is completed"
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(list.storeId, session.user.id);
        // 1. Check if item exists in catalog
        let item = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.findUnique({
            where: {
                storeId_name: {
                    storeId: list.storeId,
                    name: name
                }
            }
        });
        // 2. If item exists, add to list
        if (item) {
            // Update default unit if provided
            if (unit && unit !== item.defaultUnit) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.update({
                    where: {
                        id: item.id
                    },
                    data: {
                        defaultUnit: unit
                    }
                });
            }
            // Check if already in list
            const existingListItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.findUnique({
                where: {
                    listId_itemId: {
                        listId,
                        itemId: item.id
                    }
                }
            });
            if (existingListItem) {
                return {
                    status: "ALREADY_EXISTS"
                };
            }
            const listItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.create({
                data: {
                    listId,
                    itemId: item.id,
                    quantity,
                    unit: unit || item.defaultUnit
                },
                include: {
                    item: true
                }
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listId}`);
            return {
                status: "ADDED",
                listItem
            };
        }
        // 3. If item is new...
        // If sectionId is undefined (not provided), ask for it.
        // If sectionId is null (explicitly uncategorized) or string (categorized), create it.
        if (sectionId === undefined) {
            return {
                status: "NEEDS_SECTION"
            };
        }
        // Create item (with or without section)
        item = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.create({
            data: {
                name,
                storeId: list.storeId,
                sectionId: sectionId,
                defaultUnit: unit
            }
        });
        const listItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.create({
            data: {
                listId,
                itemId: item.id,
                quantity,
                unit
            },
            include: {
                item: true
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listId}`);
        return {
            status: "ADDED",
            listItem
        };
    } catch (error) {
        console.error("Failed to add item to list:", error);
        return {
            status: "ERROR",
            error: "Failed to add item"
        };
    }
}
const ToggleItemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    itemId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Item ID is required"),
    isChecked: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    purchasedQuantity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
async function toggleListItem(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { itemId, isChecked, purchasedQuantity } = ToggleItemSchema.parse(data);
        const listItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.findUnique({
            where: {
                id: itemId
            },
            include: {
                list: true
            }
        });
        if (!listItem) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Item not found");
        if (listItem.list.status === "COMPLETED") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List is completed");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(listItem.list.storeId, session.user.id);
        // Logic:
        // Use provided purchasedQuantity if available.
        // If checking (true) and no purchasedQuantity exists/provided, default to planned quantity.
        // If unchecking (false), we PRESERVE the purchasedQuantity (User Request).
        // Explicitly type to allow nulls from database
        let finalPurchasedQuantity = purchasedQuantity;
        if (finalPurchasedQuantity === undefined) {
            // Not provided in request.
            if (isChecked && listItem.purchasedQuantity === null) {
                // Checking, and no previous bought record -> Default to Planned
                finalPurchasedQuantity = listItem.quantity;
            } else {
                // Unchecking OR Checking-with-existing -> Keep existing
                finalPurchasedQuantity = listItem.purchasedQuantity;
            }
        }
        // Note: functionality to "Clear" purchasedQuantity is now explicit (passing null) or requires a separate action?
        // For now, checks merely confirm the status.
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.update({
            where: {
                id: itemId
            },
            data: {
                isChecked,
                purchasedQuantity: finalPurchasedQuantity
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listItem.listId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to toggle list item:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to update item");
    }
}
const RemoveItemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listItemId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Item ID is required")
});
const UpdateQuantitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listItemId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Item ID is required"),
    quantity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0.1, "Quantity must be at least 0.1"),
    unit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
async function updateListItemQuantity(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { listItemId, quantity, unit } = UpdateQuantitySchema.parse(data);
        const listItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.findUnique({
            where: {
                id: listItemId
            },
            include: {
                list: true
            }
        });
        if (!listItem) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Item not found");
        if (listItem.list.status === "COMPLETED") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List is completed");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(listItem.list.storeId, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.update({
            where: {
                id: listItemId
            },
            data: {
                quantity,
                ...unit !== undefined ? {
                    unit
                } : {}
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listItem.listId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to update item quantity:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to update quantity");
    }
}
async function removeItemFromList(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { listItemId } = RemoveItemSchema.parse(data);
        const listItem = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.findUnique({
            where: {
                id: listItemId
            },
            include: {
                list: true
            }
        });
        if (!listItem) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Item not found");
        if (listItem.list.status === "COMPLETED") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List is completed");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(listItem.list.storeId, session.user.id);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].listItem.delete({
            where: {
                id: listItemId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listItem.listId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to remove item from list:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to remove item");
    }
}
const ListIdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "List ID is required")
});
async function completeList(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { listId } = ListIdSchema.parse(data);
        const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findUnique({
            where: {
                id: listId
            },
            include: {
                items: true
            }
        });
        if (!list) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List not found");
        if (list.status === "COMPLETED") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List is already completed");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(list.storeId, session.user.id);
        // Update list status and item stats in a transaction
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            // 1. Mark list as completed
            await tx.list.update({
                where: {
                    id: listId
                },
                data: {
                    status: "COMPLETED"
                }
            });
            // 2. Update catalog stats for checked items
            const checkedItems = list.items.filter((i)=>i.isChecked);
            for (const listItem of checkedItems){
                await tx.item.update({
                    where: {
                        id: listItem.itemId
                    },
                    data: {
                        purchaseCount: {
                            increment: 1
                        },
                        lastPurchased: new Date()
                    }
                });
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${list.storeId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to complete list:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to complete list");
    }
}
async function startShopping(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { listId } = ListIdSchema.parse(data);
        const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findUnique({
            where: {
                id: listId
            }
        });
        if (!list) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List not found");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(list.storeId, session.user.id);
        if (list.status !== "PLANNING") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List must be in PLANNING state to start shopping");
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.update({
            where: {
                id: listId
            },
            data: {
                status: "SHOPPING"
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${list.storeId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to start shopping:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to start shopping");
    }
}
async function cancelShopping(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { listId } = ListIdSchema.parse(data);
        const list = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.findUnique({
            where: {
                id: listId
            }
        });
        if (!list) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List not found");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(list.storeId, session.user.id);
        if (list.status !== "SHOPPING") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("List must be in SHOPPING state to cancel");
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].list.update({
            where: {
                id: listId
            },
            data: {
                status: "PLANNING"
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists/${listId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${list.storeId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to cancel shopping:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to cancel shopping");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createList,
    getLists,
    getActiveListForStore,
    getList,
    addItemToList,
    toggleListItem,
    updateListItemQuantity,
    removeItemFromList,
    completeList,
    startShopping,
    cancelShopping
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createList, "4041a18e25bc6b0f9e8863cf1e98f0989dfc5a0ce9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getLists, "40ba0097819cf6421514c5d02c364dcae5f5730227", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getActiveListForStore, "4074b0b840c256752f70d41a40db311f43aa35c23b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getList, "40f77fb17d45b759e06cae414c2ad139dd3f0e34ac", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addItemToList, "40f1e8f092b6f933a0ebced004a73c30eaa05ae561", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(toggleListItem, "409f0a8c3eceddcfda5282ccb0a72aa60db2395aab", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateListItemQuantity, "406c4e9e1a295c95eb754bafe0ca926e1e28c81909", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(removeItemFromList, "40ed34dd3dfebae265432146f776445f86e9c179f7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(completeList, "407a7473a06fe3491e67c217880dc25231749d384a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(startShopping, "40e8dfaf7efbc9be6051792adc0a499d876ca83b01", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(cancelShopping, "40c2323c53419c89d05c9e55f7b1c4ec42baa8c7b1", null);
}),
"[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"008ba76799213423b7fe73411a337c87e7faefc40e":"getHouseholds","40d28b565555be44bb6bb196881a43b2ec71267a7f":"createHousehold","40e3caf0618feaa18dd8d9d67392207ffe06bcf71e":"deleteHousehold","40f880fd3245fe1fa24581553dc6594d4ace6f2afa":"renameHousehold","40ff448c33a1443f15509bdac88620a22f2acbd9f3":"leaveHousehold"},"",""] */ __turbopack_context__.s([
    "createHousehold",
    ()=>createHousehold,
    "deleteHousehold",
    ()=>deleteHousehold,
    "getHouseholds",
    ()=>getHouseholds,
    "leaveHousehold",
    ()=>leaveHousehold,
    "renameHousehold",
    ()=>renameHousehold
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$errors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/errors.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
const CreateHouseholdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required")
});
const RenameHouseholdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    householdId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Household ID is required"),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required").max(100, "Name must be less than 100 characters")
});
async function getHouseholds() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: session.user.id
        },
        include: {
            households: {
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    }
                }
            }
        }
    });
    return user?.households || [];
}
async function createHousehold(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const validated = CreateHouseholdSchema.parse(data);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.create({
            data: {
                ...validated,
                ownerId: session.user.id,
                users: {
                    connect: {
                        id: session.user.id
                    }
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/households");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to create household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create household");
    }
}
async function renameHousehold(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { householdId, name } = RenameHouseholdSchema.parse(data);
        const household = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findUnique({
            where: {
                id: householdId
            },
            select: {
                ownerId: true
            }
        });
        if (!household) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Household not found");
        // Only owner can rename
        if (household.ownerId && household.ownerId !== session.user.id) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Only the owner can rename the household");
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.update({
            where: {
                id: householdId
            },
            data: {
                name,
                // If it was a legacy household (no owner), claim ownership
                ...household.ownerId === null ? {
                    ownerId: session.user.id
                } : {}
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/settings");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$errors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ZodError"]) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])(error.errors[0].message);
        }
        console.error("Failed to rename household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to rename household");
    }
}
async function leaveHousehold(id) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const household = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findUnique({
            where: {
                id
            },
            select: {
                ownerId: true
            }
        });
        if (!household) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Household not found");
        if (household.ownerId === session.user.id) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Owners cannot leave their own household. Delete it instead.");
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.update({
            where: {
                id
            },
            data: {
                users: {
                    disconnect: {
                        id: session.user.id
                    }
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/settings");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/households");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to leave household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to leave household");
    }
}
async function deleteHousehold(id) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const household = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findUnique({
            where: {
                id
            },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });
        if (!household) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Household not found");
        // Verify ownership - allow if ownerId matches OR if it's a legacy household (null ownerId)
        if (household.ownerId && household.ownerId !== session.user.id) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Only the owner can delete the household");
        }
        // Verify member count
        if (household._count.users > 1) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Cannot delete household with other members. Remove them first.");
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.delete({
            where: {
                id
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/households");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/settings");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to delete household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to delete household");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getHouseholds,
    createHousehold,
    renameHousehold,
    leaveHousehold,
    deleteHousehold
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getHouseholds, "008ba76799213423b7fe73411a337c87e7faefc40e", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createHousehold, "40d28b565555be44bb6bb196881a43b2ec71267a7f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(renameHousehold, "40f880fd3245fe1fa24581553dc6594d4ace6f2afa", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(leaveHousehold, "40ff448c33a1443f15509bdac88620a22f2acbd9f3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteHousehold, "40e3caf0618feaa18dd8d9d67392207ffe06bcf71e", null);
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/apps/web/src/core/lib/rate-limit.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "rateLimit",
    ()=>rateLimit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$lru$2d$cache$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/node_modules/lru-cache/dist/esm/index.js [app-rsc] (ecmascript)");
;
function rateLimit(options) {
    const tokenCache = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$lru$2d$cache$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["LRUCache"]({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000
    });
    return {
        check: (limit, token)=>{
            const tokenCount = tokenCache.get(token) || [
                0
            ];
            if (tokenCount[0] === 0) {
                tokenCache.set(token, tokenCount);
            }
            tokenCount[0] += 1;
            const currentUsage = tokenCount[0];
            const isRateLimited = currentUsage > limit;
            return {
                isRateLimited,
                limit,
                remaining: isRateLimited ? 0 : limit - currentUsage
            };
        }
    };
}
}),
"[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40329576d9d2bdc9bb3229de057488eb1b69ae50dd":"createInvitation","40850976ecf4cac214e1ce8fcede84fe8ce87c8c9d":"joinHousehold","40d68629fa16f7c253d8a44da387edc73f3dc8d80e":"getInvitationDetails","40ef70f97eb56cca5def63fd8ec9cb8f4eda03baab":"revokeInvitation"},"",""] */ __turbopack_context__.s([
    "createInvitation",
    ()=>createInvitation,
    "getInvitationDetails",
    ()=>getInvitationDetails,
    "joinHousehold",
    ()=>joinHousehold,
    "revokeInvitation",
    ()=>revokeInvitation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/nanoid/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$app$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/config/app.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/lib/rate-limit.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
const limiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rateLimit"])({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500
});
// Use a readable alphabet for tokens (no confusing chars like 0/O, 1/l)
const generateToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["customAlphabet"])("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
const CreateInvitationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    householdId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Household ID is required")
});
async function createInvitation(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { householdId } = CreateInvitationSchema.parse(data);
        const { isRateLimited } = await limiter.check(5, session.user.id) // 5 requests per minute
        ;
        if (isRateLimited) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Rate limit exceeded. Please try again later.");
        // Verify user is a member of the household
        const membership = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findFirst({
            where: {
                id: householdId,
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            }
        });
        if (!membership) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Household not found");
        const token = generateToken();
        const expiresAt = new Date(Date.now() + __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$config$2f$app$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["appConfig"].invitation.expiresInMinutes * 60 * 1000);
        const invitation = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.create({
            data: {
                token,
                householdId,
                creatorId: session.user.id,
                expiresAt
            }
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])({
            token: invitation.token,
            expiresAt: invitation.expiresAt
        });
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to create invitation");
    }
}
const JoinHouseholdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    token: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Token is required")
});
async function joinHousehold(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { token } = JoinHouseholdSchema.parse(data);
        const invitation = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.findUnique({
            where: {
                token
            },
            include: {
                household: true
            }
        });
        if (!invitation) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invalid invitation code");
        if (invitation.status !== "ACTIVE") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("This invitation is no longer active");
        if (new Date() > invitation.expiresAt) {
            // Lazily mark as expired if we catch it here
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.update({
                where: {
                    id: invitation.id
                },
                data: {
                    status: "EXPIRED"
                }
            });
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("This invitation has expired");
        }
        // Check if user is already a member
        const existingMembership = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findFirst({
            where: {
                id: invitation.householdId,
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            }
        });
        if (existingMembership) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("You are already a member of this household");
        // Transaction: Add user to household AND mark invitation as completed
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.update({
                where: {
                    id: invitation.householdId
                },
                data: {
                    users: {
                        connect: {
                            id: session.user.id
                        }
                    }
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.update({
                where: {
                    id: invitation.id
                },
                data: {
                    status: "COMPLETED"
                }
            })
        ]);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/settings");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/households");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])({
            householdName: invitation.household.name
        });
    } catch (error) {
        console.error("Failed to join household:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to join household");
    }
}
const RevokeInvitationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    invitationId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Invitation ID is required")
});
async function revokeInvitation(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { invitationId } = RevokeInvitationSchema.parse(data);
        const invitation = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.findUnique({
            where: {
                id: invitationId
            },
            include: {
                household: {
                    include: {
                        users: true
                    }
                }
            }
        });
        if (!invitation) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invitation not found");
        // Check if user is authorized to revoke (must be member of household)
        const isMember = invitation.household.users.some((u)=>u.id === session?.user?.id);
        if (!isMember) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.update({
            where: {
                id: invitationId
            },
            data: {
                status: "REVOKED"
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/settings");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(undefined);
    } catch (error) {
        console.error("Failed to revoke invitation:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to revoke invitation");
    }
}
const GetInvitationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    token: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Token is required")
});
async function getInvitationDetails(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { token } = GetInvitationSchema.parse(data);
        const invitation = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].invitation.findUnique({
            where: {
                token
            },
            include: {
                household: {
                    include: {
                        owner: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                creator: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!invitation) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invalid invitation code");
        if (invitation.status !== "ACTIVE") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invitation is not active");
        if (new Date() > invitation.expiresAt) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Invitation has expired");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])({
            householdName: invitation.household.name,
            ownerName: invitation.household.owner?.name || "Unknown",
            creatorName: invitation.creator.name || "Unknown"
        });
    } catch (error) {
        console.error("Failed to get invitation details:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to fetch invitation details");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createInvitation,
    joinHousehold,
    revokeInvitation,
    getInvitationDetails
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createInvitation, "40329576d9d2bdc9bb3229de057488eb1b69ae50dd", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(joinHousehold, "40850976ecf4cac214e1ce8fcede84fe8ce87c8c9d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(revokeInvitation, "40ef70f97eb56cca5def63fd8ec9cb8f4eda03baab", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getInvitationDetails, "40d68629fa16f7c253d8a44da387edc73f3dc8d80e", null);
}),
"[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"401439751795b4c368562d84c9c503a8910e618b4b":"getTopItemsForStore","403353d488a1e0f7ca3d84111bb07ab6b457478492":"searchItems","406cb983a19dac8b15cd9441c0cf320e48546f598b":"updateItem"},"",""] */ __turbopack_context__.s([
    "getTopItemsForStore",
    ()=>getTopItemsForStore,
    "searchItems",
    ()=>searchItems,
    "updateItem",
    ()=>updateItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/auth/store-access.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/db/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/core/types/action-result.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
const UpdateItemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    itemId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Item ID is required"),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required"),
    sectionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    defaultUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
async function updateItem(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { itemId, name, sectionId, defaultUnit } = UpdateItemSchema.parse(data);
        // 1. Get storeId from item
        const item = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.findUnique({
            where: {
                id: itemId
            },
            select: {
                storeId: true
            }
        });
        if (!item) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Item not found");
        // 2. Verify access
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(item.storeId, session.user.id);
        // 3. Update the item
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.update({
            where: {
                id: itemId
            },
            data: {
                name,
                sectionId,
                defaultUnit: defaultUnit || null
            }
        });
        // Revalidate list pages that may display this item
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/lists`, "layout");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/stores/${item.storeId}`);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])({
            status: "UPDATED"
        });
    } catch (error) {
        console.error("Failed to update item:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to update item");
    }
}
// --- GRO-13: Autocomplete Actions ---
const SearchItemsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    storeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Store ID is required"),
    query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
async function searchItems(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { storeId, query } = SearchItemsSchema.parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
        // SQLite doesn't support case-insensitive mode in Prisma, use raw query
        // Build the LIKE pattern before passing to tagged template
        const likePattern = `%${query}%`;
        const items = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$queryRaw`
            SELECT id, name, sectionId, defaultUnit, purchaseCount
            FROM Item
            WHERE storeId = ${storeId}
              AND LOWER(name) LIKE LOWER(${likePattern})
            ORDER BY purchaseCount DESC, name ASC
            LIMIT 10
        `;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(items);
    } catch (error) {
        console.error("Failed to search items:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to search items");
    }
}
const GetTopItemsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    storeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Store ID is required"),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(20).default(5),
    threshold: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).default(1)
});
async function getTopItemsForStore(data) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Unauthorized");
    try {
        const { storeId, limit, threshold } = GetTopItemsSchema.parse(data);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$store$2d$access$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyStoreAccess"])(storeId, session.user.id);
        const items = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].item.findMany({
            where: {
                storeId,
                purchaseCount: {
                    gte: threshold
                }
            },
            orderBy: {
                purchaseCount: "desc"
            },
            take: limit,
            select: {
                id: true,
                name: true,
                sectionId: true,
                defaultUnit: true,
                purchaseCount: true
            }
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["success"])(items);
    } catch (error) {
        console.error("Failed to get top items:", error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$types$2f$action$2d$result$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["failure"])("Failed to get top items");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateItem,
    searchItems,
    getTopItemsForStore
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateItem, "406cb983a19dac8b15cd9441c0cf320e48546f598b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(searchItems, "403353d488a1e0f7ca3d84111bb07ab6b457478492", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getTopItemsForStore, "401439751795b4c368562d84c9c503a8910e618b4b", null);
}),
"[project]/apps/web/.next-internal/server/app/stores/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE5 => \"[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE6 => \"[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2d$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/apps/web/.next-internal/server/app/stores/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE5 => \"[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE6 => \"[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "003f55b1f59c8555a9baf6f149126dd839805e6731",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createDefaultHousehold"],
    "00e5bda3b02db6ad778e5cf054e48d6dfc453c7746",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2d$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoreDirectoryData"],
    "4002a829495177879a23dea4046887659d25bf313c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSection"],
    "401439751795b4c368562d84c9c503a8910e618b4b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTopItemsForStore"],
    "40329576d9d2bdc9bb3229de057488eb1b69ae50dd",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createInvitation"],
    "403353d488a1e0f7ca3d84111bb07ab6b457478492",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["searchItems"],
    "4041a18e25bc6b0f9e8863cf1e98f0989dfc5a0ce9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createList"],
    "4041c7b91d43fc347bd1c53288815762c9f9e985bb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteStore"],
    "4055671e9ea37ab018e26df1f111a3c80d30388018",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateSection"],
    "405e44639ae4a2ea2bd78f89ab130c7e15394121e7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"],
    "406c4e9e1a295c95eb754bafe0ca926e1e28c81909",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateListItemQuantity"],
    "406cb983a19dac8b15cd9441c0cf320e48546f598b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateItem"],
    "407a7473a06fe3491e67c217880dc25231749d384a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["completeList"],
    "40850976ecf4cac214e1ce8fcede84fe8ce87c8c9d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["joinHousehold"],
    "409d8968ea2dc0076d686166c3e1c1266ddd3f0a79",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSection"],
    "409f0a8c3eceddcfda5282ccb0a72aa60db2395aab",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toggleListItem"],
    "40b2b32cb400bf01e88db1c0aed89f0db43f65ec63",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reorderSections"],
    "40c2323c53419c89d05c9e55f7b1c4ec42baa8c7b1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cancelShopping"],
    "40d28b565555be44bb6bb196881a43b2ec71267a7f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createHousehold"],
    "40d68629fa16f7c253d8a44da387edc73f3dc8d80e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getInvitationDetails"],
    "40e3caf0618feaa18dd8d9d67392207ffe06bcf71e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteHousehold"],
    "40e8dfaf7efbc9be6051792adc0a499d876ca83b01",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["startShopping"],
    "40ed34dd3dfebae265432146f776445f86e9c179f7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeItemFromList"],
    "40f1e8f092b6f933a0ebced004a73c30eaa05ae561",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addItemToList"],
    "40f880fd3245fe1fa24581553dc6594d4ace6f2afa",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["renameHousehold"],
    "40ff448c33a1443f15509bdac88620a22f2acbd9f3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["leaveHousehold"],
    "602e6db461483c8e2728fbb5094e1c8f7a5c86dbe4",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateStore"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$stores$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2d$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE5__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE6__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/apps/web/.next-internal/server/app/stores/page/actions.js { ACTIONS_MODULE0 => "[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)", ACTIONS_MODULE5 => "[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)", ACTIONS_MODULE6 => "[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2d$directory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/store-directory.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$section$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/section.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$household$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/household.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$invitation$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/invitation.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__39521413._.js.map