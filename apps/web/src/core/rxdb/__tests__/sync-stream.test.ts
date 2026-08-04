import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import type { RxReplicationPullStreamItem } from 'rxdb';
import { handleSyncChangedPayload, openSharedSyncStream, registerPullStream } from '../database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StreamItem = RxReplicationPullStreamItem<any, any>;

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

  it('broadcasts to all pull streams on malformed, empty or missing collections', () => {
    handleSyncChangedPayload('not-json');
    handleSyncChangedPayload('{"collections":[]}');
    handleSyncChangedPayload('{"reason":"mutation"}');
    expect(listSubject.next).toHaveBeenCalledTimes(3);
    expect(storeSubject.next).toHaveBeenCalledTimes(3);
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
