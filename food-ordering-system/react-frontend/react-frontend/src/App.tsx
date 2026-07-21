import { useEffect, useState } from "react";
import { onApiCall, type ApiCallLog } from "./api";
import ConfigForm from "./components/ConfigForm";
import CreateCustomerForm from "./components/CreateCustomerForm";
import CreateOrderForm from "./components/CreateOrderForm";
import TrackOrderForm from "./components/TrackOrderForm";
import Inspector from "./components/Inspector";

export default function App() {
  const [apiLog, setApiLog] = useState<ApiCallLog | null>(null);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    onApiCall((log) => setApiLog(log));
  }, []);

  return (
    <>
      <header className="page-header">
        <h1>Panel de integración — Food Ordering System</h1>
        <p>
          Interfaz simple (sin frameworks) para probar <code>customer-service</code> y <code>order-service</code>{" "}
          directamente. El resto de servicios (<code>restaurant-service</code>, <code>payment-service</code>) solo se
          comunican por Kafka, no exponen REST.
        </p>
      </header>

      <ConfigForm />

      <section className="card hint-card">
        <h2>Datos de ejemplo (seed local de docker-compose)</h2>
        <p>
          Estos valores ya vienen precargados en los formularios y coinciden con los datos sembrados por{" "}
          <code>init-data.sql</code>, así que el flujo feliz completo (cliente → pedido → pago → aprobación de
          restaurante) funciona sin tocar la base de datos:
        </p>
        <ul>
          <li>
            Cliente con crédito sembrado (50,000): <code>d215b5f8-0249-4dc5-89a3-51fd148cfb41</code>
          </li>
          <li>
            Restaurante activo: <code>d215b5f8-0249-4dc5-89a3-51fd148cfb45</code>
          </li>
          <li>
            Producto disponible (precio 1.00): <code>d215b5f8-0249-4dc5-89a3-51fd148cfb48</code>
          </li>
        </ul>
      </section>

      <main className="grid">
        <CreateCustomerForm onCustomerCreated={setOrderCustomerId} />
        <CreateOrderForm
          customerId={orderCustomerId}
          onCustomerIdChange={setOrderCustomerId}
          onOrderCreated={setTrackingId}
        />
        <TrackOrderForm trackingId={trackingId} onTrackingIdChange={setTrackingId} />
      </main>

      <Inspector log={apiLog} />
    </>
  );
}
