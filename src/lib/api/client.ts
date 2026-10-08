import type { ApiAlert, DetectionResult } from "./types";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

const TOKEN_KEY = "cnp_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
export function clearToken(): void {
  setToken(null);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the backend at ${API_BASE}. Is the server running?`);
  }

  if (res.status === 401) clearToken();

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; details?: unknown };
    const message = err.error || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, err.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ------------------------- Realtime (SSE) -------------------------

export type RealtimeEvent =
  | { type: "alert"; data: ApiAlert }
  | { type: "detection"; data: DetectionResult };

type Handler = (evt: RealtimeEvent) => void;

let source: EventSource | null = null;
let sourceToken: string | null = null;
const handlers = new Set<Handler>();

/** Subscribe to backend realtime events. Returns an unsubscribe function. */
export function subscribeRealtime(handler: Handler): () => void {
  handlers.add(handler);
  ensureStream();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) closeStream();
  };
}

function ensureStream() {
  const token = getToken();
  if (!token) return;
  if (source && sourceToken === token) return;
  closeStream();
  sourceToken = token;
  source = new EventSource(`${API_BASE}/events/stream?token=${encodeURIComponent(token)}`);
  source.addEventListener("alert", (e) => {
    const data = JSON.parse((e as MessageEvent).data) as ApiAlert;
    handlers.forEach((h) => h({ type: "alert", data }));
  });
  source.addEventListener("detection", (e) => {
    const data = JSON.parse((e as MessageEvent).data) as DetectionResult;
    handlers.forEach((h) => h({ type: "detection", data }));
  });
  source.onerror = () => {
    // EventSource auto-reconnects; nothing to do.
  };
}

export function closeStream() {
  if (source) source.close();
  source = null;
  sourceToken = null;
}
