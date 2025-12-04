import { prisma } from "@/lib/prisma"

export async function verifyHouseholdAccess(userId: string, householdId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { households: { where: { id: householdId } } },
    })

    return user?.households.length === 1
}

export async function verifyStoreAccess(userId: string, storeId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            households: {
                where: {
                    stores: { some: { id: storeId } }
                }
            }
        }
    })

    return user?.households.length === 1
}
