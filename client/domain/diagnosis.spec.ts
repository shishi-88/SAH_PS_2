import { describe, expect, it } from "vitest";
import {
  diagnose,
  markShare,
  matchTranscriptToObservations,
  outcomeFromShares,
  promptTokenCount,
} from "./diagnosis";
import { defaultPrompt, promptsFor } from "./prompts";

describe("reading diagnosis", () => {
  it("maps blend errors to the blending gap", () => {
    const prompt = promptsFor("reading", 2).find((p) => p.id === "read-g2-crow")!;
    const clever = prompt.tokens.findIndex((t) => t.text === "clever");
    const stones = prompt.tokens.findIndex((t) => t.text === "stones");
    const result = diagnose(prompt, {
      observations: [
        { tokenIndex: clever, error: "wrong" },
        { tokenIndex: stones, error: "wrong" },
      ],
    });
    expect(result.primaryGapTypeId).toBe("consonant-blend-bl-cl-st");
    expect(result.gapTypeIds).toContain("consonant-blend-bl-cl-st");
  });

  it("returns no gap when nothing is marked", () => {
    const prompt = defaultPrompt("reading", 1);
    const result = diagnose(prompt, { observations: [] });
    expect(result.primaryGapTypeId).toBeNull();
    expect(result.gapTypeIds).toHaveLength(0);
  });
});

describe("numeracy diagnosis", () => {
  it("maps 29-30 errors to the decade-transition gap", () => {
    const prompt = defaultPrompt("numeracy", 2);
    const thirty = prompt.tokens.findIndex((t) => t.text === "30");
    const result = diagnose(prompt, {
      observations: [{ tokenIndex: thirty, error: "hesitation" }],
    });
    expect(result.gapTypeIds).toContain("decade-29-30");
  });
});

describe("transcript assist", () => {
  it("marks missing expected words", () => {
    const prompt = defaultPrompt("reading", 1);
    const evidence = matchTranscriptToObservations(prompt, "The dog can run");
    expect(evidence.observations.length).toBeGreaterThan(0);
  });
});

describe("reassessment outcomes", () => {
  it("compares error shares across prompts of different lengths", () => {
    expect(markShare(3, 12)).toBe(0.25);
    /* Unknown prompt falls back to the raw count. */
    expect(markShare(2, 0)).toBe(2);
    expect(promptTokenCount("read-blend-words")).toBe(9);
    expect(promptTokenCount("does-not-exist")).toBe(0);
  });

  it("says improving only when the error share dropped", () => {
    expect(outcomeFromShares(0.5, 0.25)).toBe("improving");
    expect(outcomeFromShares(0.25, 0.25)).toBe("still-present");
    expect(outcomeFromShares(0.25, 0.5)).toBe("still-present");
  });
});
