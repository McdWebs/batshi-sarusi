import { z } from "zod";
import { fetchInlineImage, generateJson, type InlineImage } from "../integrations/gemini/client.js";
import type { Product } from "../types/api.js";
import { cached, cacheKey } from "../utils/cache.js";
import { AppError } from "../utils/errors.js";
import { decodeEntities } from "../utils/html.js";
import { getProductByIdOrSlug, getProductsPage } from "./productService.js";

const SAMPLE_SIZE = 8;
const SAMPLE_PAGES = 3;
const SAMPLE_TTL_MS = 10 * 60_000;
const GENERATED_TTL_MS = 60 * 60_000;

/** Marketing buckets on the live store that say nothing about what a product is. */
const GENERIC_CATEGORY_NAMES = new Set(["כל המוצרים שלנו", "Uncategorized", "ללא קטגוריה"]);
const MARKETING_CATEGORY_PATTERN = /מבצע|הטבות|חיסול|המומלצים|אחרונים|סטוק|גיפט|בלאק|VIP|clearance|חדש/i;

export const generatedContentSchema = z.object({
  description: z.string().trim().min(1),
  bullets: z.array(z.string().trim().min(1)).min(1).max(8),
  seoTitle: z.string().trim().min(1),
  metaDescription: z.string().trim().min(1),
  imageAlt: z.string().trim().min(1),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;

export type StudioSample = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  image: { src: string; thumbnail: string; alt: string } | null;
  categories: string[];
  attributes: Array<{ name: string; values: string[] }>;
  price: Product["prices"];
  before: { description: string; shortDescription: string; imageAlt: string };
};

export type StudioResult = {
  productId: number;
  model: string;
  content: GeneratedContent;
};

export function stripHtml(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function limitText(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "");
}

/** Normalises whatever the model returned into the length limits the storefront and search engines expect. */
export function parseGeneratedContent(raw: unknown): GeneratedContent {
  const parsed = generatedContentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("AI_BAD_RESPONSE", "The AI service returned content in an unexpected shape", 502);
  }
  const value = parsed.data;
  return {
    description: value.description,
    bullets: value.bullets.map((bullet) => limitText(bullet.replace(/^[\s•\-–*]+/, ""), 140)),
    seoTitle: limitText(value.seoTitle, 60),
    metaDescription: limitText(value.metaDescription, 155),
    imageAlt: limitText(value.imageAlt, 125),
  };
}

export function needsContent(product: Pick<Product, "description" | "shortDescription" | "images" | "isInStock">): boolean {
  return (
    product.isInStock &&
    product.images.length > 0 &&
    stripHtml(product.description) === "" &&
    stripHtml(product.shortDescription) === ""
  );
}

function toSample(product: Product): StudioSample {
  const image = product.images[0];
  return {
    id: product.id,
    name: stripHtml(product.name),
    slug: product.slug,
    permalink: product.permalink,
    image: image ? { src: image.src, thumbnail: image.thumbnail || image.src, alt: image.alt } : null,
    categories: usefulCategories(product),
    attributes: product.attributes
      .map((attribute) => ({ name: attribute.name, values: attribute.terms.map((term) => term.name) }))
      .filter((attribute) => attribute.values.length > 0),
    price: product.prices,
    before: {
      description: stripHtml(product.description),
      shortDescription: stripHtml(product.shortDescription),
      imageAlt: image?.alt ?? "",
    },
  };
}

function usefulCategories(product: Product): string[] {
  return product.categories
    .map((category) => stripHtml(category.name))
    .filter((name) => !GENERIC_CATEGORY_NAMES.has(name) && !MARKETING_CATEGORY_PATTERN.test(name));
}

/** Real in-stock products from the live catalog whose description is still empty. */
export async function getStudioSample(): Promise<StudioSample[]> {
  return cached(cacheKey(["studio", "sample"]), SAMPLE_TTL_MS, async () => {
    const found: StudioSample[] = [];
    for (let page = 1; page <= SAMPLE_PAGES && found.length < SAMPLE_SIZE; page += 1) {
      const result = await getProductsPage({
        page,
        perPage: 100,
        stockStatus: "instock",
        orderby: "date",
        order: "desc",
      });
      for (const product of result.items) {
        if (needsContent(product) && product.type === "simple") {
          found.push(toSample(product));
          if (found.length >= SAMPLE_SIZE) break;
        }
      }
    }
    return found;
  });
}

const SYSTEM_PROMPT = `You are a senior Hebrew e-commerce copywriter for "Batshi Home" (בתשי הום), an Israeli retailer of kitchenware, tableware, home organisation and textiles. Write product page content in natural, warm, modern Hebrew for Israeli shoppers.

Hard rules:
- Use ONLY facts present in the product data or clearly visible in the photo. Never invent materials, dimensions, capacity, weight, brand names, certifications, warranty, "dishwasher safe" or similar claims. If something is not known, leave it out.
- Do not mention prices, discounts, shipping, stock or delivery times.
- No emojis, no exclamation-mark spam, no ALL CAPS, no filler such as "איכות ללא פשרות".
- Describe what the product is and how it is used in a home, in concrete terms. Mention colours or shape only if visible in the photo.
- Categories may include marketing buckets; use them only if they help describe the product.
- Write the alt text as a plain factual description of what the photo shows.

Output fields:
- description: by default 50-90 words, 2 short paragraphs, plain text.
- bullets: by default 3 to 5 short bullet points (each under 12 words) of verifiable features, no leading symbols.
- The word counts above are defaults only. When an editor instruction asks for a different length, tone or style, the instruction wins over them. The no-invention rules never change.
- seoTitle: up to 60 characters, product name first, Hebrew.
- metaDescription: up to 155 characters, a natural sentence that invites clicking.
- imageAlt: up to 125 characters.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    description: { type: "STRING" },
    bullets: { type: "ARRAY", items: { type: "STRING" } },
    seoTitle: { type: "STRING" },
    metaDescription: { type: "STRING" },
    imageAlt: { type: "STRING" },
  },
  required: ["description", "bullets", "seoTitle", "metaDescription", "imageAlt"],
  propertyOrdering: ["description", "bullets", "seoTitle", "metaDescription", "imageAlt"],
};

export function buildProductPrompt(sample: Pick<StudioSample, "name" | "categories" | "attributes">, hasImage: boolean): string {
  const lines = [`Product name: ${sample.name}`];
  lines.push(`Categories: ${sample.categories.length ? sample.categories.join(", ") : "(none useful)"}`);
  if (sample.attributes.length) {
    lines.push(`Attributes: ${sample.attributes.map((attribute) => `${attribute.name}: ${attribute.values.join(" / ")}`).join("; ")}`);
  }
  lines.push(hasImage ? "A product photo is attached." : "No usable photo is available; rely on the name and categories only.");
  return lines.join("\n");
}

async function loadImage(product: Product): Promise<InlineImage | null> {
  const image = product.images[0];
  if (!image) return null;
  return (await fetchInlineImage(image.src)) ?? (image.thumbnail ? await fetchInlineImage(image.thumbnail) : null);
}

export type Revision = { instruction: string; previous: GeneratedContent };

export function buildRevisionPrompt(basePrompt: string, revision: Revision): string {
  return [
    basePrompt,
    "",
    "Revise the existing draft below for this product, following the editor's instruction. The instruction takes priority over the default lengths and style in the system prompt: if it asks for shorter, the new description must be clearly shorter than the current one (about a third fewer words, and fewer bullets or shorter bullets), and the same for the other fields; if it asks for another tone, change the wording, not only a few words. Keep the facts and the no-invention rules: do not add anything that is not in the product data or the photo. Return all fields again.",
    `Editor instruction: ${revision.instruction}`,
    `Current draft (JSON): ${JSON.stringify(revision.previous)}`,
  ].join("\n");
}

async function generateFresh(productId: number, model: string, revision?: Revision): Promise<StudioResult> {
  const product = await getProductByIdOrSlug(String(productId));
  const sample = toSample(product);
  const image = await loadImage(product);
  const base = buildProductPrompt(sample, image !== null);
  const { json } = await generateJson({
    system: SYSTEM_PROMPT,
    prompt: revision ? buildRevisionPrompt(base, revision) : base,
    image,
    schema: RESPONSE_SCHEMA,
  });
  return { productId, model, content: parseGeneratedContent(json) };
}

export async function generateStudioContent(productId: number, model: string, revision?: Revision): Promise<StudioResult> {
  // A rephrase is a one-off edit, so it is never cached or served from the cache.
  if (revision) return generateFresh(productId, model, revision);
  return cached(cacheKey(["studio", "content", productId, model]), GENERATED_TTL_MS, () => generateFresh(productId, model));
}
