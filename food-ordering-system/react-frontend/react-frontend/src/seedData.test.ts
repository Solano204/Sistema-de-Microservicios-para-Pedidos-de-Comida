import { describe, it, expect } from "vitest";
import { SEED_CUSTOMERS, SEED_RESTAURANTS, findSeedProduct } from "./seedData";

describe("seedData", () => {
  it("has at least one seed customer and restaurant", () => {
    expect(SEED_CUSTOMERS.length).toBeGreaterThan(0);
    expect(SEED_RESTAURANTS.length).toBeGreaterThan(0);
  });

  describe("findSeedProduct", () => {
    it("finds a product nested under any seed restaurant", () => {
      const product = findSeedProduct("d215b5f8-0249-4dc5-89a3-51fd148cfb48");

      expect(product).toEqual({
        productId: "d215b5f8-0249-4dc5-89a3-51fd148cfb48",
        name: "product_2",
        price: 1.0,
        available: true,
      });
    });

    it("returns undefined for an id that isn't seeded", () => {
      expect(findSeedProduct("not-a-real-id")).toBeUndefined();
    });
  });
});
