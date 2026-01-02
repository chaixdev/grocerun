import { prisma } from "../src/lib/prisma"
import { updateItem } from "../src/actions/item"
import { createList, addItemToList } from "../src/actions/list"

// Mock auth
jest.mock("@/auth", () => ({
    auth: jest.fn().mockResolvedValue({ user: { id: "user-1" } }),
}))

async function verifyGRO11() {
    console.log("Starting GRO-11 Verification...")

    // 1. Setup: Create Store, Section, List
    const store = await prisma.store.create({
        data: {
            name: "Test Store GRO-11",
            members: { create: { userId: "user-1", role: "OWNER" } },
            sections: {
                create: [
                    { name: "Produce", order: 0 },
                    { name: "Dairy", order: 1 }
                ]
            }
        },
        include: { sections: true }
    })
    const produceSection = store.sections.find(s => s.name === "Produce")!
    const dairySection = store.sections.find(s => s.name === "Dairy")!

    const list = await createList({ storeId: store.id })
    console.log("List created:", list.id)

    // 2. Add Item (initially in Produce)
    const addResult = await addItemToList({
        listId: list.id,
        name: "Test Apple",
        sectionId: produceSection.id
    })
    if (addResult.status !== "ADDED") throw new Error("Failed to add item")

    // Get the item ID (need to query DB as addItemToList returns status)
    const listItem = await prisma.listItem.findFirst({
        where: { listId: list.id, item: { name: "Test Apple" } },
        include: { item: true }
    })
    const itemId = listItem!.item.id
    console.log("Item added:", itemId)

    // 3. Update Item: Change Name and Section (to Dairy)
    console.log("Updating item...")
    await updateItem({
        itemId: itemId,
        name: "Green Apple",
        sectionId: dairySection.id,
        defaultUnit: "kg"
    })

    // 4. Verify Update
    const updatedItem = await prisma.item.findUnique({
        where: { id: itemId }
    })

    if (updatedItem?.name !== "Green Apple") throw new Error("Name update failed")
    if (updatedItem?.sectionId !== dairySection.id) throw new Error("Section update failed")
    if (updatedItem?.defaultUnit !== "kg") throw new Error("Default unit update failed")

    console.log("GRO-11 Verification Passed! ✅")

    // Cleanup
    await prisma.listItem.deleteMany({ where: { listId: list.id } })
    await prisma.list.delete({ where: { id: list.id } })
    await prisma.item.delete({ where: { id: itemId } })
    await prisma.section.deleteMany({ where: { storeId: store.id } })
    await prisma.storeMember.deleteMany({ where: { storeId: store.id } })
    await prisma.store.delete({ where: { id: store.id } })
}

verifyGRO11().catch(console.error)
