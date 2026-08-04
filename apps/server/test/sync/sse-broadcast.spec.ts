/**
 * Unit tests for SseBroadcastService notifyChanged broadcasting.
 *
 * GROCERUN-61 — SSE transport over-fetch regression tests. The three
 * behaviors covered here shipped with zero tests:
 *   1. notifyChanged reaches every registered household member
 *   2. multiple connections for the same user each receive the payload
 *   3. a user with no connection does not prevent other users from receiving
 */
import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { SseBroadcastService } from '../../src/sync/sse-broadcast.service';

function fakeResponse() {
  return { write: vi.fn() } as unknown as Response;
}

describe('SseBroadcastService.notifyChanged', () => {
  it('reaches every registered household member', () => {
    const service = new SseBroadcastService();
    const alice = fakeResponse();
    const bob = fakeResponse();
    service.register('alice', alice);
    service.register('bob', bob);

    const payload = { collections: ['list'], reason: 'list.push' };
    service.notifyChanged(['alice', 'bob'], payload);

    expect(alice.write).toHaveBeenCalledTimes(1);
    expect(bob.write).toHaveBeenCalledTimes(1);
    expect(alice.write).toHaveBeenCalledWith(
      `event: SYNC_CHANGED\ndata: ${JSON.stringify(payload)}\n\n`,
    );
    expect(bob.write).toHaveBeenCalledWith(
      `event: SYNC_CHANGED\ndata: ${JSON.stringify(payload)}\n\n`,
    );
  });

  it('reaches every connection belonging to the pushing user', () => {
    const service = new SseBroadcastService();
    const firstTab = fakeResponse();
    const secondTab = fakeResponse();
    service.register('alice', firstTab);
    service.register('alice', secondTab);

    const payload = { collections: ['item'], reason: 'item.push' };
    service.notifyChanged(['alice'], payload);

    expect(firstTab.write).toHaveBeenCalledTimes(1);
    expect(secondTab.write).toHaveBeenCalledTimes(1);
    const frame = `event: SYNC_CHANGED\ndata: ${JSON.stringify(payload)}\n\n`;
    expect(firstTab.write).toHaveBeenCalledWith(frame);
    expect(secondTab.write).toHaveBeenCalledWith(frame);
  });

  it('notifies connected users when another household member has no connection', () => {
    const service = new SseBroadcastService();
    const alice = fakeResponse();
    service.register('alice', alice);

    const payload = { collections: ['store'], reason: 'store.push' };
    service.notifyChanged(['alice', 'offline-user'], payload);

    expect(alice.write).toHaveBeenCalledTimes(1);
    expect(alice.write).toHaveBeenCalledWith(
      `event: SYNC_CHANGED\ndata: ${JSON.stringify(payload)}\n\n`,
    );
  });
});
