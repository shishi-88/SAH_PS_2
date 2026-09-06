import { describe, expect, it } from "vitest";
import { nextTier, selectWorksheetTemplate } from "./worksheet-bank";

describe("worksheet bank", () => {
  it("selects a matching template for gap, grade, and tier", () => {
    const sheet = selectWorksheetTemplate("consonant-blend-bl-cl-st", 2, "reading", 1);
    expect(sheet?.title.toLowerCase()).toContain("blend");
    expect(sheet?.items.length).toBeGreaterThan(0);
  });

  it("caps difficulty at tier 3", () => {
    expect(nextTier(3)).toBe(3);
    expect(nextTier(1)).toBe(2);
  });
});
