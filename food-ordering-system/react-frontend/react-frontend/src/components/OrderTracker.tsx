import { useEffect, useRef, useState, type FormEvent } from "react";
import { trackOrder } from "../api";
import SagaTimeline from "./SagaTimeline";
import type { TrackOrderResponse } from "../types";

const POLL_INTERVAL_MS = 2000;

function isTerminal(status: string): boolean {
  return status === "APPROVED" || status === "CANCELLED";
}

interface Props {
  trackingId: string;
  onTrackingIdChange: (value: string) => void;
  /** Bumped by the parent every time a new order is created, to auto-start watching it. */
  autoWatchToken: number;
}

export default function OrderTracker({ trackingId, onTrackingIdChange, autoWatchToken }: Props) {
  const [response, setResponse] = useState<TrackOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Always reflects the latest trackingId prop, so the autoWatchToken effect
  // below can read the current value without needing it in its dependency
  // array (which would otherwise re-fire it on every keystroke instead of
  // only when the parent actually bumps autoWatchToken).
  const trackingIdRef = useRef(trackingId);
  trackingIdRef.current = trackingId;

  function stopWatching() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setWatching(false);
  }

  async function poll(id: string) {
    try {
      const result = await trackOrder(id);
      setResponse(result);
      setError(null);
      if (isTerminal(result.orderStatus)) {
        stopWatching();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
      stopWatching();
      return null;
    }
  }

  function startWatching(id: string) {
    stopWatching();
    if (!id) return;
    setWatching(true);
    intervalRef.current = setInterval(() => {
      poll(id);
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await poll(trackingId);
    if (result && !isTerminal(result.orderStatus)) {
      startWatching(trackingId);
    }
  }

  // Auto-start watching whenever the parent hands us a freshly created order.
  useEffect(() => {
    const id = trackingIdRef.current;
    if (autoWatchToken > 0 && id) {
      poll(id).then((result) => {
        if (result && !isTerminal(result.orderStatus)) {
          startWatching(id);
        }
      });
    }
  }, [autoWatchToken]);

  useEffect(() => stopWatching, []);

  return (
    <section className="card">
      <h2>3. Rastrear pedido</h2>
      <p className="panel-desc">
        <code>GET /orders/{"{trackingId}"}</code>
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          orderTrackingId
          <input name="trackingId" value={trackingId} onChange={(e) => onTrackingIdChange(e.target.value)} required />
        </label>
        <div className="field-row-actions">
          <button type="submit">Consultar estado</button>
          {watching ? (
            <button type="button" className="watch-toggle watch-toggle--on" onClick={stopWatching}>
              ● En vivo (detener)
            </button>
          ) : (
            response &&
            !isTerminal(response.orderStatus) && (
              <button type="button" className="watch-toggle" onClick={() => startWatching(trackingId)}>
                Ver en vivo
              </button>
            )
          )}
        </div>
      </form>

      {error && <div className="result result--error"><p className="result__title">{error}</p></div>}

      {response && (
        <div className="result result--success">
          <SagaTimeline status={response.orderStatus} />
          {response.failureMessages && response.failureMessages.length > 0 && (
            <ul className="failure-messages">
              {response.failureMessages.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          )}
          <pre className="result__data">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
