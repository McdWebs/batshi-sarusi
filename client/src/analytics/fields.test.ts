import { describe, expect, it } from "vitest";
import { checkoutFieldId } from "./fields";

const el = (tagName: string, attrs: Record<string, string> = {}) => ({ tagName, getAttribute: (name: string) => attrs[name] ?? null });

describe("checkoutFieldId", () => {
  it("names the standard form fields from their autocomplete hint", () => {
    expect(checkoutFieldId(el("INPUT", { autocomplete: "given-name" }))).toBe("first_name");
    expect(checkoutFieldId(el("INPUT", { autocomplete: "address-level2" }))).toBe("city");
    expect(checkoutFieldId(el("INPUT", { autocomplete: "email" }))).toBe("email");
    expect(checkoutFieldId(el("INPUT", { autocomplete: "tel" }))).toBe("phone");
  });

  it("treats a free text area as the order notes", () => {
    expect(checkoutFieldId(el("TEXTAREA"))).toBe("notes");
  });

  it("ignores buttons, checkboxes, radios and unknown inputs", () => {
    expect(checkoutFieldId(el("BUTTON"))).toBeNull();
    expect(checkoutFieldId(el("INPUT", { type: "checkbox", autocomplete: "email" }))).toBeNull();
    expect(checkoutFieldId(el("INPUT", { type: "radio" }))).toBeNull();
    expect(checkoutFieldId(el("INPUT", { autocomplete: "off" }))).toBeNull();
  });
});
