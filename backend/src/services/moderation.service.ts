// Minimal, transparent moderation pass on the incoming prompt before it ever reaches
// the generation queue. In production this would call a hosted moderation model
// (OpenAI/Google Perspective) or your own classifier — the interface here is designed
// so that swap is a one-function change.
const BLOCKED_TERMS = ["csam", "child sexual", "minor nude", "non-consensual"];

export function moderatePrompt(prompt: string): { flagged: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { flagged: true, reason: `Blocked term matched: "${term}"` };
    }
  }
  return { flagged: false };
}
