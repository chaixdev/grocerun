-- DropIndex
DROP INDEX "Item_storeId_name_key";

-- DropIndex
DROP INDEX "ListItem_listId_itemId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Item_storeId_name_deleted_key" ON "Item"("storeId", "name", "deleted");

-- CreateIndex
CREATE UNIQUE INDEX "ListItem_listId_itemId_deleted_key" ON "ListItem"("listId", "itemId", "deleted");
