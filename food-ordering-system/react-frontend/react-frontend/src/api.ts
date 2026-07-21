import { loadConfig } from "./config";
import type {
  CreateCustomerCommand,
  CreateCustomerResponse,
  CreateOrderCommand,
  CreateOrderResponse,
  TrackOrderResponse,
  ProblemDetail,
} from "./types";

export interface ApiCallLog {
  method: string;
  url: string;
  requestBody: unknown;
  responseStatus: number | null;
  responseBody: unknown;
}

export type ApiLogListener = (log: ApiCallLog) => void;

let logListener: ApiLogListener | null = null;

export function onApiCall(listener: ApiLogListener): void {
  logListener = listener;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function request<T>(method: string, baseUrl: string, path: string, body?: unknown): Promise<T> {
  const url = `${stripTrailingSlash(baseUrl)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    logListener?.({
      method,
      url,
      requestBody: body ?? null,
      responseStatus: null,
      responseBody: { networkError: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }

  const text = await response.text();
  let parsedBody: unknown = null;
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }
  }

  logListener?.({
    method,
    url,
    requestBody: body ?? null,
    responseStatus: response.status,
    responseBody: parsedBody,
  });

  if (!response.ok) {
    const problem = parsedBody as Partial<ProblemDetail> | null;
    throw new Error(problem?.detail ?? `HTTP ${response.status} calling ${url}`);
  }

  return parsedBody as T;
}

export function createCustomer(command: CreateCustomerCommand): Promise<CreateCustomerResponse> {
  const { customerServiceUrl } = loadConfig();
  return request<CreateCustomerResponse>("POST", customerServiceUrl, "/customers", command);
}

export function createOrder(command: CreateOrderCommand): Promise<CreateOrderResponse> {
  const { orderServiceUrl } = loadConfig();
  return request<CreateOrderResponse>("POST", orderServiceUrl, "/orders", command);
}

export function trackOrder(trackingId: string): Promise<TrackOrderResponse> {
  const { orderServiceUrl } = loadConfig();
  return request<TrackOrderResponse>("GET", orderServiceUrl, `/orders/${encodeURIComponent(trackingId)}`);
}
