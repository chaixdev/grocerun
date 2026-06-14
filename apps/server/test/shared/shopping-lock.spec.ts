/**
 * Unit tests for checkShoppingLock
 *
 * Source: src/shared/shopping-lock.ts
 */

import { describe, it, expect } from 'vitest';
import { checkShoppingLock } from '../../src/shared/shopping-lock';

describe('checkShoppingLock', () => {
  // ---------------------------------------------------------------------------
  // Status: COMPLETED
  // ---------------------------------------------------------------------------
  it('returns COMPLETED when status is COMPLETED (regardless of assignedTo / lockId)', () => {
    expect(checkShoppingLock({ status: 'COMPLETED' }, 'any-lock')).toEqual({
      allowed: false,
      reason: 'COMPLETED',
    });
    expect(
      checkShoppingLock({ status: 'COMPLETED', assignedTo: 'someone' }, 'any-lock'),
    ).toEqual({ allowed: false, reason: 'COMPLETED' });
  });

  // ---------------------------------------------------------------------------
  // Status: not SHOPPING (and not COMPLETED) — allowed, no lock needed
  // ---------------------------------------------------------------------------
  it('returns allowed when status is PLANNING (not SHOPPING, not COMPLETED)', () => {
    expect(checkShoppingLock({ status: 'PLANNING' }, 'some-lock')).toEqual({
      allowed: true,
    });
  });

  it('returns allowed for an unexpected status like ARCHIVED', () => {
    expect(checkShoppingLock({ status: 'ARCHIVED' }, 'any-lock')).toEqual({
      allowed: true,
    });
  });

  // ---------------------------------------------------------------------------
  // Status: SHOPPING + no assignedTo — MISSING_LOCK
  // ---------------------------------------------------------------------------
  it('returns MISSING_LOCK when status is SHOPPING and assignedTo is undefined', () => {
    expect(checkShoppingLock({ status: 'SHOPPING' }, 'my-lock')).toEqual({
      allowed: false,
      reason: 'MISSING_LOCK',
    });
  });

  it('returns MISSING_LOCK when status is SHOPPING and assignedTo is null', () => {
    expect(
      checkShoppingLock({ status: 'SHOPPING', assignedTo: null }, 'my-lock'),
    ).toEqual({ allowed: false, reason: 'MISSING_LOCK' });
  });

  // ---------------------------------------------------------------------------
  // Status: SHOPPING + assignedTo !== lockId — LOCKED_BY_OTHER
  // ---------------------------------------------------------------------------
  it('returns LOCKED_BY_OTHER when status is SHOPPING and assignedTo differs from lockId', () => {
    expect(
      checkShoppingLock({ status: 'SHOPPING', assignedTo: 'other-lock' }, 'my-lock'),
    ).toEqual({ allowed: false, reason: 'LOCKED_BY_OTHER' });
  });

  it('returns MISSING_LOCK when assignedTo is empty string (falsy, same as null)', () => {
    expect(
      checkShoppingLock({ status: 'SHOPPING', assignedTo: '' }, 'my-lock'),
    ).toEqual({ allowed: false, reason: 'MISSING_LOCK' });
  });

  // ---------------------------------------------------------------------------
  // Status: SHOPPING + assignedTo === lockId — allowed
  // ---------------------------------------------------------------------------
  it('returns allowed when status is SHOPPING and assignedTo matches lockId', () => {
    expect(
      checkShoppingLock({ status: 'SHOPPING', assignedTo: 'my-lock' }, 'my-lock'),
    ).toEqual({ allowed: true });
  });
});
