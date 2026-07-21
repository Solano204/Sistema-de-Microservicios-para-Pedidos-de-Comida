import { useState, type FormEvent } from "react";
import { trackOrder } from "../api";
import ResultBox, { type ResultState } from "./ResultBox";
import StatusBadge from "./StatusBadge";

interface Props {
  trackingId: string;
  onTrackingIdChange: (value: string) => void;
}

export default function TrackOrderForm({ trackingId, onTrackingIdChange }: Props) {
  const [result, setResult] = useState<ResultState | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await trackOrder(trackingId);
      const extra =
        response.failureMessages && response.failureMessages.length > 0 ? (
          <ul>
            {response.failureMessages.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        ) : undefined;

      setResult({
        kind: "success",
        title: <>Estado del pedido: <StatusBadge status={response.orderStatus} /></>,
        extra,
        data: response,
      });
    } catch (error) {
      setResult({ kind: "error", title: error instanceof Error ? error.message : "Error desconocido." });
    }
  }

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
        <button type="submit">Consultar estado</button>
      </form>
      <ResultBox result={result} />
    </section>
  );
}
