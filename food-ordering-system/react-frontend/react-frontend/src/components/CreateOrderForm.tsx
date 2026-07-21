import { useState, type FormEvent } from "react";
import { createOrder } from "../api";
import ResultBox, { type ResultState } from "./ResultBox";
import type { OrderItem } from "../types";

interface Row {
  rowId: string;
  productId: string;
  quantity: string;
  price: string;
}

function newRow(prefill?: Partial<OrderItem>): Row {
  return {
    rowId: crypto.randomUUID(),
    productId: prefill?.productId ?? "",
    quantity: prefill?.quantity !== undefined ? String(prefill.quantity) : "",
    price: prefill?.price !== undefined ? String(prefill.price) : "",
  };
}

function rowSubTotal(row: Row): number {
  const quantity = Number(row.quantity) || 0;
  const price = Number(row.price) || 0;
  return Number((quantity * price).toFixed(2));
}

interface Props {
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  onOrderCreated: (trackingId: string) => void;
}

export default function CreateOrderForm({ customerId, onCustomerIdChange, onOrderCreated }: Props) {
  const [restaurantId, setRestaurantId] = useState("d215b5f8-0249-4dc5-89a3-51fd148cfb45");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<Row[]>([
    newRow({ productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb48", quantity: 1, price: 1.0 }),
  ]);
  const [result, setResult] = useState<ResultState | null>(null);

  const total = items.reduce((sum, row) => sum + rowSubTotal(row), 0);

  function updateRow(rowId: string, field: "productId" | "quantity" | "price", value: string) {
    setItems((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row)));
  }

  function removeRow(rowId: string) {
    setItems((prev) => prev.filter((row) => row.rowId !== rowId));
  }

  function addRow() {
    setItems((prev) => [...prev, newRow()]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderItems: OrderItem[] = items.map((row) => {
      const quantity = Number(row.quantity);
      const price = Number(row.price);
      return { productId: row.productId, quantity, price, subTotal: rowSubTotal(row) };
    });
    const totalPrice = Number(orderItems.reduce((sum, item) => sum + item.subTotal, 0).toFixed(2));

    try {
      const response = await createOrder({
        customerId,
        restaurantId,
        price: totalPrice,
        items: orderItems,
        address: { street, postalCode, city },
      });
      setResult({ kind: "success", title: "Pedido creado.", data: response });
      onOrderCreated(response.orderTrackingId);
    } catch (error) {
      setResult({ kind: "error", title: error instanceof Error ? error.message : "Error desconocido." });
    }
  }

  return (
    <section className="card">
      <h2>2. Crear pedido</h2>
      <p className="panel-desc">
        <code>POST /orders</code>
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          customerId
          <input name="customerId" value={customerId} onChange={(e) => onCustomerIdChange(e.target.value)} required />
        </label>
        <label>
          restaurantId
          <input name="restaurantId" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} required />
        </label>
        <fieldset>
          <legend>Dirección de entrega</legend>
          <label>
            Calle
            <input name="street" placeholder="street_1" value={street} onChange={(e) => setStreet(e.target.value)} required />
          </label>
          <label>
            Código postal
            <input
              name="postalCode"
              placeholder="1000AB"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </label>
          <label>
            Ciudad
            <input name="city" placeholder="Amsterdam" value={city} onChange={(e) => setCity(e.target.value)} required />
          </label>
        </fieldset>
        <fieldset>
          <legend>Productos</legend>
          <div id="orderItemsList">
            {items.map((row) => (
              <div className="order-item-row" key={row.rowId}>
                <input
                  data-field="productId"
                  placeholder="productId (UUID)"
                  value={row.productId}
                  onChange={(e) => updateRow(row.rowId, "productId", e.target.value)}
                  required
                />
                <input
                  data-field="quantity"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="cantidad"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.rowId, "quantity", e.target.value)}
                  required
                />
                <input
                  data-field="price"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="precio unitario"
                  value={row.price}
                  onChange={(e) => updateRow(row.rowId, "price", e.target.value)}
                  required
                />
                <span className="subtotal">
                  Subtotal: <span data-field="subTotal">{rowSubTotal(row).toFixed(2)}</span>
                </span>
                <button type="button" className="remove-item" aria-label="Quitar producto" onClick={() => removeRow(row.rowId)}>
                  x
                </button>
              </div>
            ))}
          </div>
          <button type="button" id="addOrderItemBtn" onClick={addRow}>
            + Agregar producto
          </button>
        </fieldset>
        <div className="total-row">
          Total del pedido: <strong id="orderTotal">{total.toFixed(2)}</strong>
        </div>
        <button type="submit">Crear pedido</button>
      </form>
      <ResultBox result={result} />
    </section>
  );
}
