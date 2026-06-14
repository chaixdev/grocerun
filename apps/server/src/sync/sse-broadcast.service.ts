import { Injectable } from '@nestjs/common';
import { Response } from 'express';

/**
 * Manages open SSE connections and broadcasts RESYNC events.
 *
 * Connections are keyed by userId. When a mutation happens, callers
 * provide the list of userIds that should be notified (typically all
 * members of the affected household).
 *
 * This is an in-memory, single-process implementation. For multi-process
 * deployments, replace with Redis pub/sub or similar.
 */
@Injectable()
export class SseBroadcastService {
  // userId -> Set of open SSE Response objects
  private connections = new Map<string, Set<Response>>();

  /**
   * Register an SSE connection for a user. Returns a cleanup function
   * to call when the connection closes.
   */
  register(userId: string, res: Response): () => void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);

    return () => {
      const set = this.connections.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.connections.delete(userId);
        }
      }
    };
  }

  /**
   * Send a RESYNC event to all open SSE connections for the given userIds.
   */
  notify(userIds: string[]) {
    for (const userId of userIds) {
      const set = this.connections.get(userId);
      if (!set) continue;
      for (const res of set) {
        res.write(`event: RESYNC\ndata: {}\n\n`);
      }
    }
  }

  notifyHouseholdRemoved(userIds: string[], householdId: string) {
    const payload = JSON.stringify({ householdId });
    for (const userId of userIds) {
      const set = this.connections.get(userId);
      if (!set) continue;
      for (const res of set) {
        res.write(`event: HOUSEHOLD_REMOVED\ndata: ${payload}\n\n`);
      }
    }
  }
}
