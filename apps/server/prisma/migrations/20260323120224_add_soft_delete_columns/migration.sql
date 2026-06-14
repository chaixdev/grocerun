-- Add soft-delete columns to all 6 domain tables.
--
-- This migration is ADDITIVE and safe to run against an existing production
-- database. It uses ALTER TABLE ... ADD COLUMN with a DEFAULT so SQLite
-- backfills all existing rows without touching data.
--
-- SQLite requires ALTER TABLE ADD COLUMN for each column separately.
-- NULL DEFAULT is used for deletedAt (nullable timestamp).

-- Household
ALTER TABLE "Household" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Household" ADD COLUMN "deletedAt" DATETIME;

-- Store
ALTER TABLE "Store" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN "deletedAt" DATETIME;

-- Section
ALTER TABLE "Section" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Section" ADD COLUMN "deletedAt" DATETIME;

-- Item
ALTER TABLE "Item" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Item" ADD COLUMN "deletedAt" DATETIME;

-- List
ALTER TABLE "List" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "List" ADD COLUMN "deletedAt" DATETIME;

-- ListItem
ALTER TABLE "ListItem" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ListItem" ADD COLUMN "deletedAt" DATETIME;
