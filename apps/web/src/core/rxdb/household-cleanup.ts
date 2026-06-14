import { getRxDb, resetRxDb, resyncHouseholds, resyncStores, removeHouseholdSubtreeFromLocalDb } from "./database"

/** Complete local data refresh after joining or switching households.
 *  Resets the local RxDB database and re-syncs from the server. */
export async function refreshAfterHouseholdChange(): Promise<void> {
  await resetRxDb()
  resyncHouseholds()
  resyncStores()
  await getRxDb()
}

/** Clean up stale local data after leaving a household. */
export async function cleanupAfterLeaveHousehold(householdId: string): Promise<void> {
  resyncHouseholds()
  resyncStores()
  await removeHouseholdSubtreeFromLocalDb(householdId)
}
