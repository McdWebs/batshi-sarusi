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
import { useUiStore } from "../store/ui";
import { decodeHtmlEntities } from "../utils/format";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });
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
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });
  const removeItem = useMutation({
    mutationFn: removeCartItem,
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
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  return { addItem, updateItem, removeItem, coupon, dropCoupon, shipping, invalidate };
}
