import { storeApiRequest } from "./client.js";
import type { WooCategory } from "./types.js";

export async function listCategories(query: { page?: number; perPage?: number }) {
  return storeApiRequest<WooCategory[]>({
    method: "GET",
    path: "/products/categories",
    query: {
      page: query.page,
      per_page: query.perPage,
    },
  });
}
