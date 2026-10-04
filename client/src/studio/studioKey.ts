const KEY = "batshi.studioKey";

/** The owner's studio access code lives in sessionStorage, so it is forgotten when the tab closes. */
export function getStudioKey(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStudioKey(value: string) {
  try {
    sessionStorage.setItem(KEY, value.trim());
  } catch {
    // Storage can be unavailable (private window); the owner just has to type the code again.
  }
}

export function clearStudioKey() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
