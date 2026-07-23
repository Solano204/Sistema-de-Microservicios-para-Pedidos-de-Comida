import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Inspector from "./Inspector";
import type { ApiCallLog } from "../api";

function makeLog(overrides: Partial<ApiCallLog> = {}): ApiCallLog {
  return {
    id: "log-1",
    timestamp: Date.parse("2026-01-01T00:00:00Z"),
    method: "POST",
    url: "http://localhost:8184/customers",
    requestBody: { username: "u1" },
    responseStatus: 201,
    responseBody: { customerId: "c1" },
    ...overrides,
  };
}

describe("Inspector", () => {
  it("shows an empty-state hint and a disabled clear button when there is no history yet", () => {
    render(<Inspector logs={[]} onClear={() => {}} />);

    expect(screen.getByText("Historial de peticiones (0)")).toBeInTheDocument();
    expect(screen.getByText("Todavía no se hizo ninguna petición.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar historial" })).toBeDisabled();
  });

  it("lists every call, newest first, with the most recent expanded showing its request/response", () => {
    const logs: ApiCallLog[] = [
      makeLog({ id: "log-2", method: "GET", url: "http://localhost:8181/orders/t1", responseStatus: 200 }),
      makeLog({ id: "log-1" }),
    ];
    render(<Inspector logs={logs} onClear={() => {}} />);

    expect(screen.getByText("Historial de peticiones (2)")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:8181/orders/t1")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:8184/customers")).toBeInTheDocument();
    // The newest entry (index 0) starts expanded, so its response body is visible.
    expect(screen.getByText(/"status": 200/)).toBeInTheDocument();
  });

  it("expands a collapsed (non-newest) entry on click to reveal its request/response JSON", async () => {
    // Only index 0 (the newest) starts expanded - use a second, older entry
    // so it starts collapsed and we can verify clicking it opens it. Gave the
    // newest entry a distinct response body so its already-expanded content
    // can't accidentally satisfy the assertion about the collapsed one.
    const logs: ApiCallLog[] = [
      makeLog({ id: "log-2", url: "http://localhost:8181/orders/t1", responseBody: { orderTrackingId: "t1" } }),
      makeLog({ id: "log-1" }),
    ];
    const user = userEvent.setup();
    render(<Inspector logs={logs} onClear={() => {}} />);

    expect(screen.queryByText(/"customerId": "c1"/)).not.toBeInTheDocument();
    await user.click(screen.getByText("http://localhost:8184/customers"));
    expect(screen.getByText(/"customerId": "c1"/)).toBeInTheDocument();
  });

  it("collapses the newest (already-expanded) entry on click", async () => {
    const logs: ApiCallLog[] = [makeLog()];
    const user = userEvent.setup();
    render(<Inspector logs={logs} onClear={() => {}} />);

    expect(screen.getByText(/"customerId": "c1"/)).toBeInTheDocument();
    await user.click(screen.getByText("http://localhost:8184/customers"));
    expect(screen.queryByText(/"customerId": "c1"/)).not.toBeInTheDocument();
  });

  it("calls onClear when the clear-history button is clicked", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<Inspector logs={[makeLog()]} onClear={onClear} />);

    await user.click(screen.getByRole("button", { name: "Limpiar historial" }));

    expect(onClear).toHaveBeenCalled();
  });
});
