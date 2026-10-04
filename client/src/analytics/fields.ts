/** Which checkout form field a focused element is, from its standard autocomplete hint. Field names, never values. */

const BY_AUTOCOMPLETE: Record<string, string> = {
  "given-name": "first_name",
  "family-name": "last_name",
  organization: "company",
  "address-line1": "address1",
  "address-line2": "address2",
  "postal-code": "postcode",
  "address-level2": "city",
  tel: "phone",
  email: "email",
};

type Focusable = { tagName: string; getAttribute(name: string): string | null };

export function checkoutFieldId(element: Focusable): string | null {
  const tag = element.tagName.toLowerCase();
  if (tag !== "input" && tag !== "textarea" && tag !== "select") return null;
  const type = (element.getAttribute("type") ?? "").toLowerCase();
  if (type === "checkbox" || type === "radio" || type === "hidden") return null;
  const hint = (element.getAttribute("autocomplete") ?? "").toLowerCase();
  const mapped = BY_AUTOCOMPLETE[hint];
  if (mapped) return mapped;
  return tag === "textarea" ? "notes" : null;
}
