import type { Product } from "../api/types";
import { SITE_NAME } from "./config";
import { stripHtml, truncate } from "./text";

type Crumb = { name: string; path: string };

const abs = (origin: string, path: string) => `${origin.replace(/\/$/, "")}${path}`;

export function organizationJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: abs(origin, "/"),
    logo: abs(origin, "/favicon-192x192.png"),
  };
}

/** Lets Google show a search box for the shop under the home page result. */
export function websiteJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "בתשי הום",
    url: abs(origin, "/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${abs(origin, "/search")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(origin: string, trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "בית", path: "/" }, ...trail].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(origin, crumb.path),
    })),
  };
}

/**
 * Product structured data. A product without a price in the shop gets no offer at all, because Google rejects
 * an offer without a price. Options with different prices become one offer with a low and a high price.
 */
export function productJsonLd(product: Product, origin: string, path: string, description: string) {
  const prices = product.prices;
  const hasPrice = Boolean(prices && Number(prices.price.minor) > 0);
  const range = prices?.priceRange && prices.priceRange.minAmount.minor !== prices.priceRange.maxAmount.minor ? prices.priceRange : null;
  const url = abs(origin, path);
  const availability = product.isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const rating = Number(product.averageRating);

  const offers = !prices || !hasPrice
    ? undefined
    : range
      ? {
          "@type": "AggregateOffer",
          priceCurrency: prices.currencyCode || "ILS",
          lowPrice: range.minAmount.major,
          highPrice: range.maxAmount.major,
          availability,
          url,
        }
      : {
          "@type": "Offer",
          priceCurrency: prices.currencyCode || "ILS",
          price: prices.price.major,
          availability,
          itemCondition: "https://schema.org/NewCondition",
          url,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: truncate(stripHtml(product.description || product.shortDescription || "") || description, 500),
    url,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.images.length ? { image: product.images.slice(0, 6).map((image) => image.src) } : {}),
    ...(product.brands[0] ? { brand: { "@type": "Brand", name: product.brands[0].name } } : {}),
    ...(offers ? { offers } : {}),
    ...(rating > 0 && product.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: product.reviewCount } }
      : {}),
  };
}
