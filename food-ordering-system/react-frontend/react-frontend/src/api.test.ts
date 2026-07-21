import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCustomer, createOrder, trackOrder } from "./api";
import { saveConfig } from "./config";

/**
 * Pins the JSON contract against the backend DTOs (CreateCustomerCommand,
 * CreateOrderCommand/OrderItem/OrderAddress, TrackOrderResponse - see
 * customer-service/order-service's *-application-service modules). Also pins
 * that requests go to each service's own origin directly (no gateway in this
 * system - see config.ts), which only works because WebCorsConfig
 * (common-application) allows cross-origin calls.
 */
function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  saveConfig({ customerServiceUrl: "http://localhost:8184", orderServiceUrl: "http://localhost:8181" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createCustomer", () => {
  it("POSTs the full CreateCustomerCommand shape to /customers on customerServiceUrl", async () => {
    const fetchMock = mockFetchOnce(201, { customerId: "c1", message: "ok" });

    await createCustomer({ customerId: "c1", username: "u1", firstName: "A", lastName: "B" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8184/customers");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ customerId: "c1", username: "u1", firstName: "A", lastName: "B" });
  });
});

describe("createOrder", () => {
  it("POSTs the full CreateOrderCommand shape (items/address nested) to /orders on orderServiceUrl", async () => {
    const fetchMock = mockFetchOnce(201, { orderTrackingId: "t1", orderStatus: "PENDING", message: "ok" });

    const command = {
      customerId: "c1",
      restaurantId: "r1",
      price: 10.5,
      items: [{ productId: "p1", quantity: 2, price: 5.25, subTotal: 10.5 }],
      address: { street: "Main St", postalCode: "1000AB", city: "Amsterdam" },
    };
    await createOrder(command);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8181/orders");
    expect(JSON.parse(init.body)).toEqual(command);
  });
});

describe("trackOrder", () => {
  it("GETs /orders/{trackingId}, URL-encoded, on orderServiceUrl", async () => {
    const fetchMock = mockFetchOnce(200, { orderTrackingId: "t1", orderStatus: "PAID", failureMessages: null });

    const result = await trackOrder("id with spaces");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8181/orders/id%20with%20spaces");
    expect(init.method).toBe("GET");
    expect(result.orderStatus).toBe("PAID");
  });

  it("throws the backend ProblemDetail.detail on a non-2xx response", async () => {
    mockFetchOnce(404, {
      type: "about:blank",
      title: "Order not found",
      status: 404,
      detail: "Order not found",
      instance: "/orders/missing",
    });
    await expect(trackOrder("missing")).rejects.toThrow("Order not found");
  });
});
