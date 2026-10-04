import express, { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import rateLimit from "express-rate-limit";
import * as store from "../controllers/storeController.js";
import * as analytics from "../controllers/analyticsController.js";
import { requireStudioKey } from "../middleware/studioAuth.js";

export const healthRouter = Router();
healthRouter.get("/", asyncHandler(store.health));

export const productsRouter = Router();
productsRouter.get("/", asyncHandler(store.listProducts));
productsRouter.get("/:idOrSlug", asyncHandler(store.getProduct));

export const categoriesRouter = Router();
categoriesRouter.get("/previews", asyncHandler(store.listCategoryPreviews));
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

export const studioRouter = Router();
// Every studio route is owner-only: slow down guessing of the access code, then check it.
studioRouter.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests, try again in a minute" } });
    },
  }),
  requireStudioKey,
);
studioRouter.get("/back-in-stock", asyncHandler(store.demandRankingHandler));
studioRouter.get("/analytics/summary", asyncHandler(analytics.analyticsSummaryHandler));
studioRouter.get("/sample", asyncHandler(store.listStudioSample));
studioRouter.post(
  "/generate",
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many AI requests, try again in a minute" } });
    },
  }),
  asyncHandler(store.generateStudioContentHandler),
);

export const backInStockRouter = Router();
backInStockRouter.post(
  "/",
  rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests, try again in a minute" } });
    },
  }),
  asyncHandler(store.subscribeBackInStockHandler),
);

const eventsLimit = (limit: number, message: string) =>
  rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message } });
    },
  });

// Public: the storefront reports what visitors do (only after they accepted statistics cookies).
export const eventsRouter = Router();
eventsRouter.post(
  "/",
  eventsLimit(120, "Too many events, slow down"),
  express.text({ type: "*/*", limit: "32kb" }),
  asyncHandler(analytics.ingestEventsHandler),
);
eventsRouter.post(
  "/forget",
  eventsLimit(10, "Too many requests, try again in a minute"),
  express.text({ type: "*/*", limit: "4kb" }),
  asyncHandler(analytics.forgetVisitorHandler),
);
