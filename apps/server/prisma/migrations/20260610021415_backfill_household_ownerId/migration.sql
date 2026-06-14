-- Backfill null ownerId for legacy households.
-- Assign the first household member as the owner.
UPDATE "Household"
SET "ownerId" = (
  SELECT "B" FROM "_HouseholdToUser" WHERE "A" = "Household"."id" LIMIT 1
)
WHERE "ownerId" IS NULL;
