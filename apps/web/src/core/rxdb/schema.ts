/**
 * RxDB JSON schemas for Phase 4 local-first collections.
 *
 * Schema versioning: bump `version` when fields change and provide a
 * migration strategy. During the PoC (Phase 4a) we start at version 0.
 *
 * `_deleted` is the RxDB tombstone field — it is managed by RxDB and the
 * replication plugin; we do NOT declare it in the schema (RxDB adds it
 * automatically via `deletedField`).
 *
 * `updatedAt` is stored as an ISO-8601 string. The pull checkpoint uses
 * (updatedAt, id) to page through results — matching the server index.
 */

import { RxJsonSchema } from 'rxdb'

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export type SectionDocType = {
  id: string
  name: string
  order: number
  storeId: string
  updatedAt: string // ISO-8601
}

export const sectionSchema: RxJsonSchema<SectionDocType> = {
  title: 'section schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 30, // cuid2 length
    },
    name: {
      type: 'string',
    },
    order: {
      type: 'number',
    },
    storeId: {
      type: 'string',
      maxLength: 30,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 30, // ISO-8601 string, e.g. "2026-03-24T00:00:00.000Z"
    },
  },
  required: ['id', 'name', 'order', 'storeId', 'updatedAt'],
  indexes: ['storeId', 'updatedAt'],
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export type ItemDocType = {
  id: string
  name: string
  storeId: string
  sectionId?: string
  defaultUnit?: string
  purchaseCount: number
  lastPurchased?: string // ISO-8601 — when this item was last purchased
  updatedAt: string // ISO-8601
}

export const itemSchema: RxJsonSchema<ItemDocType> = {
  title: 'item schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 30, // cuid2 length
    },
    name: {
      type: 'string',
    },
    storeId: {
      type: 'string',
      maxLength: 30,
    },
    sectionId: {
      type: 'string',
      maxLength: 30,
    },
    defaultUnit: {
      type: 'string',
    },
    purchaseCount: {
      type: 'number',
    },
    lastPurchased: {
      type: 'string',
      format: 'date-time',
      maxLength: 30,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 30,
    },
  },
  required: ['id', 'name', 'storeId', 'purchaseCount', 'updatedAt'],
  indexes: ['storeId', 'updatedAt'],
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListDocType = {
  id: string
  name: string
  storeId: string
  status: "PLANNING" | "SHOPPING" | "COMPLETED"
  assignedTo?: string
  updatedAt: string
}

export const listSchema: RxJsonSchema<ListDocType> = {
  title: 'list schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 30 },
    name: { type: 'string' },
    storeId: { type: 'string', maxLength: 30 },
    status: { type: 'string', enum: ['PLANNING', 'SHOPPING', 'COMPLETED'], maxLength: 20 },
    assignedTo: { type: 'string', maxLength: 30 },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: ['id', 'name', 'storeId', 'status', 'updatedAt'],
  indexes: ['storeId', 'updatedAt'],
}

// ---------------------------------------------------------------------------
// ListItem
// ---------------------------------------------------------------------------

export type ListItemDocType = {
  id: string
  listId: string
  itemId: string
  isChecked: boolean
  quantity: number
  createdAt: string
  unit?: string
  purchasedQuantity?: number
  updatedAt: string
}

export const listItemSchema: RxJsonSchema<ListItemDocType> = {
  title: 'listItem schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 30 },
    listId: { type: 'string', maxLength: 30 },
    itemId: { type: 'string', maxLength: 30 },
    isChecked: { type: 'boolean' },
    quantity: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time', maxLength: 30 },
    unit: { type: 'string' },
    purchasedQuantity: { type: 'number' },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: ['id', 'listId', 'itemId', 'isChecked', 'quantity', 'createdAt', 'updatedAt'],
  indexes: ['listId', 'updatedAt'],
}

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------

export type HouseholdDocType = {
  id: string
  name: string
  ownerId: string
  memberCount: number
  updatedAt: string
}

export const householdSchema: RxJsonSchema<HouseholdDocType> = {
  title: 'household schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 30 },
    name: { type: 'string' },
    ownerId: { type: 'string', maxLength: 30 },
    memberCount: { type: 'number' },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: ['id', 'name', 'ownerId', 'memberCount', 'updatedAt'],
  indexes: ['updatedAt'],
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type StoreDocType = {
  id: string
  name: string
  householdId: string
  location?: string
  imageUrl?: string
  updatedAt: string
}

export const storeSchema: RxJsonSchema<StoreDocType> = {
  title: 'store schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 30 },
    name: { type: 'string' },
    householdId: { type: 'string', maxLength: 30 },
    location: { type: 'string' },
    imageUrl: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: ['id', 'name', 'householdId', 'updatedAt'],
  indexes: ['householdId', 'updatedAt'],
}
