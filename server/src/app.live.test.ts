import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const live = process.env.SKIP_LIVE_TESTS === "1" ? describe.skip : describe;

function start(): Promise<http.Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

live("express Store API facade (live WooCommerce)", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = await start();
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("lists live products through the public API", async () => {
    const response = await fetch(`${baseUrl}/api/products?perPage=2`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBe(2);
    expect(body.data.total).toBeGreaterThan(1000);
    expect(body.data.items[0].prices.currencyCode).toBe("ILS");
    expect(body.data.items[0].prices.price.minor).toBeDefined();
    expect(body.data.items[0].prices.price.major).toBeDefined();
  });

  it("creates a guest cart session via headers", async () => {
    const response = await fetch(`${baseUrl}/api/cart`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.session.cartToken).toBeTruthy();
    expect(body.session.nonce).toBeTruthy();
    expect(response.headers.get("x-cart-token")).toBeTruthy();
    expect(response.headers.get("x-cart-nonce")).toBeTruthy();
    expect(body.data.itemsCount).toBe(0);
  });
});
