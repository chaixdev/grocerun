-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Household" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Household";
DROP TABLE "Household";
ALTER TABLE "new_Household" RENAME TO "Household";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
