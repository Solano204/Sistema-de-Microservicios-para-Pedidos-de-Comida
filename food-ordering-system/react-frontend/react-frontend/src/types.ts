// Mirrors the Java DTOs exactly (see order-service/customer-service *-application-service modules).

export type OrderStatus = "PENDING" | "PAID" | "APPROVED" | "CANCELLING" | "CANCELLED";

export interface CreateCustomerCommand {
  customerId: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface CreateCustomerResponse {
  customerId: string;
  message: string;
}

export interface OrderAddress {
  street: string;
  postalCode: string;
  city: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  subTotal: number;
}

export interface CreateOrderCommand {
  customerId: string;
  restaurantId: string;
  price: number;
  items: OrderItem[];
  address: OrderAddress;
}

export interface CreateOrderResponse {
  orderTrackingId: string;
  orderStatus: OrderStatus;
  message: string;
}

export interface TrackOrderResponse {
  orderTrackingId: string;
  orderStatus: OrderStatus;
  failureMessages: string[] | null;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

// Admin/browse read models (GET /customers, GET /orders, GET /restaurants).

export interface CustomerSummary {
  customerId: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface OrderSummary {
  orderTrackingId: string;
  customerId: string;
  restaurantId: string;
  price: number;
  orderStatus: OrderStatus;
}

export interface ProductSummary {
  productId: string;
  name: string;
  price: number;
  available: boolean;
}

export interface RestaurantSummary {
  restaurantId: string;
  name: string;
  active: boolean;
  products: ProductSummary[];
}
