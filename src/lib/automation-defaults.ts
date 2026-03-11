// Centralized smart actions defaults — used by Dashboard and Automations
export const SMART_ACTIONS_DEFAULTS: Record<string, boolean | number> = {
  credits_low_enabled: true,
  credits_low_eur: 2,
  burn_rate_warning_enabled: true,
  burn_rate_days: 3,
  agent_inactive_enabled: true,
  agent_inactive_days: 7,
  callback_overdue_enabled: true,
  preventivi_stale_enabled: true,
  preventivi_stale_days: 7,
  docs_expiring_enabled: true,
  docs_expiry_days: 15,
  campaign_low_perf_enabled: true,
  campaign_min_pct: 5,
  dormant_leads_enabled: true,
  dormant_lead_days: 5,
};
