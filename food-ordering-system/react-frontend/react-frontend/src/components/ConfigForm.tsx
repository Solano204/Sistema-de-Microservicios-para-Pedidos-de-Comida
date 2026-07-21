import { useState } from "react";
import { loadConfig, saveConfig } from "../config";

export default function ConfigForm() {
  const initial = loadConfig();
  const [customerServiceUrl, setCustomerServiceUrl] = useState(initial.customerServiceUrl);
  const [orderServiceUrl, setOrderServiceUrl] = useState(initial.orderServiceUrl);
  const [restaurantServiceUrl, setRestaurantServiceUrl] = useState(initial.restaurantServiceUrl);
  const [savedMsg, setSavedMsg] = useState("");

  function handleSave() {
    saveConfig({
      customerServiceUrl: customerServiceUrl.trim(),
      orderServiceUrl: orderServiceUrl.trim(),
      restaurantServiceUrl: restaurantServiceUrl.trim(),
    });
    setSavedMsg("Configuracion guardada.");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  return (
    <section className="card">
      <h2>Configuración de endpoints</h2>
      <div className="field-row">
        <label htmlFor="customerServiceUrl">URL customer-service</label>
        <input
          id="customerServiceUrl"
          type="text"
          value={customerServiceUrl}
          onChange={(e) => setCustomerServiceUrl(e.target.value)}
        />
      </div>
      <div className="field-row">
        <label htmlFor="orderServiceUrl">URL order-service</label>
        <input
          id="orderServiceUrl"
          type="text"
          value={orderServiceUrl}
          onChange={(e) => setOrderServiceUrl(e.target.value)}
        />
      </div>
      <div className="field-row">
        <label htmlFor="restaurantServiceUrl">URL restaurant-service</label>
        <input
          id="restaurantServiceUrl"
          type="text"
          value={restaurantServiceUrl}
          onChange={(e) => setRestaurantServiceUrl(e.target.value)}
        />
      </div>
      <div className="field-row-actions">
        <button type="button" id="saveConfigBtn" onClick={handleSave}>
          Guardar configuración
        </button>
        <span className="saved-msg">{savedMsg}</span>
      </div>
      <p className="hint">
        No hay API Gateway: cada servicio se llama en su propio puerto. CORS ya está habilitado en el backend (
        <code>WebCorsConfig</code>), no se necesita proxy.
      </p>
    </section>
  );
}
