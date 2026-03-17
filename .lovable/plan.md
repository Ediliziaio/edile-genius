

# Doc 12-Prompt: Sistema Crediti, Pagamenti, Metering, API Routing & SuperAdmin — Gap Analysis

## Critical Incompatibilities

The uploaded document proposes an entirely new architecture that **conflicts fundamentally** with the existing system:

| Proposed (Doc) | Existing (Project) | Conflict |
|---|---|---|
| `aziende` table | `companies` table | Table does not exist |
| `azienda_members` table | `profiles.company_id` | Table does not exist |
| `tenant_id` FK → `aziende(id)` | `company_id` FK → `companies(id)` | All FKs would fail |
| `profiles.is_super_admin` | `user_roles` table with `app_role` enum | Column does not exist |
| `credit_balances` (integer credits) | `ai_credits` (EUR balance) | Duplicate purpose, different model |
| `credit_transactions` | `ai_credit_usage` | Duplicate purpose |
| `credit_packages` | `ai_credit_packages` | Duplicate purpose |
| `subscriptions` + `plans` | `companies.plan` (string field) | Different subscription model |
| `services` + `service_routing` | `platform_pricing` (LLM+TTS combo pricing) | Different pricing architecture |
| `feature_toggles` | `azienda_features_sbloccate` + `user_feature_permissions` | Duplicate purpose |

**Running this document's SQL migrations would create ~15 tables that reference non-existent `aziende` table, causing immediate failures.**

## What Already Exists and Works

### Credits System (EUR-based)
- **`ai_credits`** — Per-company EUR balance with auto-recharge, blocking, alerts
- **`ai_credit_usage`** — Per-conversation usage tracking with cost_billed/cost_real/margin
- **`ai_credit_topups`** — Topup history with invoice numbers
- **`ai_credit_packages`** — Purchasable credit packages
- **`platform_pricing`** — Per LLM+TTS model combination pricing with markup
- **DB functions**: `topup_credits()`, `deduct_call_credits()`, `generate_invoice_number()`
- **Edge functions**: `check-credits-before-call`, `topup-credits`, `create-checkout-session`, `stripe-webhook`

### SuperAdmin System
- **Dashboard** (`superadmin/Dashboard.tsx`) — KPIs, revenue charts, credit health table, manual topup modal
- **Platform Settings** (`superadmin/PlatformSettings.tsx`) — ElevenLabs config, LLM model selection, pricing table with markup, credit packages, WhatsApp config, N8N config
- **Companies** (`superadmin/Companies.tsx`) — Company list with impersonation
- **Company Detail** (`superadmin/CompanyDetail.tsx`) — Per-company management
- **Analytics** (`superadmin/GlobalAnalytics.tsx`) — Global analytics
- **Monitoring** (`superadmin/Monitoring.tsx`) — System monitoring

### Client-Side Credits
- **Credits Page** (`app/Credits.tsx`) — Balance card, packages, topup, usage tabs, Stripe checkout
- **Sidebar** — Credit balance widget with color-coded alerts
- **Settings** — Billing tab with credit status

### Permissions System
- **`piattaforma_features`** — Feature catalog
- **`azienda_features_sbloccate`** — Company feature unlocks
- **`user_feature_permissions`** — Per-user permissions with limits
- **`user_feature_usage`** — Usage tracking
- **Hooks**: `useCheckPermesso`, `useAziendaSettings`

## Assessment

The document proposes replacing the entire working system with an incompatible architecture. The **only genuinely new concepts** are:

1. **Provider registry with health monitoring** — `providers`, `provider_models`, `provider_health_log` tables
2. **Service routing with fallback** — `service_routing`, `service_routing_overrides` for automatic provider switching
3. **Integer credit system** (plan credits + extra credits) vs current EUR-based system

However, implementing #3 would require rewriting the entire credits pipeline (DB, edge functions, UI), which is a massive breaking change with no clear benefit since the EUR system is already functional.

## Recommendation

**Do not implement this document as-is.** It would create duplicate/conflicting tables, break foreign keys, and require rewriting 20+ working files.

If you want specific features from this document (e.g., provider health monitoring, automatic fallback routing), those can be designed as additions to the existing architecture using `company_id` / `companies` / `user_roles`. But that would be a separate, carefully scoped task.

