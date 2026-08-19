import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import { corsOrigins } from "./config/env.js";
import { logger } from "./utils/logger.js";
import {
  bannersRouter,
  brandsRouter,
  cartRouter,
  categoriesRouter,
  healthRouter,
  pagesRouter,
  productsRouter,
  searchRouter,
} from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { CART_SESSION_HEADERS } from "./middleware/cartSession.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, _res, next) => {
    req.id = crypto.randomUUID();
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      exposedHeaders: CART_SESSION_HEADERS,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Cart-Token",
        "X-Cart-Nonce",
        "Cart-Token",
        "Nonce",
      ],
    }),
  );

  app.use(express.json({ limit: "32kb" }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      logger.info(
        {
          requestId: req.id,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - started,
        },
        "http.request",
      );
    });
    next();
  });

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.originalUrl.split("?")[0] === "/health",
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        });
      },
    }),
  );

  app.use("/health", healthRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/pages", pagesRouter);
  app.use("/api/banners", bannersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
