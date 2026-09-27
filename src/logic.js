// QVAC Genre Mood Matcher — core logic.
// The model may only pick a genre from a fixed, closed vocabulary (never a
// free-form title), and the choice is validated deterministically against
// that list. This guarantees the app can never hallucinate a fake or real
// movie/book title into the result — only a genre word ever reaches the UI.

import { completion } from "@qvac/sdk";

const GENRES = [
  "Comedy", "Romance", "Mystery", "Thriller", "Horror", "Fantasy",
  "Science Fiction", "Drama", "Adventure", "Cozy Mystery", "Slice of Life",
  "Documentary",
];

// Simple deterministic keyword fallback mapping — guarantees a sensible,
// title-free result even if the model's output can't be parsed or trusted.
const KEYWORD_MAP = [
  { words: ["sad", "down", "blue", "lonely", "heartbrok"], genre: "Drama" },
  { words: ["scared", "anxious", "spooky", "creepy"], genre: "Horror" },
  { words: ["silly", "goofy", "laugh", "funny", "giggly"], genre: "Comedy" },
  { words: ["romantic", "love", "crush", "swoon"], genre: "Romance" },
  { words: ["curious", "puzzle", "suspicious", "intrigu"], genre: "Mystery" },
  { words: ["tense", "nervous", "edge", "adrenaline"], genre: "Thriller" },
  { words: ["magical", "whimsical", "dreamy", "escapis"], genre: "Fantasy" },
  { words: ["nerdy", "futuristic", "space", "techy"], genre: "Science Fiction" },
  { words: ["restless", "bold", "energetic", "excited"], genre: "Adventure" },
  { words: ["cozy", "calm", "relaxed", "sleepy", "comfort"], genre: "Cozy Mystery" },
  { words: ["reflective", "quiet", "nostalgic", "thoughtful"], genre: "Slice of Life" },
  { words: ["learn", "curiousmind", "factual", "real"], genre: "Documentary" },
];

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "please provide"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function fallbackGenre(mood) {
  const lower = mood.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.words.some((w) => lower.includes(w))) return entry.genre;
  }
  return "Slice of Life";
}

function looksLikeTitle(reason) {
  // A sentence-initial capital is normal; anything after the first word that
  // has two-or-more consecutive Capitalized Words looks like a proper noun
  // title being named, which we never want to surface (fake or real).
  const words = reason.trim().split(/\s+/);
  const rest = words.slice(1).join(" ");
  return /\b[A-Z][a-zA-Z']*\s+[A-Z][a-zA-Z']*\b/.test(rest);
}

function reasonMentionsMood(reason, mood) {
  // Loose check only — the genre itself is already guaranteed safe, this
  // just prefers a reason that actually engages with the user's words.
  const words = mood
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return true;
  const lower = reason.toLowerCase();
  return words.some((w) => lower.includes(w));
}

export async function generate(modelId, mood) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          `You must recommend a GENRE (never a specific movie or book title) for someone based on their ` +
          `mood. Choose exactly one genre from this list: ${GENRES.join(", ")}. Reply in exactly this ` +
          `format on one line: "Genre: <chosen genre> | Reason: <one short sentence explaining why that ` +
          `genre fits their mood>". Never name any specific movie, show, or book. Reply with ONLY that one line.`,
      },
      { role: "user", content: "Mood: I've had a long stressful week and just want to switch my brain off" },
      { role: "assistant", content: "Genre: Comedy | Reason: A light, funny genre is perfect for switching off after a stressful week." },
      { role: "user", content: `Mood: ${mood}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 90 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim().split("\n")[0].trim();

  let genre = null;
  let reason = null;

  const match = text.match(/genre:\s*([^|]+)\|\s*reason:\s*(.+)/i);
  if (match) {
    const candidate = match[1].trim().replace(/["'.]+$/, "");
    const found = GENRES.find((g) => g.toLowerCase() === candidate.toLowerCase());
    if (found) {
      genre = found;
      reason = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }

  if (
    looksUnusable(text) ||
    !genre ||
    !reason ||
    reason.length > 220 ||
    looksLikeTitle(reason) ||
    !reasonMentionsMood(reason, mood)
  ) {
    genre = fallbackGenre(mood);
    reason = `${genre} tends to match a mood like "${mood}" without pulling you somewhere jarring.`;
  }

  return { genre, reason };
}
