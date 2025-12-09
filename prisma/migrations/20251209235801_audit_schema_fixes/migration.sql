-- CreateIndex
CREATE INDEX "Item_purchaseCount_idx" ON "Item"("purchaseCount");

-- CreateIndex
CREATE INDEX "Item_storeId_purchaseCount_idx" ON "Item"("storeId", "purchaseCount");

-- CreateIndex
CREATE INDEX "List_status_idx" ON "List"("status");

-- CreateIndex
CREATE INDEX "List_storeId_status_idx" ON "List"("storeId", "status");

-- CreateIndex
CREATE INDEX "ListItem_isChecked_idx" ON "ListItem"("isChecked");

-- CreateIndex
CREATE INDEX "ListItem_listId_isChecked_idx" ON "ListItem"("listId", "isChecked");
