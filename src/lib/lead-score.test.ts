import { describe, it, expect } from "vitest";
import { calculateLeadScore, type LeadScoreInput } from "@/lib/lead-score";

describe("calculateLeadScore", () => {
  it("returns base score for minimal input", () => {
    const result = calculateLeadScore({ status: "new" });
    expect(result.score).toBe(30);
    expect(result.label).toBe("Freddo");
  });

  it("boosts score for qualified outcome", () => {
    const result = calculateLeadScore({ status: "new", hasQualifiedOrAppointment: true });
    expect(result.score).toBe(60);
    expect(result.label).toBe("Tiepido");
  });

  it("returns Caldo for high engagement lead", () => {
    const result = calculateLeadScore({
      status: "contacted",
      hasQualifiedOrAppointment: true,
      hasPositiveSentiment: true,
      phone: "+39123",
      email: "a@b.com",
      call_attempts: 2,
    });
    expect(result.score).toBeGreaterThan(60);
    expect(result.label).toBe("Caldo");
    expect(result.emoji).toBe("🔴");
  });

  it("penalizes not_interested outcome", () => {
    const result = calculateLeadScore({ status: "new", latestOutcome: "not_interested" });
    expect(result.score).toBe(10);
    expect(result.label).toBe("Freddo");
  });

  it("penalizes do_not_call status", () => {
    const result = calculateLeadScore({ status: "do_not_call" });
    expect(result.score).toBe(0);
  });

  it("clamps score to 0-100", () => {
    const result = calculateLeadScore({
      status: "do_not_call",
      latestOutcome: "not_interested",
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("adds preventivo bonus", () => {
    const base = calculateLeadScore({ status: "new" });
    const withPreventivo = calculateLeadScore({ status: "new", hasPreventivo: true });
    expect(withPreventivo.score).toBe(base.score + 15);
  });

  it("penalizes stale contacts (>30 days)", () => {
    const old = new Date();
    old.setDate(old.getDate() - 45);
    const result = calculateLeadScore({ status: "new", last_contact_at: old.toISOString() });
    expect(result.score).toBe(20); // 30 base - 10 stale
  });
});
