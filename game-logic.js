export const CATEGORY_ORDER = ["yellow", "blue", "orange", "green", "red"];

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getCategoryByPos(position) {
  const normalized = clamp(Number(position) || 1, 1, 60);
  return CATEGORY_ORDER[(normalized - 1) % CATEGORY_ORDER.length];
}

export function advancePosition(position, roll) {
  return clamp((Number(position) || 1) + (Number(roll) || 0), 1, 60);
}

export function displayTeamName(name, index) {
  const normalized = typeof name === "string" ? name.trim() : "";
  return normalized || `Squadra ${index + 1}`;
}

export function pickUnusedWord(words, category, difficulty, usedWords, random = Math.random) {
  const pool = words?.[category]?.[difficulty] || [];
  if (!pool.length) return "—";

  const keyFor = (word) => `${category}:${difficulty}:${word}`;
  let available = pool.filter((word) => !usedWords.has(keyFor(word)));

  if (!available.length) {
    for (const word of pool) usedWords.delete(keyFor(word));
    available = pool;
  }

  const index = Math.floor(clamp(random(), 0, 0.999999) * available.length);
  const word = available[index];
  usedWords.add(keyFor(word));
  return word;
}
