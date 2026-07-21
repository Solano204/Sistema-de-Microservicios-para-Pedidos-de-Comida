import type { OrderStatus } from "../types";

// order-service's own status field is the only saga-wide signal a REST client
// can see - payment-service/restaurant-service never expose their own state
// over HTTP, only via Kafka. Happy path: PENDING -> PAID -> APPROVED. Failure
// path (insufficient credit, inactive restaurant, unavailable product, etc.):
// PENDING -> CANCELLING -> CANCELLED.
const HAPPY_PATH: OrderStatus[] = ["PENDING", "PAID", "APPROVED"];
const FAILURE_PATH: OrderStatus[] = ["PENDING", "CANCELLING", "CANCELLED"];

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pedido creado",
  PAID: "Pago procesado",
  APPROVED: "Restaurante aprobó",
  CANCELLING: "Cancelando",
  CANCELLED: "Cancelado",
};

function isTerminal(status: OrderStatus): boolean {
  return status === "APPROVED" || status === "CANCELLED";
}

export default function SagaTimeline({ status }: { status: OrderStatus }) {
  const path = status === "CANCELLING" || status === "CANCELLED" ? FAILURE_PATH : HAPPY_PATH;
  const currentIndex = path.indexOf(status);
  const failed = path === FAILURE_PATH;

  return (
    <ol className="saga-timeline" data-failed={failed || undefined}>
      {path.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
        return (
          <li key={step} className={`saga-step saga-step--${state}`}>
            <span className="saga-step__dot" />
            <span className="saga-step__label">{STEP_LABELS[step]}</span>
          </li>
        );
      })}
      {!isTerminal(status) && <li className="saga-step saga-step--waiting">esperando…</li>}
    </ol>
  );
}
