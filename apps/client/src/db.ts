import { createRxDatabase, RxDatabase, RxCollection, RxJsonSchema, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { userSchema, UserDocType } from './db/schema/user';
import { householdSchema, HouseholdDocType } from './db/schema/household';

// Enable dev mode for debugging
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

export type ItemDocType = {
  id: string;
  name: string;
  checked: boolean;
  updatedAt: string;
  createdAt: string;
};

export type ItemCollection = RxCollection<ItemDocType>;
export type UserCollection = RxCollection<UserDocType>;
export type HouseholdCollection = RxCollection<HouseholdDocType>;

export type MyDatabaseCollections = {
  items: ItemCollection;
  users: UserCollection;
  households: HouseholdCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

export const itemSchema: RxJsonSchema<ItemDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string'
    },
    checked: {
      type: 'boolean'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'name', 'checked', 'updatedAt', 'createdAt']
};

let dbPromise: Promise<MyDatabase> | null = null;

export const getDatabase = async (): Promise<MyDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase<MyDatabaseCollections>({
    name: 'grocerundb',
    storage: getRxStorageDexie()
  }).then(async (db) => {
    await db.addCollections({
      items: {
        schema: itemSchema
      },
      users: {
        schema: userSchema
      },
      households: {
        schema: householdSchema
      }
    });

    // Setup Replication for Items
    replicateRxCollection({
      collection: db.items,
      replicationIdentifier: 'items-sync',
      pull: {
        handler: async (checkpointOrNull) => {
            const minUpdatedAt = checkpointOrNull ? checkpointOrNull.updatedAt : undefined;
            const response = await fetch(`http://localhost:3001/items?minUpdatedAt=${minUpdatedAt || ''}`);
            const data = await response.json();
            return {
                documents: data.documents,
                checkpoint: data.checkpoint
            };
        }
      },
      push: {
        handler: async (docs) => {
            const items = docs.map(d => d.newDocumentState);
            await fetch('http://localhost:3001/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            return []; // Return conflict docs if any (none for now)
        }
      }
    });

    // Setup Replication for Users
    replicateRxCollection({
      collection: db.users,
      replicationIdentifier: 'users-sync',
      pull: {
        handler: async (checkpointOrNull) => {
            const minUpdatedAt = checkpointOrNull ? checkpointOrNull.updatedAt : undefined;
            const response = await fetch(`http://localhost:3001/users?minUpdatedAt=${minUpdatedAt || ''}`);
            const data = await response.json();
            return {
                documents: data.documents,
                checkpoint: data.checkpoint
            };
        }
      },
      push: {
        handler: async (docs) => {
            const users = docs.map(d => d.newDocumentState);
            await fetch('http://localhost:3001/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ users })
            });
            return [];
        }
      }
    });

    // Setup Replication for Households
    replicateRxCollection({
      collection: db.households,
      replicationIdentifier: 'households-sync',
      pull: {
        handler: async (checkpointOrNull) => {
            const minUpdatedAt = checkpointOrNull ? checkpointOrNull.updatedAt : undefined;
            const response = await fetch(`http://localhost:3001/households?minUpdatedAt=${minUpdatedAt || ''}`);
            const data = await response.json();
            return {
                documents: data.documents,
                checkpoint: data.checkpoint
            };
        }
      },
      push: {
        handler: async (docs) => {
            const households = docs.map(d => d.newDocumentState);
            await fetch('http://localhost:3001/households', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ households })
            });
            return [];
        }
      }
    });

    return db;
  });

  return dbPromise;
};
