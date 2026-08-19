import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as store from "../controllers/storeController.js";

export const healthRouter = Router();
healthRouter.get("/", asyncHandler(store.health));

export const productsRouter = Router();
productsRouter.get("/", asyncHandler(store.listProducts));
productsRouter.get("/:idOrSlug", asyncHandler(store.getProduct));

export const categoriesRouter = Router();
categoriesRouter.get("/", asyncHandler(store.listCategories));

export const brandsRouter = Router();
brandsRouter.get("/", asyncHandler(store.listBrands));

export const searchRouter = Router();
searchRouter.get("/", asyncHandler(store.searchProducts));

export const cartRouter = Router();
cartRouter.get("/", asyncHandler(store.getCart));
cartRouter.post("/items", asyncHandler(store.addCartItem));
cartRouter.put("/items/:key", asyncHandler(store.updateCartItem));
cartRouter.delete("/items/:key", asyncHandler(store.deleteCartItem));
cartRouter.post("/customer", asyncHandler(store.updateCartCustomer));
cartRouter.post("/shipping-rate", asyncHandler(store.selectCartShipping));
cartRouter.post("/coupon", asyncHandler(store.applyCoupon));
cartRouter.delete("/coupon", asyncHandler(store.deleteCoupon));

export const pagesRouter = Router();
pagesRouter.get("/", asyncHandler(store.listPages));
pagesRouter.get("/:slug", asyncHandler(store.getPage));

export const bannersRouter = Router();
bannersRouter.get("/", asyncHandler(store.listBanners));
