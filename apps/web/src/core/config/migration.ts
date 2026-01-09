/**
 * Phase 2 Migration Flags: API Proxy Layer
 * 
 * Each domain flag indicates whether to use Prisma (true) or NestJS API (false).
 * When a domain is fully migrated and tested, set its flag to false.
 * Once confident, remove the flag and old Prisma code entirely.
 * 
 * Migration Progress: 7/8 domains remaining (1 of 37 total server actions migrated)
 * 
 * @see wiki/planning/PHASE-2-MIGRATION.md for detailed checklist
 */
export const migration = {
  /** Items domain - 3 server actions */
  items: true,
  
  /** Stores domain - 5 server actions */
  stores: true,
  
  /** Sections domain - 5 server actions */
  sections: true,
  
  /** Lists domain - 11 server actions */
  lists: true,
  
  /** Households domain - 5 server actions */
  households: true,
  
  /** Users domain - 1 server action */
  users: true,
  
  /** Invitations domain - 4 server actions */
  invitations: true,
  
  /** Dashboard/Directory - 2 read-only queries */
  dashboard: true,
} as const

/**
 * Helper for cleaner usage in server actions
 */
export const usePrisma = {
  items: migration.items ?? false,
  stores: migration.stores ?? false,
  sections: migration.sections ?? false,
  lists: migration.lists ?? false,
  households: migration.households ?? false,
  users: migration.users ?? false,
  invitations: migration.invitations ?? false,
  dashboard: migration.dashboard ?? false,
} as const
