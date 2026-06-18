/**
 * Fixture builders and test utilities for web component tests.
 *
 * Provides typed factory functions for creating test data matching
 * the RxDB document shapes without importing RxDB directly.
 */
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// List fixture builders
// ---------------------------------------------------------------------------

export interface TestList {
  id: string;
  name: string;
  storeId: string;
  status: 'PLANNING' | 'SHOPPING' | 'COMPLETED';
  assignedTo: string | null;
  updatedAt: string;
}

export function buildList(overrides: Partial<TestList> = {}): TestList {
  return {
    id: 'list-1',
    name: 'Shopping List',
    storeId: 'store-1',
    status: 'PLANNING',
    assignedTo: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ListItem fixture builders
// ---------------------------------------------------------------------------

export interface TestListItem {
  id: string;
  listId: string;
  itemId: string;
  isChecked: boolean;
  quantity: number;
  unit: string | null;
  purchasedQuantity: number | null;
  createdAt: string;
  updatedAt: string;
  item: TestItem;
}

export function buildListItem(overrides: Partial<TestListItem> = {}): TestListItem {
  const { item: itemOverride, ...rest } = overrides;
  return {
    id: 'li-1',
    listId: 'list-1',
    itemId: 'item-1',
    isChecked: false,
    quantity: 1,
    unit: null,
    purchasedQuantity: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    item: itemOverride ?? buildItem(),
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Item fixture builders
// ---------------------------------------------------------------------------

export interface TestItem {
  id: string;
  name: string;
  sectionId: string | null;
  defaultUnit: string | null;
  note: string | null;
  purchaseCount?: number;
}

export function buildItem(overrides: Partial<TestItem> = {}): TestItem {
  return {
    id: 'item-1',
    name: 'Milk',
    sectionId: null,
    defaultUnit: null,
    note: null,
    purchaseCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Store fixture builders
// ---------------------------------------------------------------------------

export interface TestStore {
  id: string;
  name: string;
  householdId: string;
  location?: string | null;
  imageUrl?: string | null;
  updatedAt: string;
}

export function buildStore(overrides: Partial<TestStore> = {}): TestStore {
  return {
    id: 'store-1',
    name: 'My Store',
    householdId: 'household-1',
    location: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Household fixture builders
// ---------------------------------------------------------------------------

export interface TestHousehold {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  updatedAt: string;
}

export function buildHousehold(overrides: Partial<TestHousehold> = {}): TestHousehold {
  return {
    id: 'household-1',
    name: 'My Household',
    ownerId: 'user-1',
    memberCount: 1,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock for `useOidc` returning a specific user.
 * Import in test files: `vi.mock("@/core/lib/oidc", () => ({ useOidc: fn }))`
 */
export function mockUseOidc(sub = 'user-1') {
  return vi.fn().mockReturnValue({
    decodedIdToken: { sub },
  });
}

/**
 * Creates a mock for `toast` from sonner.
 */
export function mockToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// SuggestedItem for autocomplete tests
// ---------------------------------------------------------------------------

export interface TestSuggestedItem {
  id: string;
  name: string;
  sectionId: string | null;
  defaultUnit: string | null;
  purchaseCount: number;
}

export function buildSuggestedItem(overrides: Partial<TestSuggestedItem> = {}): TestSuggestedItem {
  return {
    id: 'item-1',
    name: 'Milk',
    sectionId: null,
    defaultUnit: 'carton',
    purchaseCount: 3,
    ...overrides,
  };
}
