import { describe, it, expect } from 'vitest'
import { deriveHouseholdPermissions, type HouseholdForPermissions } from '../useHouseholdPermissions'

const userId = 'user-1'

function hh(overrides: Partial<HouseholdForPermissions> = {}): HouseholdForPermissions {
  return { ownerId: 'user-1', memberCount: 1, ...overrides }
}

describe('deriveHouseholdPermissions', () => {
  describe('owner + solo member', () => {
    const perms = deriveHouseholdPermissions(hh(), userId)

    it('isOwner is true', () => { expect(perms.isOwner).toBe(true) })
    it('isOnlyMember is true', () => { expect(perms.isOnlyMember).toBe(true) })
    it('canLeave is false (owner cannot leave)', () => { expect(perms.canLeave).toBe(false) })
    it('canDelete is true', () => { expect(perms.canDelete).toBe(true) })
  })

  describe('owner + multiple members', () => {
    const perms = deriveHouseholdPermissions(hh({ memberCount: 3 }), userId)

    it('isOwner is true', () => { expect(perms.isOwner).toBe(true) })
    it('isOnlyMember is false', () => { expect(perms.isOnlyMember).toBe(false) })
    it('canLeave is false (owner cannot leave)', () => { expect(perms.canLeave).toBe(false) })
    it('canDelete is false (has other members)', () => { expect(perms.canDelete).toBe(false) })
  })

  describe('non-owner member', () => {
    const perms = deriveHouseholdPermissions(
      hh({ ownerId: 'user-2', memberCount: 2 }),
      userId,
    )

    it('isOwner is false', () => { expect(perms.isOwner).toBe(false) })
    it('isOnlyMember is false', () => { expect(perms.isOnlyMember).toBe(false) })
    it('canLeave is true (non-owner can leave)', () => { expect(perms.canLeave).toBe(true) })
    it('canDelete is false (non-owner cannot delete)', () => { expect(perms.canDelete).toBe(false) })
  })

  describe('non-owner solo member (only member is not the owner)', () => {
    const perms = deriveHouseholdPermissions(
      hh({ ownerId: 'user-2', memberCount: 1 }),
      userId,
    )

    it('isOwner is false', () => { expect(perms.isOwner).toBe(false) })
    it('isOnlyMember is true (only 1 member total)', () => { expect(perms.isOnlyMember).toBe(true) })
    it('canLeave is true', () => { expect(perms.canLeave).toBe(true) })
    it('canDelete is false (not the owner)', () => { expect(perms.canDelete).toBe(false) })
  })

  describe('non-owner + single member canLeave is true', () => {
    it('non-owner can always leave', () => {
      const perms = deriveHouseholdPermissions(
        { ownerId: 'other', memberCount: 1 },
        userId,
      )
      expect(perms.canLeave).toBe(true)
    })
  })

  describe('ownerId null/empty fallback', () => {
    it('treats empty ownerId as non-owner', () => {
      const perms = deriveHouseholdPermissions(
        { ownerId: '', memberCount: 1 },
        userId,
      )
      expect(perms.isOwner).toBe(false)
      expect(perms.canLeave).toBe(true)
    })
  })
})
