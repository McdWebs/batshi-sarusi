import * as wooCart from "../integrations/woocommerce/cart.js";
import { mapCart, toWooAddress } from "../integrations/woocommerce/mappers.js";
import { StoreApiError } from "../integrations/woocommerce/mapError.js";
import type { Address, Cart, CartSession } from "../types/api.js";
import type { StoreApiResult, StoreApiSession, WooCart } from "../integrations/woocommerce/types.js";

export type CartResult = {
  cart: Cart;
  session: CartSession;
  status: number;
};

function toClientSession(session: StoreApiSession): CartSession {
  return {
    cartToken: session.cartToken,
    nonce: session.nonce,
  };
}

function wrap(result: StoreApiResult<WooCart>): CartResult {
  return {
    cart: mapCart(result.data),
    session: toClientSession(result.session),
    status: result.status,
  };
}

async function withCartSession(
  session: StoreApiSession | null,
  mutate: (session: StoreApiSession) => Promise<StoreApiResult<WooCart>>,
): Promise<CartResult> {
  let current = session;
  if (!current?.cartToken || !current.nonce) {
    const bootstrap = await wooCart.getCart(current);
    current = bootstrap.session;
  }
  try {
    return wrap(await mutate(current));
  } catch (error) {
    if (error instanceof StoreApiError && error.code === "CART_SESSION_REQUIRED") {
      const bootstrap = await wooCart.getCart(current);
      return wrap(await mutate(bootstrap.session));
    }
    throw error;
  }
}

export async function readCart(session: StoreApiSession | null): Promise<CartResult> {
  return wrap(await wooCart.getCart(session));
}

export async function addItem(
  session: StoreApiSession | null,
  input: { id: number; quantity: number; variation?: Array<{ attribute: string; value: string }> },
): Promise<CartResult> {
  return withCartSession(session, (current) => wooCart.addCartItem(current, input));
}

export async function updateItem(session: StoreApiSession | null, key: string, quantity: number): Promise<CartResult> {
  return withCartSession(session, (current) => wooCart.updateCartItem(current, key, quantity));
}

export async function removeItem(session: StoreApiSession | null, key: string): Promise<CartResult> {
  return withCartSession(session, (current) => wooCart.removeCartItem(current, key));
}

export async function updateCustomer(
  session: StoreApiSession | null,
  input: { shippingAddress?: Partial<Address>; billingAddress?: Partial<Address> },
): Promise<CartResult> {
  return withCartSession(session, (current) =>
    wooCart.updateCartCustomer(current, {
      shipping_address: toWooAddress(input.shippingAddress),
      billing_address: toWooAddress(input.billingAddress),
    }),
  );
}

export async function selectShipping(
  session: StoreApiSession | null,
  input: { packageId: number; rateId: string },
): Promise<CartResult> {
  return withCartSession(session, (current) =>
    wooCart.selectShippingRate(current, { package_id: input.packageId, rate_id: input.rateId }),
  );
}

export async function applyCartCoupon(session: StoreApiSession | null, code: string): Promise<CartResult> {
  return withCartSession(session, (current) => wooCart.applyCoupon(current, code));
}

export async function removeCartCoupon(session: StoreApiSession | null, code: string): Promise<CartResult> {
  return withCartSession(session, (current) => wooCart.removeCoupon(current, code));
}
