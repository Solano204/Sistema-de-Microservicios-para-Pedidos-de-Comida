import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateOrderForm from "./CreateOrderForm";
import * as api from "../api";

vi.mock("../api");

describe("CreateOrderForm", () => {
  let uuidCounter = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `row-${++uuidCounter}` });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("pre-fills one product row and computes its subtotal and the order total", () => {
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    expect(screen.getByText("1.00", { selector: "[data-field=subTotal]" })).toBeInTheDocument();
    expect(document.getElementById("orderTotal")).toHaveTextContent("1.00");
  });

  it("editing a row's quantity/price recalculates that row's subtotal and the total", async () => {
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    const quantityInput = screen.getByPlaceholderText("cantidad");
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");
    const priceInput = screen.getByPlaceholderText("precio unitario");
    await user.clear(priceInput);
    await user.type(priceInput, "2.5");

    expect(screen.getByText("7.50", { selector: "[data-field=subTotal]" })).toBeInTheDocument();
    expect(document.getElementById("orderTotal")).toHaveTextContent("7.50")
  });

  it("adding a row adds another product line, and removing a row drops it from the total", async () => {
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    await user.click(screen.getByRole("button", { name: "+ Agregar producto" }));
    expect(screen.getAllByPlaceholderText("productId (UUID)")).toHaveLength(2);

    const removeButtons = screen.getAllByRole("button", { name: "Quitar producto" });
    await user.click(removeButtons[1]);

    expect(screen.getAllByPlaceholderText("productId (UUID)")).toHaveLength(1);
    expect(document.getElementById("orderTotal")).toHaveTextContent("1.00");
  });

  it("blank quantity/price is treated as 0 for the subtotal, not NaN", async () => {
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    await user.clear(screen.getByPlaceholderText("cantidad"))
    await user.clear(screen.getByPlaceholderText("precio unitario"))

    expect(document.getElementById("orderTotal")).toHaveTextContent("0.00");
  });

  it("submitting builds items/address/price from form state and calls api.createOrder", async () => {
    vi.mocked(api.createOrder).mockResolvedValue({ orderTrackingId: "t1", orderStatus: "PENDING", message: "ok" });
    const onOrderCreated = vi.fn();
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={onOrderCreated} />);

    await user.type(screen.getByLabelText("Calle"), "Main St");
    await user.type(screen.getByLabelText("Código postal"), "1000AB");
    await user.type(screen.getByLabelText("Ciudad"), "Amsterdam");
    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    await waitFor(() => expect(api.createOrder).toHaveBeenCalledWith({
      customerId: "c1",
      restaurantId: "d215b5f8-0249-4dc5-89a3-51fd148cfb45",
      price: 1,
      items: [{ productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb48", quantity: 1, price: 1, subTotal: 1 }],
      address: { street: "Main St", postalCode: "1000AB", city: "Amsterdam" },
    }));
    expect(onOrderCreated).toHaveBeenCalledWith("t1");
  });

  it("picking a seed restaurant from the dropdown fills in its restaurantId", async () => {
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    await user.selectOptions(
      screen.getByLabelText("Usar restaurante de prueba (init-data.sql)"),
      "d215b5f8-0249-4dc5-89a3-51fd148cfb46",
    );

    expect(screen.getByLabelText("restaurantId")).toHaveValue("d215b5f8-0249-4dc5-89a3-51fd148cfb46");
  });

  it("picking a seed product for a row fills in its productId and auto-fills its price", async () => {
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);

    await user.selectOptions(
      screen.getByLabelText("Producto de prueba"),
      "d215b5f8-0249-4dc5-89a3-51fd148cfb50",
    );

    expect(screen.getByPlaceholderText("productId (UUID)")).toHaveValue("d215b5f8-0249-4dc5-89a3-51fd148cfb50");
    expect(screen.getByPlaceholderText("precio unitario")).toHaveValue(40);
    expect(screen.getByText("40.00", { selector: "[data-field=subTotal]" })).toBeInTheDocument();
  });

  it("editing customerId calls onCustomerIdChange (the field is controlled by the parent)", async () => {
    const onCustomerIdChange = vi.fn();
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="" onCustomerIdChange={onCustomerIdChange} onOrderCreated={() => {}} />);

    await user.type(screen.getByLabelText("customerId"), "x");

    expect(onCustomerIdChange).toHaveBeenCalledWith("x");
  });

  it("shows the error message when order creation fails", async () => {
    vi.mocked(api.createOrder).mockRejectedValue(new Error("Insufficient balance"));
    const user = userEvent.setup();
    render(<CreateOrderForm customerId="c1" onCustomerIdChange={() => {}} onOrderCreated={() => {}} />);
    await user.type(screen.getByLabelText("Calle"), "Main St");
    await user.type(screen.getByLabelText("Código postal"), "1000AB");
    await user.type(screen.getByLabelText("Ciudad"), "Amsterdam");

    await user.click(screen.getByRole("button", { name: "Crear pedido" }));

    await waitFor(() => expect(screen.getByText("Insufficient balance")).toBeInTheDocument());
  });
});
