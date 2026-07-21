// No API Gateway in front of this system, so the panel talks to each service's own port directly.
// Both services already allow cross-origin calls via WebCorsConfig (common-application), so no proxy is needed.

export interface PanelConfig {
  customerServiceUrl: string;
  orderServiceUrl: string;
  restaurantServiceUrl: string;
}

const STORAGE_KEY = "food-ordering-panel:config";

const DEFAULT_CONFIG: PanelConfig = {
  customerServiceUrl: "http://localhost:8184",
  orderServiceUrl: "http://localhost:8181",
  restaurantServiceUrl: "http://localhost:8183",
};

export function loadConfig(): PanelConfig {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw);
    return {
      customerServiceUrl: parsed.customerServiceUrl || DEFAULT_CONFIG.customerServiceUrl,
      orderServiceUrl: parsed.orderServiceUrl || DEFAULT_CONFIG.orderServiceUrl,
      restaurantServiceUrl: parsed.restaurantServiceUrl || DEFAULT_CONFIG.restaurantServiceUrl,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: PanelConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
