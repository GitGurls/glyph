// Works out of the box with zero API keys (rule-based enhancement), but upgrades
// automatically to Gemini if GEMINI_API_KEY is set in .env.
const STYLE_BOOSTERS = [
  "cinematic lighting",
  "highly detailed",
  "sharp focus",
  "8k resolution",
  "professional color grading",
];

function ruleBasedEnhance(prompt: string): string {
  const boosters = STYLE_BOOSTERS.filter(
    (b) => !prompt.toLowerCase().includes(b.split(" ")[0])
  ).slice(0, 3);
  return `${prompt.trim()}, ${boosters.join(", ")}`;
}

export async function enhancePrompt(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return ruleBasedEnhance(prompt);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Rewrite this AI image/video generation prompt to be more vivid and detailed, keeping the original intent. Return only the rewritten prompt, nothing else.\n\nPrompt: ${prompt}`,
                },
              ],
            },
          ],
        }),
      }
    );
    const data: any = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || ruleBasedEnhance(prompt);
  } catch {
    return ruleBasedEnhance(prompt);
  }
}
