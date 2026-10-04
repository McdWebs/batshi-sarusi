const TOKEN_KEY = "batshi.cartToken";
const NONCE_KEY = "batshi.cartNonce";

export function readCartSession() {
  return {
    cartToken: localStorage.getItem(TOKEN_KEY),
    nonce: localStorage.getItem(NONCE_KEY),
  };
}

export function writeCartSession(session?: { cartToken: string | null; nonce: string | null } | null) {
  if (!session) return;
  if (session.cartToken) localStorage.setItem(TOKEN_KEY, session.cartToken);
  if (session.nonce) localStorage.setItem(NONCE_KEY, session.nonce);
}

export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

export type ApiFailure = { method: string; path: string; status: number; code: string };
const failureListeners: Array<(failure: ApiFailure) => void> = [];

/** The analytics tracker registers here to count failed API calls. */
export function onApiFailure(listener: (failure: ApiFailure) => void) {
  failureListeners.push(listener);
}

function reportFailure(failure: ApiFailure) {
  for (const listener of failureListeners) {
    try {
      listener(failure);
    } catch {
      // A broken listener must not break the request.
    }
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  cart?: boolean;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(apiUrl(path), window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.cart) {
    const session = readCartSession();
    if (session.cartToken) headers["X-Cart-Token"] = session.cartToken;
    if (session.nonce) headers["X-Cart-Nonce"] = session.nonce;
  }

  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    reportFailure({ method, path, status: 0, code: "NETWORK" });
    throw error;
  }

  const json = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: T; session?: { cartToken: string | null; nonce: string | null }; error?: { code: string; message: string } }
    | null;

  if (json?.session) {
    writeCartSession(json.session);
  }
  const headerToken = response.headers.get("X-Cart-Token");
  const headerNonce = response.headers.get("X-Cart-Nonce");
  if (headerToken || headerNonce) {
    writeCartSession({
      cartToken: headerToken ?? readCartSession().cartToken,
      nonce: headerNonce ?? readCartSession().nonce,
    });
  }

  if (!response.ok || json?.success === false) {
    reportFailure({ method, path, status: response.status, code: json?.error?.code ?? "UNKNOWN" });
    throw new ApiError(
      json?.error?.code ?? "WOOCOMMERCE_UNAVAILABLE",
      json?.error?.message ?? "משהו השתבש. נסו שוב בעוד רגע.",
      response.status,
    );
  }

  return json?.data as T;
}
