// ---------------------------------------------------------------------------
// RxDB Replication Protocol Types
// ---------------------------------------------------------------------------
// These types match the RxDB replication protocol contract exactly.
// See: https://rxdb.info/replication.html

export interface SyncCheckpoint {
  id: string;
  updatedAt: string; // ISO-8601
}

export interface SyncDocument {
  id: string;
  updatedAt: string; // ISO-8601 — server-assigned, client clocks are untrusted
  _deleted: boolean; // RxDB tombstone field
  [key: string]: unknown;
}

export interface PullResponse {
  documents: SyncDocument[];
  checkpoint: SyncCheckpoint | null;
}

// Each push row contains what the client believes the server state is
// (assumedMasterState) plus the new state they want to write (newDocumentState).
export interface PushRow {
  newDocumentState: SyncDocument;
  assumedMasterState?: SyncDocument | null; // null/undefined = client believes record is new
}

// Push response: array of conflicting master states.
// Empty array = all rows accepted.
export type PushResponse = SyncDocument[];
