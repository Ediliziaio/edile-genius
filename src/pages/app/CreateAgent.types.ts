import type { UseCaseId } from "@/components/agents/PromptTemplates";

export interface CustomTool {
  name: string;
  description: string;
  url: string;
  method: string;
}

export interface AgentForm {
  use_case: UseCaseId | null;
  name: string;
  description: string;
  sector: string;
  language: string;
  additional_languages: string[];
  voice_id: string;
  system_prompt: string;
  first_message: string;
  temperature: number;
  status: "active" | "draft";
  llm_model: string;
  turn_timeout_sec: number;
  soft_timeout_sec: number;
  soft_timeout_message: string;
  interruptions_enabled: boolean;
  turn_eagerness: string;
  max_duration_sec: number;
  end_call_enabled: boolean;
  end_call_prompt: string;
  language_detection_enabled: boolean;
  voice_stability: number;
  voice_similarity: number;
  voice_speed: number;
  evaluation_criteria: string;
  data_retention: boolean;
  webhook_url: string;
  custom_tools: CustomTool[];
  pii_redaction: boolean;
  blocked_topics: string;
  _pendingKBFiles?: File[];
}
