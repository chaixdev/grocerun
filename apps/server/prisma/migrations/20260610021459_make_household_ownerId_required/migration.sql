-- Make Household.ownerId NOT NULL (was nullable).
-- Backfill migration (20260610021415) ensured no NULL values remain.
-- SQLite requires table recreation for ALTER COLUMN changes.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Household" ("createdAt", "deleted", "deletedAt", "id", "name", "ownerId", "updatedAt")
  SELECT "createdAt", "deleted", "deletedAt", "id", "name", "ownerId", "updatedAt" FROM "Household";
DROP TABLE "Household";
ALTER TABLE "new_Household" RENAME TO "Household";
CREATE INDEX "Household_ownerId_idx" ON "Household"("ownerId");
CREATE INDEX "Household_updatedAt_id_idx" ON "Household"("updatedAt", "id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
