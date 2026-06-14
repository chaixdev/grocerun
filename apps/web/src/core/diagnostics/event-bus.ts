/**
 * Diagnostics event bus for sync debugging.
 *
 * A simple typed pub/sub that the RxDB replication layer emits into and the
 * diagnostics overlay subscribes to. The bus exists as a singleton regardless
 * of whether the overlay is visible — emitting into an empty bus is a no-op.
 *
 * All timestamps are `Date.now()` for minimal overhead.
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type SseState = 'connecting' | 'open' | 'closed' | 'error'

export type DiagnosticEvent =
  | { type: 'sse'; state: SseState; at: number }
  | {
      type: 'pull'
      collection: string
      status: number
      docCount: number
      checkpoint: { id: string; updatedAt: string } | null
      durationMs: number
      error?: string
      at: number
    }
  | {
      type: 'push'
      collection: string
      status: number
      rowCount: number
      conflictCount: number
      durationMs: number
      error?: string
      at: number
    }
  | { type: 'auth'; hasToken: boolean; expiresAt: number | null; userId: string | null; at: number }
  | { type: 'resync'; source: 'sse' | 'visibility' | 'periodic' | 'manual'; at: number }

// ---------------------------------------------------------------------------
// Bus
// ---------------------------------------------------------------------------

type Listener = (event: DiagnosticEvent) => void

const listeners = new Set<Listener>()

/** Emit a diagnostic event. No-op if nobody is listening. */
export function emitDiagnostic(event: DiagnosticEvent) {
  for (const fn of listeners) {
    try {
      fn(event)
    } catch {
      // Never let a listener crash the sync layer.
    }
  }
}

/** Subscribe to diagnostic events. Returns an unsubscribe function. */
export function onDiagnostic(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
