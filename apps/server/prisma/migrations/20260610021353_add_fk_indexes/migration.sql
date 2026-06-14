-- CreateIndex
CREATE INDEX "Store_householdId_idx" ON "Store"("householdId");

-- CreateIndex
CREATE INDEX "Section_storeId_idx" ON "Section"("storeId");

-- CreateIndex
CREATE INDEX "Item_storeId_idx" ON "Item"("storeId");

-- CreateIndex
CREATE INDEX "Item_sectionId_idx" ON "Item"("sectionId");

-- CreateIndex
CREATE INDEX "List_storeId_idx" ON "List"("storeId");

-- CreateIndex
CREATE INDEX "ListItem_listId_idx" ON "ListItem"("listId");

-- CreateIndex
CREATE INDEX "ListItem_itemId_idx" ON "ListItem"("itemId");
