import test from "node:test";
import assert from "node:assert/strict";

import { advancePosition, displayTeamName, getCategoryByPos, pickUnusedWord } from "../game-logic.js";

test("maps board positions to the five repeating categories", () => {
  assert.equal(getCategoryByPos(1), "yellow");
  assert.equal(getCategoryByPos(5), "red");
  assert.equal(getCategoryByPos(6), "yellow");
  assert.equal(getCategoryByPos(60), "red");
});

test("moves a team forward and caps the finish at square 60", () => {
  assert.equal(advancePosition(1, 6), 7);
  assert.equal(advancePosition(58, 6), 60);
});

test("replaces empty or whitespace-only team names", () => {
  assert.equal(displayTeamName("  Matite  ", 0), "Matite");
  assert.equal(displayTeamName("   ", 0), "Squadra 1");
  assert.equal(displayTeamName("", 1), "Squadra 2");
});

test("does not repeat a word until its category pool is exhausted", () => {
  const words = { blue: { media: ["matita", "ombrello"] } };
  const used = new Set();
  const first = pickUnusedWord(words, "blue", "media", used, () => 0);
  const second = pickUnusedWord(words, "blue", "media", used, () => 0);
  const third = pickUnusedWord(words, "blue", "media", used, () => 0);

  assert.equal(first, "matita");
  assert.equal(second, "ombrello");
  assert.equal(third, "matita");
});
