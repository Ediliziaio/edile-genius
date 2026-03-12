

# Integrazione Firecrawl nella Knowledge Base

## Panoramica

Aggiungere un tab "Scraping" nel modal di aggiunta documenti della Knowledge Base. L'utente inserisce un URL, il sistema usa Firecrawl per estrarre il contenuto markdown della pagina, e salva il risultato come documento nella KB con il testo reale estratto (non solo il link).

## Prerequisiti

Firecrawl non e' ancora connesso al progetto. Sara' necessario collegare il connector Firecrawl prima di procedere.

## Componenti

### 1. Edge Function `firecrawl-scrape`

Nuova edge function che:
- Riceve `{ url }` dal frontend
- Valida l'URL con `isSafeUrl()` (SSRF protection)
- Chiama `https://api.firecrawl.dev/v1/scrape` con formato `markdown`
- Restituisce il markdown estratto

### 2. Modifica `add-knowledge-doc` edge function

Aggiungere supporto per `type: "scrape"`:
- Accetta `scraped_content` (il markdown gia' estratto dal frontend via firecrawl-scrape)
- Salva come documento con `type: "url"` ma con `content_preview` popolato dal contenuto scrappato
- Sync a ElevenLabs con il testo estratto invece del semplice URL

### 3. Frontend — Nuovo tab "Scraping" in `KnowledgeBase.tsx`

Nel modal "Aggiungi Documento", aggiungere un quarto tab "Scraping" (icona Globe + testo):
- Input URL
- Bottone "Analizza pagina" che chiama `firecrawl-scrape`
- Mostra anteprima del contenuto estratto
- Bottone "Salva nella Knowledge Base" che chiama `add-knowledge-doc` con il contenuto

### File modificati

| File | Modifica |
|------|----------|
| `supabase/functions/firecrawl-scrape/index.ts` | Nuova edge function |
| `supabase/config.toml` | Registrare `firecrawl-scrape` |
| `supabase/functions/add-knowledge-doc/index.ts` | Supporto `type: "scrape"` con contenuto pre-estratto |
| `src/pages/app/KnowledgeBase.tsx` | Nuovo tab "Scraping" con preview e salvataggio |

