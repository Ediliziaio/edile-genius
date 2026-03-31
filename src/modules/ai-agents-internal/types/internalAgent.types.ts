// B7 fix: target_type usa 'manual' | 'filter' (non 'contact_list')

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

// B7 fix: DEFAULT 'manual' — non 'contact_list'
export type CampaignTargetType = 'manual' | 'filter';

export interface InternalOutboundCampaign {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  agent_id: string | null;
  target_type: CampaignTargetType;
  contact_ids: string[];
  filter_tags: string | null;
  filter_source: string | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_calls: number;
  calls_answered: number;
  calls_failed: number;
  calls_per_minute: number;
  retry_max_attempts: number;
  retry_delay_min: number;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalCallLog {
  id: string;
  company_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  agent_id: string | null;
  phone_number: string | null;
  direction: string;
  status: 'initiated' | 'answered' | 'no_answer' | 'failed' | 'busy';
  outcome: 'interested' | 'not_interested' | 'callback' | 'dnc' | 'no_answer' | 'voicemail' | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  elevenlabs_conversation_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  contact?: {
    full_name: string;
    phone: string | null;
    email?: string | null;
  } | null;
  agent?: {
    name: string;
  } | null;
  campaign?: {
    name: string;
  } | null;
}

export interface CampaignCallQueue {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: 'pending' | 'calling' | 'done' | 'failed' | 'paused';
  attempt_number: number;
  scheduled_for: string;
  called_at: string | null;
  result: string | null;
  created_at: string;
}
