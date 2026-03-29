const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

export async function generateFollowUp(situation, discharge, language) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `A patient was treated for: ${situation}. Discharge instructions: ${discharge}. Write a warm 2-sentence follow-up reminder they should read in 3 days. Respond in ${language || "English"}. Keep it simple and caring.`,
      }],
    }),
  });
  const data = await res.json();
  return data.content.find(b => b.type === "text")?.text || "";
}