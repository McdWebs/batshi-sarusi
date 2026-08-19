import { describe, expect, it } from "vitest";
import { storeApiRequest } from "./client.js";
import { mapProduct, mapCart } from "./mappers.js";
import type { WooCart, WooProduct } from "./types.js";

const live = process.env.SKIP_LIVE_TESTS === "1" ? describe.skip : describe;

live("live WooCommerce Store API", () => {
  it("lists products with pagination headers", async () => {
    const result = await storeApiRequest<WooProduct[]>({
      method: "GET",
      path: "/products",
      query: { per_page: 2, page: 1 },
    });
    expect(result.status).toBe(200);
    expect(result.total).toBeGreaterThan(1000);
    expect(result.data.length).toBe(2);
    const product = mapProduct(result.data[0]!);
    expect(product.id).toBeGreaterThan(0);
    expect(product.prices?.currencyCode).toBe("ILS");
    expect(product.prices?.price.minor).toMatch(/^\d+$/);
  });

  it("searches Hebrew text without loading the full catalog", async () => {
    const result = await storeApiRequest<WooProduct[]>({
      method: "GET",
      path: "/products",
      query: { search: "כוס", per_page: 3 },
    });
    expect(result.status).toBe(200);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(3406);
  });

  it("loads a product by numeric id", async () => {
    const result = await storeApiRequest<WooProduct>({
      method: "GET",
      path: "/products/36870",
    });
    expect(result.status).toBe(200);
    expect(result.data.sku).toBe("X6067");
    expect(result.data.on_sale).toBe(true);
  });

  it("issues Cart-Token and Nonce on GET /cart", async () => {
    const result = await storeApiRequest<WooCart>({
      method: "GET",
      path: "/cart",
    });
    expect(result.status).toBe(200);
    expect(result.session.cartToken).toBeTruthy();
    expect(result.session.nonce).toBeTruthy();
    const cart = mapCart(result.data);
    expect(cart.itemsCount).toBe(0);
    expect(cart.totals.currencyCode).toBe("ILS");
  });

  it("adds an item using Nonce and Cart-Token from WooCommerce", async () => {
    const empty = await storeApiRequest<WooCart>({ method: "GET", path: "/cart" });
    const added = await storeApiRequest<WooCart>({
      method: "POST",
      path: "/cart/add-item",
      session: empty.session,
      body: { id: 36870, quantity: 1 },
    });
    expect(added.status).toBe(201);
    const cart = mapCart(added.data);
    expect(cart.itemsCount).toBe(1);
    expect(cart.items[0]?.id).toBe(36870);
    expect(cart.totals.totalItems.minor).toBe("5900");
    expect(added.session.nonce).toBeTruthy();
    expect(added.session.cartToken).toBeTruthy();

    const key = cart.items[0]?.key;
    expect(key).toBeTruthy();

    const updated = await storeApiRequest<WooCart>({
      method: "POST",
      path: "/cart/update-item",
      session: added.session,
      body: { key, quantity: 2 },
    });
    expect(updated.status).toBe(200);
    expect(mapCart(updated.data).items[0]?.quantity).toBe(2);

    const removed = await storeApiRequest<WooCart>({
      method: "POST",
      path: "/cart/remove-item",
      session: updated.session,
      body: { key },
    });
    expect(removed.status).toBe(200);
    expect(mapCart(removed.data).itemsCount).toBe(0);
  });
});
