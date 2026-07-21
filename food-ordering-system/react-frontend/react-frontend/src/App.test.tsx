import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as api from "./api";

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  // trackOrder is left as the real implementation - the "wires onApiCall"
  // test below needs its real internal request() call (which is what
  // actually invokes the onApiCall log listener) to run, not a bare mock.
  return { ...actual, createCustomer: vi.fn(), createOrder: vi.fn() };
});

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });
  });

  it("renders the config form and all three workflow forms plus the inspector", () => {
    render(<App />);

    expect(screen.getByText("Configuración de endpoints")).toBeInTheDocument();
    expect(screen.getByText("1. Crear cliente")).toBeInTheDocument();
    expect(screen.getByText("2. Crear pedido")).toBeInTheDocument();
    expect(screen.getByText("3. Rastrear pedido")).toBeInTheDocument();
    expect(screen.getByText("Última petición / respuesta")).toBeInTheDocument();
  });

  it("creating a customer flows the returned customerId into the order form's customerId field", async () => {
    vi.mocked(api.createCustomer).mockResolvedValue({ customerId: "new-customer-id", message: "ok" });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Usuario"), "jdoe");
    await user.type(screen.getByLabelText("Nombre"), "Jane");
    await user.type(screen.getByLabelText("Apellido"), "Doe");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(screen.getByLabelText("customerId")).toHaveValue("new-customer-id"));
  });

  it("creating an order flows the returned trackingId into the track form's trackingId field", async () => {
    vi.mocked(api.createOrder).mockResolvedValue({ orderTrackingId: "new-tracking-id", orderStatus: "PENDING", message: "ok" });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("customerId"), "c1");
    await user.type(screen.getByLabelText("Calle"), "Main St");
    await user.type(screen.getByLabelText("Código postal"), "1000AB");
    await user.type(screen.getByLabelText("Ciudad"), "Amsterdam");
    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    await waitFor(() => expect(screen.getByLabelText("orderTrackingId")).toHaveValue("new-tracking-id"));
  });

  it("wires onApiCall so a request updates the inspector panel", async () => {
    // trackOrder isn't mocked (see vi.mock above), so this exercises the
    // real request() call - stub fetch itself instead.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ orderTrackingId: "t1", orderStatus: "PAID", failureMessages: null }), {
          status: 200,
        }),
      ),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("orderTrackingId"), "t1");
    await user.click(screen.getByRole("button", { name: "Consultar estado" }));

    await waitFor(() => expect(document.getElementById("lastResponse")!.textContent).toContain("PAID"));
    vi.unstubAllGlobals();
  });
});
