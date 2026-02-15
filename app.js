// app.js
// Soft-lock puzzle hunt using localStorage.
// Features added:
// - "Solved" indicator
// - Progress tracker on homepage
// - Only show puzzles up to the next available (hide all future puzzles)
// - Redirect to homepage after correct solve (handled via submitAnswer return flag)

const PUZZLES = [
  { id: 1, title: "The Red Fruit",     path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Orange Identity",   path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Banana Business",   path: "puzzles/puzzle3.html", answer: "BANANA" },
];

// New storage key (keeps things clean)
const STORAGE_KEY = "puzzle_hunt_progress_v3";

function loadProgress() {
  // Default: puzzle 1 available, none solved yet
  const fallback = { unlockedUpTo: 1, solvedIds: [] };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const unlockedUpTo = Number(parsed.unlockedUpTo);
    const solvedIds = Array.isArray(parsed.solvedIds) ? parsed.solvedIds : [];

    if (!Number.isFinite(unlockedUpTo) || unlockedUpTo < 1) return fallback;

    // Clean/normalize solved ids
    const solvedSet = new Set(
      solvedIds
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x >= 1)
    );

    return { unlockedUpTo, solvedIds: Array.from(solvedSet) };
  } catch {
    return fallback;
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
    .replace(/\s+/g, " ");
}

// -------------------------
// PUZZLE PAGE FUNCTIONS
// -------------------------

function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
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

    // Mark this puzzle solved
    const solved = new Set(progress.solvedIds);
    solved.add(puzzleId);
    progress.solvedIds = Array.from(solved);

    // Unlock next puzzle
    const nextId = puzzleId + 1;
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, nextId);

    saveProgress(progress);

    const isLast = puzzleId === PUZZLES[PUZZLES.length - 1].id;
    return {
      ok: true,
      msg: isLast ? "Correct! You solved the final puzzle!" : "Correct! Next puzzle unlocked.",
      redirectHome: true, // puzzle pages will use this to redirect
    };
  }

  return { ok: false, msg: "Not quite. Try again!" };
}

// -------------------------
// HOMEPAGE RENDERING
// -------------------------

function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return; // not on homepage

  const progressEl = document.getElementById("progressText"); // optional element
  const { unlockedUpTo, solvedIds } = loadProgress();
  const solvedSet = new Set(solvedIds);

  // Only show puzzles up to the next available one:
  // - all solved puzzles are <= unlockedUpTo-1
  // - plus the current available puzzle (id === unlockedUpTo)
  // - hide everything > unlockedUpTo
  const visiblePuzzles = PUZZLES.filter((p) => p.id <= unlockedUpTo);

  // Progress tracker
  const solvedCount = solvedSet.size;
  const total = PUZZLES.length;
  if (progressEl) {
    progressEl.textContent = `Solved ${solvedCount} / ${total}`;
  }

  // Render list
  listEl.innerHTML = "";

  for (const p of visiblePuzzles) {
    const isSolved = solvedSet.has(p.id);
    const isUnlocked = p.id <= unlockedUpTo;

    const li = document.createElement("li");
    li.className = "puzzle-item";

    const left = document.createElement("div");
    left.className = "left";

    const name = document.createElement("div");
    name.className = "puzzle-name";
    name.textContent = p.title;

    const badge = document.createElement("span");
    badge.className = "badge " + (isSolved ? "open" : "open");
    badge.textContent = isSolved ? "Solved ✅" : "Unlocked";

    left.appendChild(name);
    left.appendChild(badge);

    const link = document.createElement("a");
    link.className = "button";
    link.textContent = "Open";
    link.href = p.path;
    link.setAttribute("aria-disabled", String(!isUnlocked));

    li.appendChild(left);
    li.appendChild(link);
    listEl.appendChild(li);
  }

  // Reset button (optional)
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

document.addEventListener("DOMContentLoaded", renderIndex);

// Export for puzzle pages
window.PuzzleHunt = {
  requireUnlocked,
  submitAnswer,
};
