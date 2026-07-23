import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomersAdmin from "./CustomersAdmin";
import * as api from "../../api";

vi.mock("../../api");

describe("CustomersAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a loading hint, then a table row per customer", async () => {
    vi.mocked(api.listCustomers).mockResolvedValue([
      { customerId: "c1", username: "jdoe", firstName: "Jane", lastName: "Doe" },
    ]);
    render(<CustomersAdmin />);

    expect(screen.getByText("Cargando…")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("jdoe")).toBeInTheDocument());
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("c1")).toBeInTheDocument();
  });

  it("shows an empty-state hint when there are no customers", async () => {
    vi.mocked(api.listCustomers).mockResolvedValue([]);
    render(<CustomersAdmin />);

    await waitFor(() => expect(screen.getByText("No hay clientes registrados todavía.")).toBeInTheDocument());
  });

  it("shows the error message when the fetch fails", async () => {
    vi.mocked(api.listCustomers).mockRejectedValue(new Error("Network down"));
    render(<CustomersAdmin />);

    await waitFor(() => expect(screen.getByText("Network down")).toBeInTheDocument());
  });

  it("the Actualizar button re-fetches the list", async () => {
    vi.mocked(api.listCustomers).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CustomersAdmin />);

    await waitFor(() => expect(api.listCustomers).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(api.listCustomers).toHaveBeenCalledTimes(2));
  });
});
