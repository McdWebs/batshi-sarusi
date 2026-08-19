import { createApp } from "./app.js";
import { corsOrigins, env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      woocommerce: env.WOOCOMMERCE_BASE_URL,
      corsOrigins,
    },
    "api.listening",
  );
});
