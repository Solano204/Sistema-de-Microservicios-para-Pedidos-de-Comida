import { listCustomers } from "../../api";
import { useAdminList } from "./useAdminList";
import CopyIdButton from "./CopyIdButton";

export default function CustomersAdmin() {
  const { items, loading, error, refresh } = useAdminList(listCustomers);

  return (
    <section className="card">
      <div className="admin-header">
        <h2>Administrar clientes</h2>
        <button type="button" onClick={refresh}>Actualizar</button>
      </div>
      <p className="panel-desc"><code>GET /customers</code></p>

      {loading && <p className="hint">Cargando…</p>}
      {error && <div className="result result--error"><p className="result__title">{error}</p></div>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="hint">No hay clientes registrados todavía.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>customerId</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.customerId}>
                  <td>{customer.username}</td>
                  <td>{customer.firstName} {customer.lastName}</td>
                  <td className="id-cell">{customer.customerId}</td>
                  <td><CopyIdButton value={customer.customerId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </section>
  );
}
