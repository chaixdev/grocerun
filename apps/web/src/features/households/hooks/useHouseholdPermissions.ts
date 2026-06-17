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
  ownerId: string | null
  memberCount: number
}

export function deriveHouseholdPermissions(
  household: HouseholdForPermissions,
  userId: string,
): HouseholdPermissions {
  // When ownerId is missing from local state, conservatively treat as
  // unknown-owner: deny destructive actions until ownership is resolved.
  const ownerKnown = household.ownerId != null && household.ownerId !== ''
  const isOwner = ownerKnown && household.ownerId === userId
  const isOnlyMember = household.memberCount <= 1

  return {
    isOwner,
    isOnlyMember,
    // Only allow leave/delete when ownership is definitively known
    canLeave: ownerKnown && !isOwner,
    canDelete: isOwner && isOnlyMember,
  }
}
