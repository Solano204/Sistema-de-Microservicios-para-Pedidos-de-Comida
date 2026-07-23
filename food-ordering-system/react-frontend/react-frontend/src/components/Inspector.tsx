import { useState } from "react";
import type { ApiCallLog } from "../api";

function statusClass(status: number | null): string {
  if (status === null) return "call-status--error";
  return status >= 200 && status < 300 ? "call-status--ok" : "call-status--error";
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function CallEntry({ log, defaultOpen }: { log: ApiCallLog; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <li className="call-entry">
      <button type="button" className="call-entry__header" onClick={() => setOpen((v) => !v)}>
        <span className={`call-status ${statusClass(log.responseStatus)}`}>
          {log.responseStatus ?? "ERR"}
        </span>
        <span className="call-entry__method">{log.method}</span>
        <span className="call-entry__url">{log.url}</span>
        <span className="call-entry__time">{formatTime(log.timestamp)}</span>
        <span className="call-entry__chevron">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="inspector-grid">
          <div>
            <h3>Request</h3>
            <pre>{JSON.stringify({ method: log.method, url: log.url, body: log.requestBody }, null, 2)}</pre>
          </div>
          <div>
            <h3>Response</h3>
            <pre>{JSON.stringify({ status: log.responseStatus, body: log.responseBody }, null, 2)}</pre>
          </div>
        </div>
      )}
    </li>
  );
}

interface Props {
  logs: ApiCallLog[];
  onClear: () => void;
}

export default function Inspector({ logs, onClear }: Props) {
  return (
    <section className="card">
      <div className="inspector-header">
        <h2>Historial de peticiones ({logs.length})</h2>
        <button type="button" onClick={onClear} disabled={logs.length === 0}>
          Limpiar historial
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="hint">Todavía no se hizo ninguna petición.</p>
      ) : (
        <ol className="call-list">
          {logs.map((log, index) => (
            <CallEntry key={log.id} log={log} defaultOpen={index === 0} />
          ))}
        </ol>
      )}
    </section>
  );
}
