module.exports = [
"[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"007ec3b90c55022c7acfdfd700ce947c7bffd9d2de":"getDashboardData"},"",""] */ __turbopack_context__.s([
    "getDashboardData",
    ()=>getDashboardData
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
async function getDashboardData() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$auth$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session?.user?.id) return [];
    try {
        // Fetch households where the user is a member
        // Include stores and their ACTIVE lists (status != 'COMPLETED')
        const households = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$core$2f$db$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].household.findMany({
            where: {
                users: {
                    some: {
                        id: session.user.id
                    }
                }
            },
            include: {
                stores: {
                    include: {
                        lists: {
                            where: {
                                status: {
                                    not: "COMPLETED"
                                }
                            },
                            orderBy: {
                                updatedAt: "desc"
                            },
                            include: {
                                _count: {
                                    select: {
                                        items: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return households;
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        throw new Error("Failed to load dashboard data");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getDashboardData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getDashboardData, "007ec3b90c55022c7acfdfd700ce947c7bffd9d2de", null);
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
"[project]/apps/web/.next-internal/server/app/lists/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$dashboard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)");
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
}),
"[project]/apps/web/.next-internal/server/app/lists/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "007ec3b90c55022c7acfdfd700ce947c7bffd9d2de",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$dashboard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDashboardData"],
    "401439751795b4c368562d84c9c503a8910e618b4b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTopItemsForStore"],
    "403353d488a1e0f7ca3d84111bb07ab6b457478492",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["searchItems"],
    "4041a18e25bc6b0f9e8863cf1e98f0989dfc5a0ce9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createList"],
    "406c4e9e1a295c95eb754bafe0ca926e1e28c81909",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateListItemQuantity"],
    "406cb983a19dac8b15cd9441c0cf320e48546f598b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateItem"],
    "407a7473a06fe3491e67c217880dc25231749d384a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["completeList"],
    "409f0a8c3eceddcfda5282ccb0a72aa60db2395aab",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toggleListItem"],
    "40c2323c53419c89d05c9e55f7b1c4ec42baa8c7b1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cancelShopping"],
    "40e8dfaf7efbc9be6051792adc0a499d876ca83b01",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["startShopping"],
    "40ed34dd3dfebae265432146f776445f86e9c179f7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeItemFromList"],
    "40f1e8f092b6f933a0ebced004a73c30eaa05ae561",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addItemToList"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$lists$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$dashboard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/apps/web/.next-internal/server/app/lists/page/actions.js { ACTIONS_MODULE0 => "[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$dashboard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/dashboard.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$list$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/list.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$actions$2f$item$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/actions/item.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=apps_web_41584cf9._.js.map