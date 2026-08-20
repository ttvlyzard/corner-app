// Wraps fetch so a non-JSON or empty response body (which happens on an
// unhandled server error, a redirect, or a dropped connection) never crashes
// the caller — it just comes back as ok: false with a readable error message
// instead of throwing "Unexpected end of JSON input" mid-render.
export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    return { ok: false, status: 0, data: null, error: "Network error — check your connection" };
  }

  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, status: res.status, data: null, error: "Unexpected response from server" };
  }

  if (!res.ok) {
    const message = (data as any)?.error ?? `Request failed (${res.status})`;
    return { ok: false, status: res.status, data, error: message };
  }

  return { ok: true, status: res.status, data, error: null };
}
