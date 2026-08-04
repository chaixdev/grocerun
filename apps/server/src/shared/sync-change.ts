/**
 * Replicated document types named in SYNC_CHANGED event payloads.
 *
 * A manifest is a correctness contract: every collection whose documents can
 * be changed by an operation must be named so connected clients pull its
 * canonical server state.
 */
export const SYNC_COLLECTIONS = [
  'household',
  'store',
  'section',
  'item',
  'list',
  'listItem',
] as const;

export type SyncCollection = (typeof SYNC_COLLECTIONS)[number];

export const SYNC_CHANGE = {
  household: ['household'],
  householdCascade: SYNC_COLLECTIONS,
  store: ['store'],
  storeCascade: ['store', 'section', 'item', 'list', 'listItem'],
  section: ['section'],
  sectionWithItemReassignment: ['section', 'item'],
  item: ['item'],
  list: ['list'],
  listItem: ['listItem'],
  listItemWithItem: ['item', 'listItem'],
  completedList: ['list', 'item', 'listItem'],
} as const satisfies Record<string, readonly SyncCollection[]>;
