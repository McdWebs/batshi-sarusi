import type { Request, Response } from "express";
import { getBrandsPage } from "../services/brandService.js";
import { getCategoriesPage } from "../services/categoryService.js";
import { getProductByIdOrSlug, getProductsPage } from "../services/productService.js";
import {
  addItem,
  applyCartCoupon,
  readCart,
  removeCartCoupon,
  removeItem,
  selectShipping,
  updateCustomer,
  updateItem,
} from "../services/cartService.js";
import { readCartSession } from "../middleware/cartSession.js";
import { parseWith } from "../middleware/validate.js";
import {
  categoryListQuerySchema,
  productIdParamSchema,
  productListQuerySchema,
  searchQuerySchema,
} from "../schemas/products.js";
import {
  addCartItemSchema,
  cartItemKeySchema,
  couponSchema,
  selectShippingSchema,
  updateCartItemSchema,
  updateCustomerSchema,
} from "../schemas/cart.js";
import { sendCartSuccess, sendSuccess } from "../utils/http.js";
import {
  getPageBySlug,
  listBanners as listWpBanners,
  listPages as listWpPages,
  mapPage,
} from "../integrations/wordpress/content.js";
import { AppError } from "../utils/errors.js";
import { z } from "zod";

export async function health(_req: Request, res: Response) {
  res.status(200).json({ status: "ok" });
}

export async function listProducts(req: Request, res: Response) {
  const query = parseWith(productListQuerySchema, req.query);
  const data = await getProductsPage(query);
  sendSuccess(res, data);
}

export async function getProduct(req: Request, res: Response) {
  const { idOrSlug } = parseWith(productIdParamSchema, req.params);
  const data = await getProductByIdOrSlug(idOrSlug);
  sendSuccess(res, data);
}

export async function searchProducts(req: Request, res: Response) {
  const query = parseWith(searchQuerySchema, req.query);
  const data = await getProductsPage({
    page: query.page,
    perPage: query.perPage,
    search: query.q,
    orderby: query.orderby,
    order: query.order,
  });
  sendSuccess(res, data);
}

export async function listCategories(req: Request, res: Response) {
  const query = parseWith(categoryListQuerySchema, req.query);
  const data = await getCategoriesPage(query);
  sendSuccess(res, data);
}

export async function listBrands(req: Request, res: Response) {
  const query = parseWith(categoryListQuerySchema, req.query);
  const data = await getBrandsPage(query);
  sendSuccess(res, data);
}

export async function getCart(req: Request, res: Response) {
  const result = await readCart(readCartSession(req));
  sendCartSuccess(res, result.cart, result.session);
}

export async function addCartItem(req: Request, res: Response) {
  const body = parseWith(addCartItemSchema, req.body);
  const result = await addItem(readCartSession(req), body);
  sendCartSuccess(res, result.cart, result.session, 201);
}

export async function updateCartItem(req: Request, res: Response) {
  const { key } = parseWith(cartItemKeySchema, req.params);
  const body = parseWith(updateCartItemSchema, req.body);
  const result = await updateItem(readCartSession(req), key, body.quantity);
  sendCartSuccess(res, result.cart, result.session);
}

export async function deleteCartItem(req: Request, res: Response) {
  const { key } = parseWith(cartItemKeySchema, req.params);
  const result = await removeItem(readCartSession(req), key);
  sendCartSuccess(res, result.cart, result.session);
}

export async function updateCartCustomer(req: Request, res: Response) {
  const body = parseWith(updateCustomerSchema, req.body);
  const result = await updateCustomer(readCartSession(req), body);
  sendCartSuccess(res, result.cart, result.session);
}

export async function selectCartShipping(req: Request, res: Response) {
  const body = parseWith(selectShippingSchema, req.body);
  const result = await selectShipping(readCartSession(req), body);
  sendCartSuccess(res, result.cart, result.session);
}

export async function applyCoupon(req: Request, res: Response) {
  const body = parseWith(couponSchema, req.body);
  const result = await applyCartCoupon(readCartSession(req), body.code);
  sendCartSuccess(res, result.cart, result.session);
}

export async function deleteCoupon(req: Request, res: Response) {
  const body = parseWith(couponSchema, { ...req.body, ...req.query });
  const result = await removeCartCoupon(readCartSession(req), body.code);
  sendCartSuccess(res, result.cart, result.session);
}

export async function listPages(_req: Request, res: Response) {
  const result = await listWpPages();
  sendSuccess(res, (result.data ?? []).map(mapPage));
}

export async function getPage(req: Request, res: Response) {
  const slug = parseWith(z.object({ slug: z.string().min(1) }), req.params).slug;
  const result = await getPageBySlug(slug);
  const page = (result.data ?? [])[0];
  if (!page) {
    throw new AppError("NOT_FOUND", "Page not found", 404);
  }
  sendSuccess(res, mapPage(page));
}

export async function listBanners(_req: Request, res: Response) {
  const result = await listWpBanners();
  sendSuccess(res, (result.data ?? []).map(mapPage));
}
