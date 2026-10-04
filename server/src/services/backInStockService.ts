import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../utils/errors.js";
import { BackInStockStore, type DemandRow } from "./backInStockStore.js";
import { getProductByIdOrSlug } from "./productService.js";
import { stripHtml } from "./contentStudioService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/.data is git-ignored: it holds customers' email addresses.
const store = new BackInStockStore(path.resolve(here, "../../.data/back-in-stock.json"));

/** Saves a signup for a product that is really out of stock in the live catalog. */
export async function subscribeBackInStock(productId: number, email: string): Promise<{ alreadySubscribed: boolean }> {
  const product = await getProductByIdOrSlug(String(productId));
  if (product.isInStock) {
    throw new AppError("ALREADY_IN_STOCK", "This product is in stock now", 409);
  }
  const image = product.images[0];
  return store.add(product.id, email, {
    name: stripHtml(product.name),
    slug: product.slug,
    image: image ? image.thumbnail || image.src : null,
  });
}

export function getDemandRanking(): Promise<DemandRow[]> {
  return store.ranking();
}
