// Real values from init-data.sql (restaurant-service, payment-service) and the
// OrderPaymentSagaTest fixtures (customer-service has no seed of its own - these
// customer ids only exist because payment-service pre-seeded credit for them).

export interface SeedCustomer {
  customerId: string;
  label: string;
}

export interface SeedProduct {
  productId: string;
  name: string;
  price: number;
  available: boolean;
}

export interface SeedRestaurant {
  restaurantId: string;
  name: string;
  active: boolean;
  products: SeedProduct[];
}

export const SEED_CUSTOMERS: SeedCustomer[] = [
  { customerId: "d215b5f8-0249-4dc5-89a3-51fd148cfb41", label: "Cliente con crédito (50,000.00)" },
  { customerId: "d215b5f8-0249-4dc5-89a3-51fd148cfb43", label: "Cliente con poco crédito (100.00)" },
];

export const SEED_RESTAURANTS: SeedRestaurant[] = [
  {
    restaurantId: "d215b5f8-0249-4dc5-89a3-51fd148cfb45",
    name: "restaurant_1 (activo)",
    active: true,
    products: [
      { productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb47", name: "product_1", price: 25.0, available: false },
      { productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb48", name: "product_2", price: 1.0, available: true },
    ],
  },
  {
    restaurantId: "d215b5f8-0249-4dc5-89a3-51fd148cfb46",
    name: "restaurant_2 (inactivo)",
    active: false,
    products: [
      { productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb49", name: "product_3", price: 20.0, available: false },
      { productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb50", name: "product_4", price: 40.0, available: true },
    ],
  },
];

export function findSeedProduct(productId: string): SeedProduct | undefined {
  for (const restaurant of SEED_RESTAURANTS) {
    const product = restaurant.products.find((p) => p.productId === productId);
    if (product) return product;
  }
  return undefined;
}
