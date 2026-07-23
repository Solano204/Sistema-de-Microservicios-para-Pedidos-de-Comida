import { listRestaurants } from "../../api";
import { useAdminList } from "./useAdminList";
import CopyIdButton from "./CopyIdButton";

export default function RestaurantsAdmin() {
  const { items, loading, error, refresh } = useAdminList(listRestaurants);

  return (
    <section className="card">
      <div className="admin-header">
        <h2>Administrar restaurantes</h2>
        <button type="button" onClick={refresh}>Actualizar</button>
      </div>
      <p className="panel-desc"><code>GET /restaurants</code></p>

      {loading && <p className="hint">Cargando…</p>}
      {error && <div className="result result--error"><p className="result__title">{error}</p></div>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="hint">No hay restaurantes con productos asociados.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>restaurantId</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((restaurant) => (
                <tr key={restaurant.restaurantId}>
                  <td>{restaurant.name}</td>
                  <td>
                    <span className={`badge ${restaurant.active ? "badge--approved" : "badge--cancelled"}`}>
                      {restaurant.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{restaurant.products.length}</td>
                  <td className="id-cell">{restaurant.restaurantId}</td>
                  <td><CopyIdButton value={restaurant.restaurantId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </section>
  );
}
