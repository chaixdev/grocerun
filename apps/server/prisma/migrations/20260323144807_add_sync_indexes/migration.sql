-- CreateIndex
CREATE INDEX "Household_updatedAt_id_idx" ON "Household"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "Item_updatedAt_id_idx" ON "Item"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "List_updatedAt_id_idx" ON "List"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "ListItem_updatedAt_id_idx" ON "ListItem"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "Section_updatedAt_id_idx" ON "Section"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "Store_updatedAt_id_idx" ON "Store"("updatedAt", "id");
