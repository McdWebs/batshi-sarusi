import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.nonce",
      "req.headers['cart-token']",
      "req.headers['x-cart-nonce']",
      "req.headers['x-cart-token']",
      "WOOCOMMERCE_CONSUMER_KEY",
      "WOOCOMMERCE_CONSUMER_SECRET",
    ],
    censor: "[redacted]",
  },
});
