import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import type { RxReplicationPullStreamItem } from 'rxdb';
import { handleSyncChangedPayload, openSharedSyncStream, registerPullStream } from '../database';
import { onDiagnostic } from '../../diagnostics/event-bus';

type StreamItem = RxReplicationPullStreamItem<
  { id: string; updatedAt: string },
  { id: string; updatedAt: string }
>;

function makeSubject(): Subject<StreamItem> {
  const subject = new Subject<StreamItem>();
  vi.spyOn(subject, 'next');
  return subject;
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  close = vi.fn();
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Array<(event: Event) => void>>();

  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener = vi.fn((type: string, listener: (event: Event) => void) => {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  });

  emit(type: string, event = new Event(type)) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

beforeEach(() => {
  sessionStorage.setItem('__grocerun_test_token__', 'test-token');
  FakeEventSource.instances = [];
  globalThis.EventSource = FakeEventSource as unknown as typeof EventSource;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('handleSyncChangedPayload', () => {
  let listSubject: Subject<StreamItem>;
  let storeSubject: Subject<StreamItem>;

  beforeEach(() => {
    listSubject = makeSubject();
    storeSubject = makeSubject();
    registerPullStream('list', listSubject);
    registerPullStream('store', storeSubject);
  });

  it('routes SYNC_CHANGED collections to the matching pull stream only', () => {
    handleSyncChangedPayload('{"collections":["list"]}');
    expect(listSubject.next).toHaveBeenCalledWith('RESYNC');
    expect(storeSubject.next).not.toHaveBeenCalled();
  });

  it('broadcasts to all pull streams and emits an SSE error on malformed, empty or missing collections', () => {
    const diagnostics: Array<{ type: string; state?: string }> = []
    const unsubscribe = onDiagnostic((event) => diagnostics.push(event))

    handleSyncChangedPayload('not-json');
    handleSyncChangedPayload('{"collections":[]}');
    handleSyncChangedPayload('{"reason":"mutation"}');
    expect(listSubject.next).toHaveBeenCalledTimes(3);
    expect(storeSubject.next).toHaveBeenCalledTimes(3);
    expect(diagnostics).toHaveLength(3)
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'sse', state: 'error' }),
        expect.objectContaining({ type: 'sse', state: 'error' }),
        expect.objectContaining({ type: 'sse', state: 'error' }),
      ]),
    )
    unsubscribe()
  });

  it('broadcasts to all streams when a collection is unknown or has no registered stream', () => {
    const diagnostics: Array<{ type: string; state?: string }> = []
    const unsubscribe = onDiagnostic((event) => diagnostics.push(event))

    handleSyncChangedPayload('{"collections":["unknown"]}');
    handleSyncChangedPayload('{"collections":["section"]}');

    expect(listSubject.next).toHaveBeenCalledTimes(2);
    expect(storeSubject.next).toHaveBeenCalledTimes(2);
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'sse', state: 'error' }),
        expect.objectContaining({ type: 'sse', state: 'error' }),
      ]),
    )
    unsubscribe()
  });

  it('re-registering a stream replaces the prior registration without affecting others', () => {
    const firstList = makeSubject();
    const secondList = makeSubject();
    registerPullStream('list', firstList);
    registerPullStream('list', secondList);
    registerPullStream('store', storeSubject);

    handleSyncChangedPayload('{"collections":["list"]}');
    expect(secondList.next).toHaveBeenCalledWith('RESYNC');
    expect(firstList.next).not.toHaveBeenCalled();
    expect(storeSubject.next).not.toHaveBeenCalled();
  });
});

describe('shared sync stream heartbeat', () => {
  it('keeps an otherwise-idle healthy stream open when HEARTBEAT events arrive', async () => {
    vi.useFakeTimers();

    await openSharedSyncStream('/api/v1/sync/stream');
    const source = FakeEventSource.instances.at(-1)!;
    source.emit('open');

    await vi.advanceTimersByTimeAsync(15_000);
    source.emit('HEARTBEAT');

    await vi.advanceTimersByTimeAsync(19_999);
    expect(source.close).not.toHaveBeenCalled();
  });
});
