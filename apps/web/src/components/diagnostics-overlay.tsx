
import { useEffect, useState } from "react";
import {
  onDiagnostic,
  type DiagnosticEvent,
  type SseState,
} from "@/core/diagnostics/event-bus";

function formatAgo(ts: number, now: number): string {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 300 && status < 400) return "text-yellow-400";
  return "text-red-400";
}

function getSseColor(state: SseState) {
  if (state === "open") return "text-green-400";
  if (state === "connecting") return "text-yellow-400";
  return "text-red-400";
}

type PullEvent = Extract<DiagnosticEvent, { type: "pull" }>;
type PushEvent = Extract<DiagnosticEvent, { type: "push" }>;
type ResyncEvent = Extract<DiagnosticEvent, { type: "resync" }>;
type AuthEvent = Extract<DiagnosticEvent, { type: "auth" }>;
type SseEvent = Extract<DiagnosticEvent, { type: "sse" }>;

export function DiagnosticsOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [sse, setSse] = useState<SseEvent | null>(null);
  const [auth, setAuth] = useState<AuthEvent | null>(null);
  const [pulls, setPulls] = useState<PullEvent[]>([]);
  const [pushes, setPushes] = useState<PushEvent[]>([]);
  const [resyncs, setResyncs] = useState<ResyncEvent[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onDiagnostic((event: DiagnosticEvent) => {
      switch (event.type) {
        case "sse":
          setSse(event);
          break;
        case "auth":
          setAuth(event);
          break;
        case "pull":
          setPulls((prev) => [event, ...prev].slice(0, 10));
          break;
        case "push":
          setPushes((prev) => [event, ...prev].slice(0, 10));
          break;
        case "resync":
          setResyncs((prev) => [event, ...prev].slice(0, 5));
          break;
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen) {
    return (
      <div className="fixed bottom-0 right-4 z-50 mb-16 sm:mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black/90 text-green-400 font-mono text-xs px-3 py-1.5 rounded shadow border border-green-900/50 hover:bg-black"
        >
          DIAG
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 z-50 mb-16 sm:mb-4 w-[320px] max-h-[70vh] flex flex-col bg-black/90 text-green-400 font-mono text-xs rounded shadow-2xl border border-green-900/50 overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b border-green-900/50 bg-black">
        <span className="font-bold text-green-300">DIAGNOSTICS</span>
        <button
          onClick={() => setIsOpen(false)}
          className="px-2 py-0.5 hover:bg-green-900/30 rounded"
        >
          [X]
        </button>
      </div>

      <div className="overflow-y-auto p-3 space-y-4 flex-1">
        <section>
          <h3 className="text-green-300 font-bold mb-1 border-b border-green-900/30 pb-1">
            SSE
          </h3>
          {sse ? (
            <div className="flex justify-between">
              <span className={getSseColor(sse.state)}>
                [{sse.state.toUpperCase()}]
              </span>
              <span className="opacity-70">{formatAgo(sse.at, now)}</span>
            </div>
          ) : (
            <div className="opacity-50">Waiting for events...</div>
          )}
        </section>

        <section>
          <h3 className="text-green-300 font-bold mb-1 border-b border-green-900/30 pb-1">
            AUTH
          </h3>
          {auth ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Token:</span>
                <span
                  className={auth.hasToken ? "text-green-400" : "text-red-400"}
                >
                  {auth.hasToken ? "PRESENT" : "ABSENT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span>
                  {auth.userId
                    ? auth.userId.length > 8
                      ? auth.userId.substring(0, 8) + "..."
                      : auth.userId
                    : "NONE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expires:</span>
                <span>
                  {auth.expiresAt
                    ? auth.expiresAt > now
                      ? `in ${Math.floor((auth.expiresAt - now) / 60000)}m`
                      : "EXPIRED"
                    : "N/A"}
                </span>
              </div>
              <div className="text-right opacity-70 mt-1">
                {formatAgo(auth.at, now)}
              </div>
            </div>
          ) : (
            <div className="opacity-50">Waiting for events...</div>
          )}
        </section>

        <section>
          <h3 className="text-green-300 font-bold mb-1 border-b border-green-900/30 pb-1">
            PULL LOG
          </h3>
          {pulls.length > 0 ? (
            <div className="space-y-2">
              {pulls.map((p, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="truncate max-w-[150px]">
                      {p.collection}
                    </span>
                    <span className={getStatusColor(p.status)}>
                      [{p.status}]
                    </span>
                  </div>
                  <div className="flex justify-between opacity-70 text-[10px]">
                    <span>
                      {p.docCount} docs in {p.durationMs}ms
                    </span>
                    <span>{formatAgo(p.at, now)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="opacity-50">No pulls yet</div>
          )}
        </section>

        <section>
          <h3 className="text-green-300 font-bold mb-1 border-b border-green-900/30 pb-1">
            PUSH LOG
          </h3>
          {pushes.length > 0 ? (
            <div className="space-y-2">
              {pushes.map((p, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="truncate max-w-[150px]">
                      {p.collection}
                    </span>
                    <span className={getStatusColor(p.status)}>
                      [{p.status}]
                    </span>
                  </div>
                  <div className="flex justify-between opacity-70 text-[10px]">
                    <span>
                      {p.rowCount} rows, {p.conflictCount} conflicts,{" "}
                      {p.durationMs}ms
                    </span>
                    <span>{formatAgo(p.at, now)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="opacity-50">No pushes yet</div>
          )}
        </section>

        <section>
          <h3 className="text-green-300 font-bold mb-1 border-b border-green-900/30 pb-1">
            RESYNC LOG
          </h3>
          {resyncs.length > 0 ? (
            <div className="space-y-1">
              {resyncs.map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span>{r.source.toUpperCase()}</span>
                  <span className="opacity-70">{formatAgo(r.at, now)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="opacity-50">No resyncs yet</div>
          )}
        </section>
      </div>
    </div>
  );
}
