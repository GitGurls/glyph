import { describe, it, expect } from "vitest";
import { moderatePrompt } from "../services/moderation.service";

describe("moderatePrompt", () => {
  it("passes ordinary prompts", () => {
    const result = moderatePrompt("a lighthouse on a cliff at dusk");
    expect(result.flagged).toBe(false);
  });

  it("flags blocked terms regardless of case", () => {
    const result = moderatePrompt("some CSAM related text");
    expect(result.flagged).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it("does not false-positive on unrelated similar words", () => {
    const result = moderatePrompt("a child playing in a park with their parents");
    expect(result.flagged).toBe(false);
  });
});
