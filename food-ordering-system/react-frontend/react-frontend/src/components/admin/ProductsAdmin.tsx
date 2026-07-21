import { listRestaurants } from "../../api";
import { useAdminList } from "./useAdminList";
import CopyIdButton from "./CopyIdButton";
import type { RestaurantSummary } from "../../types";

interface FlatProduct {
  productId: string;
  name: string;
  price: number;
  available: boolean;
  restaurantId: string;
  restaurantName: string;
}

function flatten(restaurants: RestaurantSummary[]): FlatProduct[] {
  return restaurants.flatMap((restaurant) =>
    restaurant.products.map((product) => ({
      ...product,
      restaurantId: restaurant.restaurantId,
      restaurantName: restaurant.name,
    }))
  );
}

export default function ProductsAdmin() {
  const { items, loading, error, refresh } = useAdminList(listRestaurants);
  const products = flatten(items);

  return (
    <section className="card">
      <div className="admin-header">
        <h2>Administrar productos</h2>
        <button type="button" onClick={refresh}>Actualizar</button>
      </div>
      <p className="panel-desc">Derivado de <code>GET /restaurants</code> (un producto por restaurante que lo ofrece)</p>

      {loading && <p className="hint">Cargando…</p>}
      {error && <div className="result result--error"><p className="result__title">{error}</p></div>}

      {!loading && !error && (
        products.length === 0 ? (
          <p className="hint">No hay productos todavía.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Restaurante</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th>productId</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={`${product.restaurantId}-${product.productId}`}>
                  <td>{product.name}</td>
                  <td>{product.restaurantName}</td>
                  <td>{product.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.available ? "badge--approved" : "badge--cancelled"}`}>
                      {product.available ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="id-cell">{product.productId}</td>
                  <td><CopyIdButton value={product.productId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </section>
  );
}
