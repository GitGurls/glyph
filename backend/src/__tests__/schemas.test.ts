import { describe, it, expect } from "vitest";
import { generateSchema, registerSchema, checkoutSchema } from "../lib/schemas";

describe("generateSchema", () => {
  it("accepts a valid generation request", () => {
    const result = generateSchema.safeParse({ prompt: "a lighthouse at dusk", model: "image" });
    expect(result.success).toBe(true);
  });

  it("rejects prompts under 3 characters", () => {
    const result = generateSchema.safeParse({ prompt: "hi", model: "image" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown models", () => {
    const result = generateSchema.safeParse({ prompt: "a lighthouse at dusk", model: "hologram" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("lowercases and trims email", () => {
    const result = registerSchema.safeParse({ email: "  Test@Example.com  ", password: "password123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("test@example.com");
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({ email: "test@example.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  it("only allows known credit packs", () => {
    expect(checkoutSchema.safeParse({ pack: "pro" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ pack: "mega" }).success).toBe(false);
  });
});
