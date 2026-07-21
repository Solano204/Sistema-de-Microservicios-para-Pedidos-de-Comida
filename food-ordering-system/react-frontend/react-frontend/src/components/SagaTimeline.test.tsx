import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SagaTimeline from "./SagaTimeline";

describe("SagaTimeline", () => {
  it("shows the happy-path steps with PENDING as the current one and a waiting indicator", () => {
    const { container } = render(<SagaTimeline status="PENDING" />);

    expect(screen.getByText("Pedido creado")).toBeInTheDocument();
    expect(screen.getByText("Pago procesado")).toBeInTheDocument();
    expect(screen.getByText("Restaurante aprobó")).toBeInTheDocument();
    expect(screen.queryByText("Cancelando")).not.toBeInTheDocument();
    expect(container.querySelector(".saga-step--current")).toHaveTextContent("Pedido creado");
    expect(screen.getByText("esperando…")).toBeInTheDocument();
  });

  it("marks earlier happy-path steps done and hides the waiting indicator once APPROVED (terminal)", () => {
    const { container } = render(<SagaTimeline status="APPROVED" />);

    expect(container.querySelectorAll(".saga-step--done")).toHaveLength(2);
    expect(container.querySelector(".saga-step--current")).toHaveTextContent("Restaurante aprobó");
    expect(screen.queryByText("esperando…")).not.toBeInTheDocument();
  });

  it("switches to the failure path (Cancelando/Cancelado) once the order starts cancelling", () => {
    const { container } = render(<SagaTimeline status="CANCELLING" />);

    expect(screen.getByText("Cancelando")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.queryByText("Pago procesado")).not.toBeInTheDocument();
    expect(container.querySelector(".saga-timeline")).toHaveAttribute("data-failed", "true");
  });

  it("marks CANCELLED as done and terminal on the failure path", () => {
    const { container } = render(<SagaTimeline status="CANCELLED" />);

    expect(container.querySelector(".saga-step--current")).toHaveTextContent("Cancelado");
    expect(screen.queryByText("esperando…")).not.toBeInTheDocument();
  });
});
