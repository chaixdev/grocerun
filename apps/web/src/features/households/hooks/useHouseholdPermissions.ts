/**
 * Synchronous derivation of household permission flags from RxDB state.
 *
 * Permissions are derived from local RxDB household documents (ownerId, memberCount)
 * and the current user ID. No async fetch — no loading state.
 *
 * The backend independently validates the same rules at the API boundary.
 */
export interface HouseholdPermissions {
  isOwner: boolean
  isOnlyMember: boolean
  canLeave: boolean
  canDelete: boolean
}

export interface HouseholdForPermissions {
  ownerId: string
  memberCount: number
}

export function deriveHouseholdPermissions(
  household: HouseholdForPermissions,
  userId: string,
): HouseholdPermissions {
  const isOwner = household.ownerId === userId
  const isOnlyMember = household.memberCount <= 1

  return {
    isOwner,
    isOnlyMember,
    // Non-owners can always leave
    canLeave: !isOwner,
    // Only owner of solo-member household can delete
    canDelete: isOwner && isOnlyMember,
  }
}
