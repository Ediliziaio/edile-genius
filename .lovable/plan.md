

# Batch 6 — Remaining Feature Requests from 11 Prompts

Batches 1-5 addressed all **bug fixes and security issues**. This batch covers the **feature requests** that were deferred. I've prioritized by user impact and grouped by complexity.

---

## A. Preventivi Enhancements (Prompts 2 & 3)

### A1. Auto-save bozza (NuovoPreventivo)
- Add `useEffect` with 30s interval that auto-saves voci if `preventivoId` exists and voci changed (track with `useRef` dirty flag)
- Show discrete toast "Bozza salvata automaticamente"

### A2. Client validation Step 1 (NuovoPreventivo)
- `clienteNome` required — disable "Avanti" button if empty
- Validate `clienteEmail` format with regex before allowing step 2

### A3. Template validation (TemplatePreventivo)
- Before save, check `azienda_nome` and `azienda_piva` are non-empty
- Show inline error messages on fields

### A4. Logo upload file type validation (TemplatePreventivo)
- Add `accept="image/png,image/jpeg,image/webp,image/svg+xml"` to file input
- Validate `file.type` before upload, use `crypto.randomUUID()` for path

### A5. Versioning (PreventivoDetail)
- "Crea revisione" button: duplicate preventivo, increment `versione`, set `bozza`, navigate to new

---

## B. Cantieri Enhancements (Prompt 1)

### B1. Delete cantiere confirmation dialog
- Show AlertDialog with count of associated reports before deleting

### B2. Cantiere → Nuovo Preventivo link
- Add button in CantiereDetail header that navigates to `/app/preventivi/nuovo?cantiere_id={id}`
- Read `cantiere_id` from URL params in NuovoPreventivo to pre-populate

---

## C. Agent Wizard Improvements (Prompt 6)

### C1. Voice validation Step 2
- Disable "Avanti" in wizard step 2 if `voice_id` is not selected
- Show inline error message

### C2. Confirm before abandoning wizard
- Add AlertDialog on "Annulla" click if any step has been filled

---

## D. Contacts & Campaigns (Prompt 7)

### D1. CampaignDetail — inline time picker for call window
- Click on call window times opens inline edit with time inputs

### D2. CreateCampaign — read type from form state
- Ensure `type: form.type` instead of hardcoded `"outbound"`

---

## E. Analytics Export (Prompt 8)

### E1. CSV export button
- Export filtered conversations as CSV with columns: data, agente, durata, esito, score

---

## F. Settings Enhancements (Prompt 9)

### F1. Integrations — Render AI card
- Add card for Render AI module with status and credits link

### F2. WhatsApp status check improvement
- Check at least one phone has `status = 'active'`, not just `phoneNumbers.length > 0`

---

## Files Modified

| File | Changes |
|---|---|
| `src/pages/app/NuovoPreventivo.tsx` | Auto-save, client validation, cantiere pre-populate from URL |
| `src/pages/app/PreventivoDetail.tsx` | Versioning button |
| `src/pages/app/TemplatePreventivo.tsx` | Validation, file type check, UUID path |
| `src/pages/app/CantiereDetail.tsx` | Delete confirmation, "Nuovo preventivo" button |
| `src/pages/app/Cantieri.tsx` | Delete with confirmation dialog |
| `src/pages/app/Analytics.tsx` | CSV export |
| `src/pages/app/CampaignDetail.tsx` | Inline time edit |
| `src/pages/app/CreateCampaign.tsx` | Fix type from form state |
| `src/pages/app/Integrations.tsx` | Render AI card, WA status fix |
| Agent wizard files | Voice validation, abandon confirmation |

This batch is focused on **actionable feature enhancements** only — no new DB tables or edge functions needed.

