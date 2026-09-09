import { describe, it, expect } from "vitest";
import { isSupabaseConfigured, checkSupabaseHealth } from "./supabase/supabase-client";

describe("Supabase Integration", () => {
  it("detects configuration status gracefully without credentials", async () => {
    const isConfigured = isSupabaseConfigured();
    expect(typeof isConfigured).toBe("boolean");
  });

  it("checks health and returns fallback status when unconfigured", async () => {
    const health = await checkSupabaseHealth();
    expect(health).toBeDefined();
    if (!health.configured) {
      expect(health.connected).toBe(false);
      expect(health.error).toContain("SUPABASE_URL");
    }
  });
});
