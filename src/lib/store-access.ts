import { prisma } from "@/lib/prisma"

/**
 * Verifies that a user has access to a store via household membership.
 * Throws an error if the store is not found or the user is not authorized.
 * Returns the store object if successful.
 */
export async function verifyStoreAccess(storeId: string, userId: string | undefined) {
    if (!userId) {
        throw new Error("Unauthorized")
    }

    const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
            household: {
                include: { users: true }
            }
        }
    })

    if (!store) {
        throw new Error("Store not found")
    }

    const hasAccess = store.household.users.some(u => u.id === userId)
    if (!hasAccess) {
        throw new Error("Unauthorized access to store")
    }

    return store
}
