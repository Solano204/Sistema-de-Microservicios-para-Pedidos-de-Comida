import { describe, it, expect, beforeEach } from "vitest";
import { loadConfig, saveConfig } from "./config";

describe("config", () => {
  beforeEach(() => localStorage.clear());

  it("loadConfig returns the default URLs when nothing is stored", () => {
    expect(loadConfig()).toEqual({
      customerServiceUrl: "http://localhost:8184",
      orderServiceUrl: "http://localhost:8181",
      restaurantServiceUrl: "http://localhost:8183",
    });
  });

  it("saveConfig persists a value that loadConfig then returns", () => {
    saveConfig({
      customerServiceUrl: "http://example.test:1",
      orderServiceUrl: "http://example.test:2",
      restaurantServiceUrl: "http://example.test:3",
    });

    expect(loadConfig()).toEqual({
      customerServiceUrl: "http://example.test:1",
      orderServiceUrl: "http://example.test:2",
      restaurantServiceUrl: "http://example.test:3",
    });
  });

  it("loadConfig falls back to the default for a field missing from the stored JSON", () => {
    localStorage.setItem("food-ordering-panel:config", JSON.stringify({ customerServiceUrl: "http://only-this.test" }));

    expect(loadConfig()).toEqual({
      customerServiceUrl: "http://only-this.test",
      orderServiceUrl: "http://localhost:8181",
      restaurantServiceUrl: "http://localhost:8183",
    });
  });

  it("loadConfig falls back to the full default when the stored value is malformed JSON", () => {
    localStorage.setItem("food-ordering-panel:config", "{not json");

    expect(loadConfig()).toEqual({
      customerServiceUrl: "http://localhost:8184",
      orderServiceUrl: "http://localhost:8181",
      restaurantServiceUrl: "http://localhost:8183",
    });
  });
});
