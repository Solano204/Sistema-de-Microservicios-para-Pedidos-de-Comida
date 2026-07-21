import { listOrders } from "../../api";
import { useAdminList } from "./useAdminList";
import CopyIdButton from "./CopyIdButton";
import StatusBadge from "../StatusBadge";

export default function OrdersAdmin() {
  const { items, loading, error, refresh } = useAdminList(listOrders);

  return (
    <section className="card">
      <div className="admin-header">
        <h2>Administrar pedidos</h2>
        <button type="button" onClick={refresh}>Actualizar</button>
      </div>
      <p className="panel-desc"><code>GET /orders</code></p>

      {loading && <p className="hint">Cargando…</p>}
      {error && <div className="result result--error"><p className="result__title">{error}</p></div>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="hint">No hay pedidos todavía.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Precio</th>
                <th>orderTrackingId</th>
                <th>customerId</th>
                <th>restaurantId</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.orderTrackingId}>
                  <td><StatusBadge status={order.orderStatus} /></td>
                  <td>{order.price.toFixed(2)}</td>
                  <td className="id-cell">{order.orderTrackingId}</td>
                  <td className="id-cell">{order.customerId}</td>
                  <td className="id-cell">{order.restaurantId}</td>
                  <td><CopyIdButton value={order.orderTrackingId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </section>
  );
}
