import { describe, expect, it } from "vitest";
import { mapWooError } from "./mapError.js";

describe("mapWooError", () => {
  it("maps missing nonce to CART_SESSION_REQUIRED", () => {
    const error = mapWooError(401, {
      code: "woocommerce_rest_missing_nonce",
      message: "חסרה כותרת לרכיב Nonce.",
    });
    expect(error.code).toBe("CART_SESSION_REQUIRED");
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain("Nonce");
  });

  it("maps 404 to NOT_FOUND", () => {
    const error = mapWooError(404, { code: "woocommerce_rest_product_invalid_id", message: "Invalid product" });
    expect(error.code).toBe("NOT_FOUND");
  });

  it("decodes HTML entities in Woo messages", () => {
    const error = mapWooError(400, {
      code: "woocommerce_rest_product_out_of_stock",
      message: 'אי אפשר להוסיף את הכמות הזו של &quot;סט 4 מאגים&quot; לסל הקניות מאחר שאין מספק מלאי (0 נותר).',
    });
    expect(error.message).toBe('אי אפשר להוסיף את הכמות הזו של "סט 4 מאגים" לסל הקניות מאחר שאין מספק מלאי (0 נותר).');
    expect(error.message).not.toContain("&quot;");
  });

  it("does not leak 5xx Woo bodies as stack traces", () => {
    const error = mapWooError(500, { code: "internal_server_error", message: "fatal" });
    expect(error.code).toBe("WOOCOMMERCE_UNAVAILABLE");
    expect(error.message).toBe("Store service temporarily unavailable");
  });
});
