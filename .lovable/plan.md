

# Piano: Aggiungere Tab "Meta WhatsApp API" nelle Impostazioni Piattaforma SuperAdmin

## Cosa fare

Spostare la configurazione delle API Meta WhatsApp (attualmente solo su `/superadmin/whatsapp`) anche dentro la pagina **Impostazioni Piattaforma** (`/superadmin/platform-settings`), aggiungendo un 5o tab "WhatsApp API" accanto a ElevenLabs, LLM, Prezzi e Pacchetti.

## Modifiche

### `src/pages/superadmin/PlatformSettings.tsx`

Aggiungere un 5o tab "WhatsApp API" con icona `MessageSquare`:

- **Campi**: Meta App ID, App Secret (mascherato con toggle visibilita), Webhook URL, Verify Token, Prezzo Abbonamento Mensile (EUR)
- **Stato**: Badge "Configurato" / "Non configurato" basato su presenza `meta_app_id`
- **Salvataggio**: upsert su `superadmin_whatsapp_config` (stessa logica gia presente in `WhatsAppAdmin.tsx`)
- **Griglia**: `grid-cols-5` per le tab invece di `grid-cols-4`

I dati vengono letti/scritti dalla stessa tabella `superadmin_whatsapp_config` gia esistente. La pagina `/superadmin/whatsapp` resta per la gestione account (tabella aziende con sospendi/riattiva), mentre le credenziali API si configurano anche da Impostazioni Piattaforma.

### File da modificare
| File | Modifica |
|------|----------|
| `src/pages/superadmin/PlatformSettings.tsx` | Aggiungere 5o tab "WhatsApp API" con form credenziali Meta |

