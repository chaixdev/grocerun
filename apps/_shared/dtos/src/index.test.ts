/**
 * Unit tests for shared DTO Zod schemas.
 *
 * Validates that every schema:
 *   1. Accepts valid input
 *   2. Rejects missing required fields
 *   3. Rejects empty strings for non-empty fields
 *   4. Applies defaults correctly
 *   5. Rejects out-of-range numbers where applicable
 */
import { describe, it, expect } from 'vitest';
import {
  CreateListSchema,
  AddItemSchema,
  ToggleItemSchema,
  UpdateQuantitySchema,
  RemoveItemSchema,
  UpdateItemSchema,
  SearchItemsSchema,
  GetTopItemsSchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  DeleteSectionSchema,
  ReorderSectionsSchema,
  CreateStoreSchema,
  UpdateStoreSchema,
  CreateHouseholdSchema,
  UpdateHouseholdSchema,
  CreateInvitationSchema,
  JoinHouseholdSchema,
  RevokeInvitationSchema,
  UpdateProfileSchema,
} from './index';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function expectParseSuccess<T>(schema: { parse: (v: unknown) => T }, input: unknown) {
  const result = schema.parse(input);
  expect(result).toEqual(input);
}

function expectParseError(schema: { safeParse: (v: unknown) => { success: boolean } }, input: unknown) {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

describe('CreateListSchema', () => {
  it('accepts valid input with storeId', () => {
    expectParseSuccess(CreateListSchema, { storeId: 'store-1' });
  });

  it('accepts storeId without name', () => {
    const result = CreateListSchema.parse({ storeId: 'store-1' });
    expect(result.storeId).toBe('store-1');
  });

  it('rejects missing storeId', () => {
    expectParseError(CreateListSchema, {});
  });

  it('rejects empty storeId', () => {
    expectParseError(CreateListSchema, { storeId: '' });
  });
});

describe('AddItemSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(AddItemSchema, { listId: 'list-1', name: 'Milk', quantity: 2 });
  });

  it('applies default quantity of 1', () => {
    const result = AddItemSchema.parse({ listId: 'list-1', name: 'Milk' });
    expect(result.quantity).toBe(1);
  });

  it('rejects quantity below 0.1', () => {
    expectParseError(AddItemSchema, { listId: 'list-1', name: 'Milk', quantity: 0 });
  });

  it('rejects missing listId', () => {
    expectParseError(AddItemSchema, { name: 'Milk' });
  });

  it('rejects empty name', () => {
    expectParseError(AddItemSchema, { listId: 'list-1', name: '' });
  });
});

describe('ToggleItemSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(ToggleItemSchema, { listItemId: 'li-1', isChecked: true });
  });

  it('rejects missing isChecked', () => {
    expectParseError(ToggleItemSchema, { listItemId: 'li-1' });
  });

  it('rejects non-boolean isChecked', () => {
    expectParseError(ToggleItemSchema, { listItemId: 'li-1', isChecked: 'yes' });
  });
});

describe('UpdateQuantitySchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(UpdateQuantitySchema, { listItemId: 'li-1', quantity: 3 });
  });

  it('rejects quantity below 0.1', () => {
    expectParseError(UpdateQuantitySchema, { listItemId: 'li-1', quantity: 0 });
  });

  it('rejects missing listItemId', () => {
    expectParseError(UpdateQuantitySchema, { quantity: 3 });
  });
});

describe('RemoveItemSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(RemoveItemSchema, { listItemId: 'li-1' });
  });

  it('rejects empty listItemId', () => {
    expectParseError(RemoveItemSchema, { listItemId: '' });
  });
});

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

describe('UpdateItemSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(UpdateItemSchema, { itemId: 'item-1', name: 'Updated', sectionId: 'sec-1' });
  });

  it('accepts omitted sectionId', () => {
    const result = UpdateItemSchema.parse({ itemId: 'item-1', name: 'Updated' });
    expect(result.sectionId).toBeUndefined();
  });

  it('rejects missing itemId', () => {
    expectParseError(UpdateItemSchema, { name: 'Updated' });
  });

  it('rejects empty name', () => {
    expectParseError(UpdateItemSchema, { itemId: 'item-1', name: '' });
  });
});

describe('SearchItemsSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(SearchItemsSchema, { storeId: 'store-1', query: 'milk' });
  });

  it('rejects empty query', () => {
    expectParseError(SearchItemsSchema, { storeId: 'store-1', query: '' });
  });

  it('rejects missing storeId', () => {
    expectParseError(SearchItemsSchema, { query: 'milk' });
  });
});

describe('GetTopItemsSchema', () => {
  it('accepts valid input', () => {
    const result = GetTopItemsSchema.parse({ storeId: 'store-1' });
    expect(result.storeId).toBe('store-1');
    expect(result.limit).toBe(5);
    expect(result.threshold).toBe(1);
  });

  it('applies defaults for limit and threshold', () => {
    const result = GetTopItemsSchema.parse({ storeId: 'store-1' });
    expect(result.limit).toBe(5);
    expect(result.threshold).toBe(1);
  });

  it('rejects limit < 1', () => {
    expectParseError(GetTopItemsSchema, { storeId: 'store-1', limit: 0 });
  });

  it('rejects limit > 20', () => {
    expectParseError(GetTopItemsSchema, { storeId: 'store-1', limit: 21 });
  });

  it('rejects negative threshold', () => {
    expectParseError(GetTopItemsSchema, { storeId: 'store-1', threshold: -1 });
  });
});

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

describe('CreateSectionSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(CreateSectionSchema, { name: 'Dairy', storeId: 'store-1' });
  });

  it('rejects empty name', () => {
    expectParseError(CreateSectionSchema, { name: '', storeId: 'store-1' });
  });
});

describe('ReorderSectionsSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(ReorderSectionsSchema, {
      storeId: 'store-1',
      orderedIds: ['sec-1', 'sec-2'],
    });
  });

  it('rejects empty orderedIds array', () => {
    expectParseError(ReorderSectionsSchema, {
      storeId: 'store-1',
      orderedIds: [],
    });
  });

  it('rejects orderedIds with empty strings', () => {
    expectParseError(ReorderSectionsSchema, {
      storeId: 'store-1',
      orderedIds: [''],
    });
  });
});

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

describe('CreateStoreSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(CreateStoreSchema, {
      name: 'My Store',
      householdId: 'hh-1',
      location: '123 Main St',
    });
  });

  it('accepts without optional fields', () => {
    expectParseSuccess(CreateStoreSchema, { name: 'My Store', householdId: 'hh-1' });
  });

  it('rejects empty name', () => {
    expectParseError(CreateStoreSchema, { name: '', householdId: 'hh-1' });
  });

  it('rejects missing householdId', () => {
    expectParseError(CreateStoreSchema, { name: 'My Store' });
  });
});

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

describe('CreateHouseholdSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(CreateHouseholdSchema, { name: 'My Household' });
  });

  it('rejects empty name', () => {
    expectParseError(CreateHouseholdSchema, { name: '' });
  });

  it('rejects missing name', () => {
    expectParseError(CreateHouseholdSchema, {});
  });
});

describe('UpdateHouseholdSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(UpdateHouseholdSchema, { name: 'Renamed' });
  });

  it('rejects empty name', () => {
    expectParseError(UpdateHouseholdSchema, { name: '' });
  });
});

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

describe('CreateInvitationSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(CreateInvitationSchema, { householdId: 'hh-1' });
  });

  it('rejects empty householdId', () => {
    expectParseError(CreateInvitationSchema, { householdId: '' });
  });
});

describe('JoinHouseholdSchema', () => {
  it('accepts valid token', () => {
    expectParseSuccess(JoinHouseholdSchema, { token: 'ABC12345' });
  });

  it('rejects empty token', () => {
    expectParseError(JoinHouseholdSchema, { token: '' });
  });
});

describe('RevokeInvitationSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(RevokeInvitationSchema, { invitationId: 'inv-1' });
  });

  it('rejects empty invitationId', () => {
    expectParseError(RevokeInvitationSchema, { invitationId: '' });
  });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

describe('UpdateProfileSchema', () => {
  it('accepts valid input', () => {
    expectParseSuccess(UpdateProfileSchema, { name: 'New Name' });
  });

  it('rejects empty name', () => {
    expectParseError(UpdateProfileSchema, { name: '' });
  });
});
