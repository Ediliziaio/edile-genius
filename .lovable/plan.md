

# Doc 7/7: Hub + Integration + Test — Gap Analysis & Plan

## Already Implemented

Everything Doc 7 proposes is already in place:

- **PreventivoHub page** (`src/pages/app/PreventivoHub.tsx`) — Full hub with hero, KPIs, onboarding steps, tabs (overview/KB/template), recent preventivi list, quick actions. Working.
- **Routes** — All routes exist in `src/App.tsx`: `/app/preventivo-hub`, `/app/preventivi`, `/app/preventivi/nuovo`, `/app/preventivi/:id`, `/app/preventivo-kb`, `/app/preventivi/templates`, `/app/preventivi/templates/nuovo`, `/app/preventivi/templates/:id`.
- **Sidebar navigation** — "VENDITE AVANZATE" section in `SidebarNav.tsx` with Hub Preventivi, Tutti i Preventivi, Knowledge Base, Template links.
- **Email edge function** (`supabase/functions/invia-preventivo-email/index.ts`) — Already enhanced in Doc 5 with PDF base64 attachment + HTML fallback link.
- **Storage buckets** — `preventivo-kb` and `preventivi-pdf` already exist.
- **DB function** — `genera_numero_preventivo()` trigger exists, `search_kb_chunks()` RPC exists.

## What Doc 7 Proposes vs What Exists

Doc 7 references `azienda_id`, `azienda_members`, and `aziende` tables — none of these exist. The project uses `company_id` / `companies` / `profiles.company_id`. The doc's SQL migrations would fail. The RLS policies it proposes are incompatible with the actual schema.

The doc also proposes installing `jspdf`, `html2canvas`, `@hello-pangea/dnd` — unnecessary since the project uses `@react-pdf/renderer` for PDF and already has drag-and-drop in the template builder.

## Gaps

**None.** All functionality described in Doc 7 is already implemented and working. The hub page, routes, sidebar navigation, email function, storage, and database functions are all in place.

The only pending items from earlier docs remain:
- `GEMINI_API_KEY` — not configured (deferred by user)
- `RESEND_API_KEY` — not configured (deferred by user)

## Recommendation

No code changes needed. Doc 7/7 is complete. The full Generatore Preventivo AI system (Docs 1-7) is implemented.

