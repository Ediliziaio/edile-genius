/**
 * Normalize a Supabase Edge Function response.
 *
 * `supabase.functions.invoke()` returns `{ data, error }`.
 * Our Edge Functions return `{ ok, data, request_id }` via `jsonOk()`.
 * So `invoke().data` = `{ ok, data: <actual payload> }`.
 *
 * This helper unwraps the envelope so callers always get the inner payload.
 */
export function unwrapEdge<T = Record<string, unknown>>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') return raw as T;

  const obj = raw as Record<string, unknown>;

  // Standard envelope: { ok: true, data: { ... } }
  if ('ok' in obj && 'data' in obj && typeof obj.data === 'object' && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    // Guard against double-wrapping: { ok, data: { ok, data: {...} } }
    if ('ok' in inner && 'data' in inner && typeof inner.data === 'object' && inner.data !== null) {
      return inner.data as T;
    }
    return inner as T;
  }

  // Already flat / legacy
  return obj as T;
}
