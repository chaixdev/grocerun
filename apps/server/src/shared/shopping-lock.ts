/**
 * Pure-function shopping-lock check used by both REST endpoints (which throw)
 * and sync push handlers (which produce tombstone conflicts).
 */
export type LockResult =
  | { allowed: true }
  | { allowed: false; reason: 'COMPLETED' | 'LOCKED_BY_OTHER' | 'MISSING_LOCK' }

export function checkShoppingLock(
  list: { status: string; assignedTo?: string | null },
  lockId: string,
): LockResult {
  if (list.status === 'COMPLETED') {
    return { allowed: false, reason: 'COMPLETED' }
  }
  if (list.status !== 'SHOPPING') {
    return { allowed: true }
  }
  if (!list.assignedTo) {
    return { allowed: false, reason: 'MISSING_LOCK' }
  }
  if (list.assignedTo !== lockId) {
    return { allowed: false, reason: 'LOCKED_BY_OTHER' }
  }
  return { allowed: true }
}
