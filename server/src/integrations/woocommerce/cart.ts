import { storeApiRequest } from "./client.js";
import type { StoreApiSession, WooAddress, WooCart } from "./types.js";

export async function getCart(session: StoreApiSession | null) {
  return storeApiRequest<WooCart>({
    method: "GET",
    path: "/cart",
    session,
  });
}

export async function addCartItem(
  session: StoreApiSession | null,
  body: { id: number; quantity: number; variation?: Array<{ attribute: string; value: string }> },
) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/add-item",
    session,
    body: {
      id: body.id,
      quantity: body.quantity,
      ...(body.variation ? { variation: body.variation } : {}),
    },
  });
}

export async function updateCartItem(session: StoreApiSession | null, key: string, quantity: number) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/update-item",
    session,
    body: { key, quantity },
  });
}

export async function removeCartItem(session: StoreApiSession | null, key: string) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/remove-item",
    session,
    body: { key },
  });
}

export async function updateCartCustomer(
  session: StoreApiSession | null,
  body: { shipping_address?: WooAddress; billing_address?: WooAddress },
) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/update-customer",
    session,
    body,
  });
}

export async function selectShippingRate(
  session: StoreApiSession | null,
  body: { package_id: number; rate_id: string },
) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/select-shipping-rate",
    session,
    body,
  });
}

export async function applyCoupon(session: StoreApiSession | null, code: string) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/apply-coupon",
    session,
    body: { code },
  });
}

export async function removeCoupon(session: StoreApiSession | null, code: string) {
  return storeApiRequest<WooCart>({
    method: "POST",
    path: "/cart/remove-coupon",
    session,
    body: { code },
  });
}
