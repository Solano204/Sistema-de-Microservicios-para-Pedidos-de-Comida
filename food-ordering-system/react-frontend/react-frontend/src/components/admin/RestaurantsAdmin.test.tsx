import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RestaurantsAdmin from "./RestaurantsAdmin";
import * as api from "../../api";

vi.mock("../../api");

describe("RestaurantsAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a row per restaurant with its active status and product count", async () => {
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
    ]);
    render(<RestaurantsAdmin />);

    await waitFor(() => expect(screen.getByText("restaurant_1")).toBeInTheDocument());
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows Inactivo for a non-active restaurant", async () => {
    vi.mocked(api.listRestaurants).mockResolvedValue([
      { restaurantId: "r2", name: "restaurant_2", active: false, products: [] },
    ]);
    render(<RestaurantsAdmin />);

    await waitFor(() => expect(screen.getByText("Inactivo")).toBeInTheDocument());
  });

  it("shows an empty-state hint when there are no restaurants", async () => {
    vi.mocked(api.listRestaurants).mockResolvedValue([]);
    render(<RestaurantsAdmin />);

    await waitFor(() =>
      expect(screen.getByText("No hay restaurantes con productos asociados.")).toBeInTheDocument()
    );
  });
});
