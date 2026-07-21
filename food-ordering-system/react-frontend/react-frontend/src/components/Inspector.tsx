import type { ApiCallLog } from "../api";

export default function Inspector({ log }: { log: ApiCallLog | null }) {
  const requestText = log
    ? JSON.stringify({ method: log.method, url: log.url, body: log.requestBody }, null, 2)
    : "—";
  const responseText = log
    ? JSON.stringify({ status: log.responseStatus, body: log.responseBody }, null, 2)
    : "—";

  return (
    <section className="card">
      <h2>Última petición / respuesta</h2>
      <div className="inspector-grid">
        <div>
          <h3>Request</h3>
          <pre id="lastRequest">{requestText}</pre>
        </div>
        <div>
          <h3>Response</h3>
          <pre id="lastResponse">{responseText}</pre>
        </div>
      </div>
    </section>
  );
}
