import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateCustomerForm from "./CreateCustomerForm";
import * as api from "../api";

vi.mock("../api");

describe("CreateCustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "generated-uuid-1" });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("pre-fills a default customerId", () => {
    render(<CreateCustomerForm onCustomerCreated={() => {}} />);

    expect(screen.getByLabelText(/customerId/)).toHaveValue("d215b5f8-0249-4dc5-89a3-51fd148cfb41");
  });

  it("picking a seed customer from the dropdown fills in its customerId", async () => {
    const user = userEvent.setup();
    render(<CreateCustomerForm onCustomerCreated={() => {}} />);

    await user.selectOptions(
      screen.getByLabelText("Usar cliente de prueba (init-data.sql)"),
      "d215b5f8-0249-4dc5-89a3-51fd148cfb43",
    );

    expect(screen.getByLabelText(/^customerId/)).toHaveValue("d215b5f8-0249-4dc5-89a3-51fd148cfb43");
  });

  it("the Generar button replaces customerId with a freshly generated UUID", async () => {
    const user = userEvent.setup();
    render(<CreateCustomerForm onCustomerCreated={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Generar" }));

    expect(screen.getByLabelText(/customerId/)).toHaveValue("generated-uuid-1");
  });

  it("submitting calls api.createCustomer with the full command and notifies the parent of the new id", async () => {
    vi.mocked(api.createCustomer).mockResolvedValue({ customerId: "c1", message: "ok" });
    const onCustomerCreated = vi.fn();
    const user = userEvent.setup();
    render(<CreateCustomerForm onCustomerCreated={onCustomerCreated} />);

    await user.type(screen.getByLabelText("Usuario"), "jdoe");
    await user.type(screen.getByLabelText("Nombre"), "Jane");
    await user.type(screen.getByLabelText("Apellido"), "Doe");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(api.createCustomer).toHaveBeenCalledWith({
      customerId: "d215b5f8-0249-4dc5-89a3-51fd148cfb41",
      username: "jdoe",
      firstName: "Jane",
      lastName: "Doe",
    }))
    expect(onCustomerCreated).toHaveBeenCalledWith("c1");
    expect(screen.getByText("Cliente creado.")).toBeInTheDocument();
  });

  it("shows the error message and does not notify the parent when creation fails", async () => {
    vi.mocked(api.createCustomer).mockRejectedValue(new Error("Username already taken"));
    const onCustomerCreated = vi.fn();
    const user = userEvent.setup();
    render(<CreateCustomerForm onCustomerCreated={onCustomerCreated} />);

    await user.type(screen.getByLabelText("Usuario"), "jdoe");
    await user.type(screen.getByLabelText("Nombre"), "Jane");
    await user.type(screen.getByLabelText("Apellido"), "Doe");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(screen.getByText("Username already taken")).toBeInTheDocument());
    expect(onCustomerCreated).not.toHaveBeenCalled();
  });
});
