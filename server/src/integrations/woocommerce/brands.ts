import { storeApiRequest } from "./client.js";
import type { WooBrand } from "./types.js";

export async function listBrands(query: { page?: number; perPage?: number }) {
  return storeApiRequest<WooBrand[]>({
    method: "GET",
    path: "/products/brands",
    query: {
      page: query.page,
      per_page: query.perPage,
    },
  });
}
