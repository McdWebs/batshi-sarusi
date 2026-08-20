import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCartItem,
  applyCoupon,
  getCart,
  removeCartItem,
  removeCoupon,
  selectShippingRate,
  updateCartItem,
} from "../api/store";
import type { Cart, Money } from "../api/types";
import { useUiStore } from "../store/ui";
import { decodeHtmlEntities } from "../utils/format";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });
}

function moneyDecimals(money: Money) {
  const fraction = money.major.split(".")[1];
  return fraction?.length ?? Math.max(0, money.minor.length - money.major.replace(".", "").length);
}

function fromMinor(minor: number, decimals: number): Money {
  const safe = Math.max(0, Math.round(minor));
  return {
    minor: String(safe),
    major: (safe / 10 ** decimals).toFixed(decimals),
  };
}

function adjustMoney(money: Money, deltaMinor: number): Money {
  return fromMinor(Number(money.minor) + deltaMinor, moneyDecimals(money));
}

function lineUnitMinor(item: Cart["items"][number]) {
  const priced = Number(item.prices?.price.minor);
  if (Number.isFinite(priced) && priced > 0) return priced;
  if (item.quantity <= 0) return 0;
  return Math.round(Number(item.totals.totalPrice.minor) / item.quantity);
}

function withOptimisticQuantity(cart: Cart, key: string, quantity: number): Cart {
  const items = cart.items
    .map((item) => {
      if (item.key !== key) return item;
      const unit = lineUnitMinor(item);
      const nextQty = Math.max(0, quantity);
      if (nextQty === 0) return null;
      return {
        ...item,
        quantity: nextQty,
        totals: { totalPrice: fromMinor(unit * nextQty, moneyDecimals(item.totals.totalPrice)) },
      };
    })
    .filter((item): item is Cart["items"][number] => item != null);

  const previous = cart.items.find((item) => item.key === key);
  const next = items.find((item) => item.key === key);
  const deltaMinor = Number(next?.totals.totalPrice.minor ?? 0) - Number(previous?.totals.totalPrice.minor ?? 0);
  const deltaCount = (next?.quantity ?? 0) - (previous?.quantity ?? 0);

  return {
    ...cart,
    items,
    itemsCount: Math.max(0, cart.itemsCount + deltaCount),
    totals: {
      ...cart.totals,
      totalItems: adjustMoney(cart.totals.totalItems, deltaMinor),
      totalPrice: adjustMoney(cart.totals.totalPrice, deltaMinor),
    },
  };
}

function withOptimisticRemove(cart: Cart, key: string): Cart {
  const removed = cart.items.find((item) => item.key === key);
  if (!removed) return cart;
  const deltaMinor = -Number(removed.totals.totalPrice.minor);
  return {
    ...cart,
    items: cart.items.filter((item) => item.key !== key),
    itemsCount: Math.max(0, cart.itemsCount - removed.quantity),
    totals: {
      ...cart.totals,
      totalItems: adjustMoney(cart.totals.totalItems, deltaMinor),
      totalPrice: adjustMoney(cart.totals.totalPrice, deltaMinor),
    },
  };
}

function withOptimisticShipping(cart: Cart, packageId: number, rateId: string): Cart {
  const pkg = cart.shippingRates.find((entry) => entry.packageId === packageId);
  if (!pkg) return cart;
  const nextRate = pkg.rates.find((rate) => rate.rateId === rateId);
  if (!nextRate) return cart;

  const previousRate = pkg.rates.find((rate) => rate.selected);
  const previousShipping = Number(cart.totals.totalShipping?.minor ?? previousRate?.price.minor ?? 0);
  const nextShipping = Number(nextRate.price.minor);
  const deltaMinor = nextShipping - previousShipping;

  return {
    ...cart,
    shippingRates: cart.shippingRates.map((entry) =>
      entry.packageId !== packageId
        ? entry
        : {
            ...entry,
            rates: entry.rates.map((rate) => ({
              ...rate,
              selected: rate.rateId === rateId,
            })),
          },
    ),
    totals: {
      ...cart.totals,
      totalShipping: nextRate.price,
      totalPrice: adjustMoney(cart.totals.totalPrice, deltaMinor),
    },
  };
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart, variables) => {
      queryClient.setQueryData(["cart"], cart);
      useUiStore.getState().setNotice({ message: "המוצר נוסף לסל", severity: "success" });
      useUiStore.getState().setAddedProductId(variables.id);
    },
    onError: (error) => {
      useUiStore.getState().setNotice({
        message: error instanceof Error ? decodeHtmlEntities(error.message) : "לא הצלחנו להוסיף לסל",
        severity: "error",
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ key, quantity }: { key: string; quantity: number }) => updateCartItem(key, quantity),
    onMutate: async ({ key, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      if (previous) {
        queryClient.setQueryData(["cart"], withOptimisticQuantity(previous, key, quantity));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["cart"], context.previous);
    },
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  const removeItem = useMutation({
    mutationFn: removeCartItem,
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      if (previous) {
        queryClient.setQueryData(["cart"], withOptimisticRemove(previous, key));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["cart"], context.previous);
    },
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  const coupon = useMutation({
    mutationFn: applyCoupon,
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });
  const dropCoupon = useMutation({
    mutationFn: removeCoupon,
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });
  const shipping = useMutation({
    mutationFn: ({ packageId, rateId }: { packageId: number; rateId: string }) =>
      selectShippingRate(packageId, rateId),
    onMutate: async ({ packageId, rateId }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      if (previous) {
        queryClient.setQueryData(["cart"], withOptimisticShipping(previous, packageId, rateId));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["cart"], context.previous);
      useUiStore.getState().setNotice({
        message: error instanceof Error ? decodeHtmlEntities(error.message) : "לא הצלחנו לעדכן משלוח",
        severity: "error",
      });
    },
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  return { addItem, updateItem, removeItem, coupon, dropCoupon, shipping, invalidate };
}
