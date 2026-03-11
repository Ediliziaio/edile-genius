import { describe, it, expect } from "vitest";
import { computeAgentScore } from "@/lib/agent-score";

const baseAgent = {
  id: "test-id",
  company_id: "comp-id",
  name: "Test Agent",
  description: "A test agent for scoring",
  system_prompt: "You are a helpful assistant that handles calls for an Italian construction company. Be professional.",
  first_message: "Ciao, come posso aiutarla?",
  el_voice_id: "voice-123",
  el_agent_id: "el-agent-123",
  sector: "edilizia",
  calls_total: 5,
  el_phone_number_id: "phone-123",
  webhook_url: "https://example.com/webhook",
  evaluation_criteria: "Check if appointment was set",
  type: "vocal",
  status: "active",
} as any;

describe("computeAgentScore", () => {
  it("returns 100 for fully configured vocal agent", () => {
    const result = computeAgentScore(baseAgent);
    expect(result.score).toBe(100);
    expect(result.label).toBe("Eccellente");
    expect(result.hasBlockers).toBe(false);
  });

  it("flags blocker when no voice selected", () => {
    const result = computeAgentScore({ ...baseAgent, el_voice_id: null });
    expect(result.hasBlockers).toBe(true);
    expect(result.blockers).toContain("Voce selezionata");
    expect(result.score).toBeLessThan(100);
  });

  it("flags blocker when no EL sync", () => {
    const result = computeAgentScore({ ...baseAgent, el_agent_id: null });
    expect(result.hasBlockers).toBe(true);
    expect(result.blockers).toContain("Sincronizzato con ElevenLabs");
  });

  it("flags blocker when system prompt too short", () => {
    const result = computeAgentScore({ ...baseAgent, system_prompt: "short" });
    expect(result.hasBlockers).toBe(true);
    expect(result.blockers).toContain("System prompt configurato");
  });

  it("returns Da completare for empty agent", () => {
    const result = computeAgentScore({
      id: "x", company_id: "y", name: "", type: "vocal", status: "inactive",
    } as any);
    expect(result.label).toBe("Da completare");
    expect(result.score).toBeLessThan(40);
  });

  it("skips voice factors for whatsapp type", () => {
    const wa = { ...baseAgent, type: "whatsapp" };
    const result = computeAgentScore(wa);
    const ids = result.factors.map(f => f.id);
    expect(ids).not.toContain("voice");
    expect(ids).not.toContain("phone");
  });
});
