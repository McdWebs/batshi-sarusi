import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../utils/errors.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TIMEOUT_MS = 60_000;
const IMAGE_TIMEOUT_MS = 15_000;
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const MAX_ATTEMPTS = 2;

export type InlineImage = { mimeType: string; data: string };

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  error?: { code?: number; status?: string; message?: string };
};

export function geminiConfigured() {
  return env.GEMINI_API_KEY.length > 0;
}

/** Downloads a public product photo so the model can look at it. Returns null when unusable. */
export async function fetchInlineImage(url: string): Promise<InlineImage | null> {
  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: IMAGE_TIMEOUT_MS,
      maxContentLength: IMAGE_MAX_BYTES,
      headers: { "User-Agent": "batshi-storefront-api/0.1" },
      validateStatus: (status) => status === 200,
    });
    const mimeType = (String(response.headers["content-type"] ?? "").split(";")[0] ?? "").trim();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return null;
    }
    return { mimeType, data: Buffer.from(response.data).toString("base64") };
  } catch (error) {
    logger.warn({ url, message: (error as Error).message }, "gemini.image_fetch_failed");
    return null;
  }
}

export type GenerateJsonRequest = {
  system: string;
  prompt: string;
  image: InlineImage | null;
  schema: Record<string, unknown>;
};

/** Calls Gemini generateContent and returns the parsed JSON object the model produced. */
export async function generateJson(request: GenerateJsonRequest): Promise<{ json: unknown; totalTokens: number }> {
  if (!geminiConfigured()) {
    throw new AppError("AI_NOT_CONFIGURED", "The AI content studio is not configured", 503);
  }

  const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
  if (request.image) {
    parts.push({ inlineData: { mimeType: request.image.mimeType, data: request.image.data } });
  }

  const started = Date.now();
  const body = {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: request.schema,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  // Gemini sheds load with 503 during demand spikes. Retry briefly, then fall back to the second model.
  const models = [...new Set([env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter(Boolean))];
  let response;
  let usedModel = env.GEMINI_MODEL;
  for (const model of models) {
    usedModel = model;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        response = await axios.post<GeminiResponse>(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`, body, {
          timeout: GEMINI_TIMEOUT_MS,
          headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
          validateStatus: () => true,
        });
      } catch (error) {
        logger.error({ model, message: (error as Error).message, ms: Date.now() - started }, "gemini.request_failed");
        throw new AppError("AI_UNAVAILABLE", "The AI service is temporarily unavailable", 503);
      }
      if (response.status !== 503) break;
      logger.warn({ model, attempt }, "gemini.overloaded");
      if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
    if (response && response.status !== 503) break;
  }
  if (!response) {
    throw new AppError("AI_UNAVAILABLE", "The AI service is temporarily unavailable", 503);
  }

  logger.info(
    { model: usedModel, status: response.status, ms: Date.now() - started, tokens: response.data.usageMetadata?.totalTokenCount },
    "gemini.generate",
  );
  if (response.status === 503) {
    throw new AppError("AI_BUSY", "The AI service is busy right now, try again in a moment", 503);
  }

  if (response.status === 429) {
    throw new AppError("AI_RATE_LIMITED", "The AI service is busy, try again in a moment", 429);
  }
  if (response.status >= 400) {
    logger.error({ status: response.status, error: response.data.error?.message }, "gemini.error_response");
    throw new AppError("AI_UNAVAILABLE", "The AI service is temporarily unavailable", 503);
  }

  const candidate = response.data.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    const reason = response.data.promptFeedback?.blockReason ?? candidate?.finishReason ?? "empty";
    throw new AppError("AI_EMPTY_RESPONSE", `The AI service returned no content (${reason})`, 502);
  }

  try {
    return { json: JSON.parse(text), totalTokens: response.data.usageMetadata?.totalTokenCount ?? 0 };
  } catch {
    throw new AppError("AI_BAD_RESPONSE", "The AI service returned an unreadable response", 502);
  }
}
