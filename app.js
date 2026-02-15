// app.js
// Soft-locking puzzle hunt using localStorage.
// - Index page shows puzzles as unlocked/locked based on progress.
// - Puzzle pages call PuzzleHunt.requireUnlocked(puzzleId) to redirect if locked.
// - Answer submission uses PuzzleHunt.submitAnswer(puzzleId, guess).

// =========================
// CONFIG (EDIT THIS)
// =========================
// IMPORTANT: answers are in client-side code (soft lock). People *can* inspect them.
const PUZZLES = [
  {
    id: 1,
    title: "The Red Fruit",
    path: "puzzles/puzzle1.html",
    answer: "APPLE",
  },
  {
    id: 2,
    title: "Orange Identity",
    path: "puzzles/puzzle2.html",
    answer: "ORANGE",
  },
  {
    id: 3,
    title: "Banana Business",
    path: "puzzles/puzzle3.html",
    answer: "BANANA",
  },
];

const STORAGE_KEY = "puzzle_hunt_progress_v2";

// =========================
// STORAGE HELPERS
// =========================
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedUpTo: 1 }; // Puzzle 1 unlocked by default

    const parsed = JSON.parse(raw);
    const unlockedUpTo = Number(parsed.unlockedUpTo);

    if (!Number.isFinite(unlockedUpTo) || unlockedUpTo < 1) {
      return { unlockedUpTo: 1 };
    }
    return { unlockedUpTo };
  } catch {
    return { unlockedUpTo: 1 };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function normalizeAnswer(s) {
  return (s ?? "")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " "); // collapses multiple spaces
}

// =========================
// PUZZLE PAGE FUNCTIONS
// =========================
function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
    // Redirect locked puzzles back to homepage
    window.location.href = "../index.html";
  }
}

function submitAnswer(puzzleId, inputValue) {
  const guess = normalizeAnswer(inputValue);

  const puzzle = PUZZLES.find((p) => p.id === puzzleId);
  if (!puzzle) return { ok: false, msg: "Puzzle not found." };

  if (!guess) return { ok: false, msg: "Type an answer first." };

  const correct = normalizeAnswer(puzzle.answer);
  if (guess === correct) {
    const progress = loadProgress();
    const nextId = puzzleId + 1;

    // Unlock the next puzzle
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, nextId);
    saveProgress(progress);

    // If this is the last puzzle, still show success message
    const isLast = puzzleId === PUZZLES[PUZZLES.length - 1].id;
    return {
      ok: true,
      msg: isLast ? "Correct! You solved the final puzzle!" : "Correct! Next puzzle unlocked.",
    };
  }

  return { ok: false, msg: "Not quite. Try again!" };
}

// =========================
// INDEX PAGE RENDERING
// =========================
function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return; // Not on index page

  const { unlockedUpTo } = loadProgress();
  listEl.innerHTML = "";

  for (const p of PUZZLES) {
    const isUnlocked = p.id <= unlockedUpTo;

    const li = document.createElement("li");
    li.className = "puzzle-item";

    const left = document.createElement("div");
    left.className = "left";

    const name = document.createElement("div");
    name.className = "puzzle-name";
    name.textContent = p.title;

    const badge = document.createElement("span");
    badge.className = "badge " + (isUnlocked ? "open" : "locked");
    badge.textContent = isUnlocked ? "Unlocked" : "Locked";

    left.appendChild(name);
    left.appendChild(badge);

    const link = document.createElement("a");
    link.className = "button";
    link.textContent = isUnlocked ? "Open" : "Locked";
    link.setAttribute("aria-disabled", String(!isUnlocked));

    if (isUnlocked) {
      link.href = p.path;
    } else {
      // No href so it can't be clicked
      link.removeAttribute("href");
    }

    li.appendChild(left);
    li.appendChild(link);
    listEl.appendChild(li);
  }

  // Optional reset button if present
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = "true";
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderIndex();
      alert("Progress reset on this device.");
    });
  }
}

// Run on page load (index will render; puzzle pages ignore)
document.addEventListener("DOMContentLoaded", renderIndex);

// Expose functions for puzzle pages
window.PuzzleHunt = {
  requireUnlocked,
  submitAnswer,
};
