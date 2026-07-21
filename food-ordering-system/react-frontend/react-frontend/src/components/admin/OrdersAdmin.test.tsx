import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrdersAdmin from "./OrdersAdmin";
import * as api from "../../api";

vi.mock("../../api");

describe("OrdersAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a row per order with its status badge and price", async () => {
    vi.mocked(api.listOrders).mockResolvedValue([
      { orderTrackingId: "t1", customerId: "c1", restaurantId: "r1", price: 12.5, orderStatus: "APPROVED" },
    ]);
    render(<OrdersAdmin />);

    await waitFor(() => expect(screen.getByText("t1")).toBeInTheDocument());
    expect(screen.getByText("Aprobado")).toBeInTheDocument();
    expect(screen.getByText("12.50")).toBeInTheDocument();
  });

  it("shows an empty-state hint when there are no orders", async () => {
    vi.mocked(api.listOrders).mockResolvedValue([]);
    render(<OrdersAdmin />);

    await waitFor(() => expect(screen.getByText("No hay pedidos todavía.")).toBeInTheDocument());
  });

  it("shows the error message when the fetch fails", async () => {
    vi.mocked(api.listOrders).mockRejectedValue(new Error("Network down"));
    render(<OrdersAdmin />);

    await waitFor(() => expect(screen.getByText("Network down")).toBeInTheDocument());
  });
});
