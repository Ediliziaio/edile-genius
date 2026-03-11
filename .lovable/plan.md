

# Verification Results — Template Library End-to-End

## Critical Bug Found

The template library has a **broken routing chain**. The new slugs in `CreateAgent.tsx` do not match the slugs expected by `AgentTemplateWizard.tsx`. Clicking most template cards navigates to a wizard that does not recognize the slug.

### Slug Mismatch Table

| Card slug (CreateAgent.tsx) | Wizard expects (AgentTemplateWizard.tsx) | Status |
|---|---|---|
| `richiama-lead-ads` | not in VOCAL_SLUGS, not in SLUG_TO_USE_CASE, not in getTemplateLabel | **BROKEN** — no prompt loaded, no label |
| `qualifica-serramenti` | expects `qualifica-infissi` | **BROKEN** |
| `qualifica-fotovoltaico` | `qualifica-fotovoltaico` | OK |
| `qualifica-ristrutturazione` | `qualifica-ristrutturazione` | OK |
| `conferma-appuntamenti` | expects `conferma-sopralluogo` | **BROKEN** |
| `recupera-noshow` | expects `recupero-noshow` | **BROKEN** |
| `recupera-preventivi` | expects `recupero-preventivi` | **BROKEN** |
| `followup-sopralluogo` | not in any lookup | **BROKEN** — no prompt |
| `followup-preventivi-wa` | not in any lookup | **BROKEN** |
| `assistente-whatsapp` | `assistente-whatsapp` | OK |
| `primo-contatto-wa` | not in any lookup | **BROKEN** |
| `raccolta-recensioni` | expects `recensioni-post-lavoro` | **BROKEN** |
| `verifica-soddisfazione` | not in any lookup | **BROKEN** |
| `render-infissi` | `render-infissi` | OK (redirects to render) |

**10 out of 14 active templates are broken.** Only 3 vocal templates work correctly.

### Additional Issues
1. **"Crea da zero" link** points to `/app/agents/new/vocale-custom` — this slug was removed from the grid but still exists in VOCAL_SLUGS, so it works, but the label shown will be "Agente Vocale Personalizzato" which is the old name.
2. **Filters and categories** work correctly (code logic is sound).
3. **Card UI** correctly shows `result`, `kpi`, badges, settore pills, and install counts. This part is fine.

## Fix Plan

### File 1: `src/pages/app/AgentTemplateWizard.tsx`

Update three lookups to recognize all new slugs:

**VOCAL_SLUGS** — add all new vocal slugs:
```
"richiama-lead-ads", "qualifica-serramenti", "qualifica-ristrutturazione", "qualifica-fotovoltaico",
"conferma-appuntamenti", "recupera-preventivi", "recupera-noshow", "followup-sopralluogo",
"raccolta-recensioni", "verifica-soddisfazione", "vocale-custom",
"primo-contatto-wa", "followup-preventivi-wa"
```
(WhatsApp templates also go through the vocal wizard since they share the same form)

**SLUG_TO_USE_CASE** — map new slugs to existing PromptTemplates use cases where they exist, and leave unmapped where they don't (wizard will start with empty prompt, which is fine):
```
"richiama-lead-ads": "inbound_campagne",
"qualifica-serramenti": "qualifica_infissi",
"conferma-appuntamenti": "conferma_sopralluogo",
"recupera-preventivi": "recupero_preventivi",
"recupera-noshow": "recupero_noshow",
"raccolta-recensioni": "recensioni",
"followup-preventivi-wa": "assistente_whatsapp",
```

**getTemplateLabel** — add all new slug → name mappings using the business-oriented names from STATIC_TEMPLATES.

### File 2: `src/components/agents/PromptTemplates.ts`

Add 3 new prompt templates for the new use cases that have no prompt today:
- `followup_sopralluogo` — prompt for post-survey follow-up calls
- `primo_contatto_wa` — prompt for WhatsApp first-contact welcome
- `verifica_soddisfazione` — prompt for post-work satisfaction check

Add these to `USE_CASES` array and `PROMPT_TEMPLATES` record.

Then update `SLUG_TO_USE_CASE` in AgentTemplateWizard to map:
```
"followup-sopralluogo": "followup_sopralluogo",
"primo-contatto-wa": "primo_contatto_wa",
"verifica-soddisfazione": "verifica_soddisfazione",
```

### Summary
- 2 files modified
- 10 broken template routes fixed
- 3 new prompt templates added
- Zero backend changes needed

