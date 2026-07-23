import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import OrderTracker from "./OrderTracker";
import * as api from "../api";

vi.mock("../api");

// waitFor() polls via setTimeout, which fake timers never auto-advance, so it
// hangs until the test's own real-time timeout - `act(async () => ...)` and
// `vi.advanceTimersByTimeAsync` (which flushes both fake timers and any
// promises they trigger) are used instead everywhere below.
describe("OrderTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submitting queries trackOrder and renders the saga timeline for a non-terminal status", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({ orderTrackingId: "t1", orderStatus: "PAID", failureMessages: null });
    render(<OrderTracker trackingId="t1" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Consultar estado" }));
    });

    expect(api.trackOrder).toHaveBeenCalledWith("t1");
    expect(screen.getByText("Pago procesado")).toBeInTheDocument();
    // Non-terminal -> auto-watch kicks in right after the manual query.
    expect(screen.getByRole("button", { name: "● En vivo (detener)" })).toBeInTheDocument();
  });

  it("auto-watch polls again after the interval and stops once a terminal status is reached", async () => {
    vi.mocked(api.trackOrder)
      .mockResolvedValueOnce({ orderTrackingId: "t1", orderStatus: "PENDING", failureMessages: null })
      .mockResolvedValueOnce({ orderTrackingId: "t1", orderStatus: "APPROVED", failureMessages: null });
    render(<OrderTracker trackingId="t1" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Consultar estado" }));
    });
    expect(api.trackOrder).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "● En vivo (detener)" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(api.trackOrder).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Restaurante aprobó")).toBeInTheDocument();
    // Terminal reached -> watching stopped automatically, no resume button either.
    expect(screen.queryByRole("button", { name: "● En vivo (detener)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver en vivo" })).not.toBeInTheDocument();
  });

  it("stopping manually halts polling and shows a resume (Ver en vivo) button", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({ orderTrackingId: "t1", orderStatus: "PENDING", failureMessages: null });
    render(<OrderTracker trackingId="t1" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Consultar estado" }));
    });
    expect(api.trackOrder).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "● En vivo (detener)" }));

    expect(screen.getByRole("button", { name: "Ver en vivo" })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(api.trackOrder).toHaveBeenCalledTimes(1);
  });

  it("bumping autoWatchToken (a freshly created order) triggers a poll without any user click", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({ orderTrackingId: "t2", orderStatus: "PENDING", failureMessages: null });
    const { rerender } = render(<OrderTracker trackingId="t2" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    expect(api.trackOrder).not.toHaveBeenCalled();
    await act(async () => {
      rerender(<OrderTracker trackingId="t2" onTrackingIdChange={() => {}} autoWatchToken={1} />);
    });

    expect(api.trackOrder).toHaveBeenCalledWith("t2");
  });

  it("shows the failure messages when the order was cancelled", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({
      orderTrackingId: "t3",
      orderStatus: "CANCELLED",
      failureMessages: ["Payment failed for order"],
    });
    render(<OrderTracker trackingId="t3" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Consultar estado" }));
    });

    expect(screen.getByText("Payment failed for order")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("shows an error and does not start watching when the request fails", async () => {
    vi.mocked(api.trackOrder).mockRejectedValue(new Error("Order not found"));
    render(<OrderTracker trackingId="missing" onTrackingIdChange={() => {}} autoWatchToken={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Consultar estado" }));
    });

    expect(screen.getByText("Order not found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "● En vivo (detener)" })).not.toBeInTheDocument();
  });
});
