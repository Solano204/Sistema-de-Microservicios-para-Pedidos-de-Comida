import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProductsAdmin from "./ProductsAdmin";
import * as api from "../../api";

vi.mock("../../api");

describe("ProductsAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flattens every restaurant's products into a single table, one row per product", async () => {
    vi.mocked(api.listRestaurants).mockResolvedValue([
      {
        restaurantId: "r1",
        name: "restaurant_1",
        active: true,
        products: [
          { productId: "p1", name: "product_1", price: 25, available: false },
          { productId: "p2", name: "product_2", price: 1, available: true },
        ],
      },
      {
        restaurantId: "r2",
        name: "restaurant_2",
        active: false,
        products: [{ productId: "p3", name: "product_3", price: 20, available: false }],
      },
    ]);
    render(<ProductsAdmin />);

    await waitFor(() => expect(screen.getByText("product_1")).toBeInTheDocument());
    expect(screen.getByText("product_2")).toBeInTheDocument();
    expect(screen.getByText("product_3")).toBeInTheDocument();
    // Each row shows which restaurant it belongs to.
    expect(screen.getAllByText("restaurant_1")).toHaveLength(2);
    expect(screen.getByText("restaurant_2")).toBeInTheDocument();
  });

  it("shows an empty-state hint when no restaurant has any products", async () => {
    vi.mocked(api.listRestaurants).mockResolvedValue([]);
    render(<ProductsAdmin />);

    await waitFor(() => expect(screen.getByText("No hay productos todavía.")).toBeInTheDocument());
  });

  it("shows the error message when the fetch fails", async () => {
    vi.mocked(api.listRestaurants).mockRejectedValue(new Error("Network down"));
    render(<ProductsAdmin />);

    await waitFor(() => expect(screen.getByText("Network down")).toBeInTheDocument());
  });
});
