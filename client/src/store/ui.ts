import { create } from "zustand";

type Notice = {
  message: string;
  severity: "success" | "error";
} | null;

type UiState = {
  cartOpen: boolean;
  navOpen: boolean;
  notice: Notice;
  addedProductId: number | null;
  setCartOpen: (open: boolean) => void;
  setNavOpen: (open: boolean) => void;
  setNotice: (notice: Notice) => void;
  setAddedProductId: (id: number | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  navOpen: false,
  notice: null,
  addedProductId: null,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setNavOpen: (navOpen) => set({ navOpen }),
  setNotice: (notice) => set({ notice }),
  setAddedProductId: (addedProductId) => set({ addedProductId }),
}));
