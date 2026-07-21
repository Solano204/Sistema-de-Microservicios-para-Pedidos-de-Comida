import { useEffect, useState } from "react";
import { onApiCall, type ApiCallLog } from "./api";
import ConfigForm from "./components/ConfigForm";
import CreateCustomerForm from "./components/CreateCustomerForm";
import CreateOrderForm from "./components/CreateOrderForm";
import OrderTracker from "./components/OrderTracker";
import Inspector from "./components/Inspector";
import RestaurantsAdmin from "./components/admin/RestaurantsAdmin";
import ProductsAdmin from "./components/admin/ProductsAdmin";
import CustomersAdmin from "./components/admin/CustomersAdmin";
import OrdersAdmin from "./components/admin/OrdersAdmin";

const MAX_LOG_ENTRIES = 50;

type Tab = "app" | "restaurants" | "products" | "customers" | "orders";

const TABS: { id: Tab; label: string }[] = [
  { id: "app", label: "Aplicación normal" },
  { id: "restaurants", label: "Administrar restaurantes" },
  { id: "products", label: "Administrar productos" },
  { id: "customers", label: "Administrar clientes" },
  { id: "orders", label: "Administrar pedidos" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("app");
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [autoWatchToken, setAutoWatchToken] = useState(0);

  useEffect(() => {
    onApiCall((log) => setApiLogs((prev) => [log, ...prev].slice(0, MAX_LOG_ENTRIES)));
  }, []);

  function handleOrderCreated(newTrackingId: string) {
    setTrackingId(newTrackingId);
    setAutoWatchToken((prev) => prev + 1);
  }

  return (
    <>
      <header className="page-header">
        <h1>Panel de integración — Food Ordering System</h1>
        <p>
          Interfaz para probar <code>customer-service</code>, <code>order-service</code> y{" "}
          <code>restaurant-service</code> directamente. <code>payment-service</code> solo se comunica por Kafka, no
          expone REST.
        </p>
      </header>

      <nav className="main-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "main-nav__btn main-nav__btn--active" : "main-nav__btn"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "app" && (
        <>
          <ConfigForm />

          <section className="card hint-card">
            <h2>Datos de ejemplo (seed local de docker-compose)</h2>
            <p>
              Ya vienen precargados en los formularios como selects "de prueba" y coinciden con los datos sembrados
              por <code>init-data.sql</code>. El cliente con crédito + restaurante activo + producto disponible
              completan el flujo feliz (cliente → pedido → pago → aprobación); el cliente con poco crédito, el
              restaurante inactivo o un producto no disponible sirven para provocar a propósito el camino de
              cancelación. ¿No sabes qué IDs existen? Revisa las pestañas "Administrar..." de arriba.
            </p>
          </section>

          <main className="grid">
            <CreateCustomerForm onCustomerCreated={setOrderCustomerId} />
            <CreateOrderForm
              customerId={orderCustomerId}
              onCustomerIdChange={setOrderCustomerId}
              onOrderCreated={handleOrderCreated}
            />
            <OrderTracker trackingId={trackingId} onTrackingIdChange={setTrackingId} autoWatchToken={autoWatchToken} />
          </main>
        </>
      )}

      {tab === "restaurants" && <RestaurantsAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "customers" && <CustomersAdmin />}
      {tab === "orders" && <OrdersAdmin />}

      <Inspector logs={apiLogs} onClear={() => setApiLogs([])} />
    </>
  );
}
