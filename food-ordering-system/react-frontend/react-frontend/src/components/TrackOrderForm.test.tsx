import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackOrderForm from "./TrackOrderForm";
import * as api from "../api";

vi.mock("../api");

describe("TrackOrderForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submitting calls api.trackOrder with the given trackingId and shows the resolved status badge", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({ orderTrackingId: "t1", orderStatus: "PAID", failureMessages: null });
    const user = userEvent.setup();
    render(<TrackOrderForm trackingId="t1" onTrackingIdChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Consultar estado" }));

    await waitFor(() => expect(api.trackOrder).toHaveBeenCalledWith("t1"));
    expect(screen.getByText("Pagado")).toBeInTheDocument()
  });

  it("shows the failure messages list when the order has any", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({
      orderTrackingId: "t1",
      orderStatus: "CANCELLED",
      failureMessages: ["Payment failed", "Restaurant rejected"],
    });
    const user = userEvent.setup();
    render(<TrackOrderForm trackingId="t1" onTrackingIdChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Consultar estado" }));

    await waitFor(() => expect(screen.getByText("Payment failed")).toBeInTheDocument());
    expect(screen.getByText("Restaurant rejected")).toBeInTheDocument();
  });

  it("does not render a failure list when there are no failure messages", async () => {
    vi.mocked(api.trackOrder).mockResolvedValue({ orderTrackingId: "t1", orderStatus: "APPROVED", failureMessages: [] });
    const user = userEvent.setup();
    const { container } = render(<TrackOrderForm trackingId="t1" onTrackingIdChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Consultar estado" }));

    await waitFor(() => expect(screen.getByText("Aprobado")).toBeInTheDocument());
    expect(container.querySelector("ul")).not.toBeInTheDocument();
  });

  it("shows the error message when tracking fails", async () => {
    vi.mocked(api.trackOrder).mockRejectedValue(new Error("Order not found"));
    const user = userEvent.setup();
    render(<TrackOrderForm trackingId="missing" onTrackingIdChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Consultar estado" }));

    await waitFor(() => expect(screen.getByText("Order not found")).toBeInTheDocument());
  });

  it("editing trackingId calls onTrackingIdChange", async () => {
    const onTrackingIdChange = vi.fn();
    const user = userEvent.setup();
    render(<TrackOrderForm trackingId="" onTrackingIdChange={onTrackingIdChange} />);

    await user.type(screen.getByLabelText("orderTrackingId"), "x");

    expect(onTrackingIdChange).toHaveBeenCalledWith("x");
  });
});
