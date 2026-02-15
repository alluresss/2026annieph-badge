// app.js — soft-lock puzzle hunt (localStorage)
//
// Requirements implemented:
// - Gallery/grid homepage layout
// - Only show puzzles up to the next available (hide future locked titles)
// - Show Solved badges + progress tracker
// - Allow revisiting solved puzzles, BUT disable resubmission on solved puzzles
// - Redirect to homepage after correct solve

const PUZZLES = [
  { id: 1, title: "The Red Fruit",     path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Orange Identity",   path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Banana Business",   path: "puzzles/puzzle3.html", answer: "BANANA" },
];

const STORAGE_KEY = "puzzle_hunt_progress_v4";

// -------------------------
// Storage helpers
// -------------------------
function loadProgress() {
  const fallback = { unlockedUpTo: 1, solvedIds: [] };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const unlockedUpTo = Number(parsed.unlockedUpTo);
    const solvedIds = Array.isArray(parsed.solvedIds) ? parsed.solvedIds : [];

    if (!Number.isFinite(unlockedUpTo) || unlockedUpTo < 1) return fallback;

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

function isSolved(puzzleId) {
  const { solvedIds } = loadProgress();
  return solvedIds.includes(puzzleId);
}

// -------------------------
// Puzzle page functions
// -------------------------
function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
    window.location.href = "../index.html";
  }
}

function submitAnswer(puzzleId, inputValue) {
  // Prevent submitting again if already solved
  if (isSolved(puzzleId)) {
    return { ok: false, msg: "You already solved this puzzle. Resubmission is disabled." };
  }

  const guess = normalizeAnswer(inputValue);
  const puzzle = PUZZLES.find((p) => p.id === puzzleId);
  if (!puzzle) return { ok: false, msg: "Puzzle not found." };
  if (!guess) return { ok: false, msg: "Type an answer first." };

  const correct = normalizeAnswer(puzzle.answer);

  if (guess === correct) {
    const progress = loadProgress();

    // mark solved
    const solved = new Set(progress.solvedIds);
    solved.add(puzzleId);
    progress.solvedIds = Array.from(solved);

    // unlock next
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, puzzleId + 1);

    saveProgress(progress);

    const isLast = puzzleId === PUZZLES[PUZZLES.length - 1].id;
    return {
      ok: true,
      msg: isLast ? "Correct! You solved the final puzzle!" : "Correct! Next puzzle unlocked.",
      redirectHome: true,
    };
  }

  return { ok: false, msg: "Not quite. Try again!" };
}

// Helper for puzzle pages to disable the form if solved
function getPuzzleState(puzzleId) {
  const { unlockedUpTo, solvedIds } = loadProgress();
  return {
    unlockedUpTo,
    solved: solvedIds.includes(puzzleId),
  };
}

// -------------------------
// Homepage rendering
// -------------------------
function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return;

  const progressEl = document.getElementById("progressText");
  const { unlockedUpTo, solvedIds } = loadProgress();
  const solvedSet = new Set(solvedIds);

  // Show only puzzles up to the next available one (hide future locked puzzles + their titles)
  const visible = PUZZLES.filter((p) => p.id <= unlockedUpTo);

  // Progress
  const solvedCount = solvedSet.size;
  const total = PUZZLES.length;
  if (progressEl) progressEl.textContent = `Solved ${solvedCount} / ${total}`;

  listEl.innerHTML = "";

  for (const p of visible) {
    const solved = solvedSet.has(p.id);

    const li = document.createElement("li");
    li.className = "card";

    const top = document.createElement("div");
    top.className = "card-top";

    const name = document.createElement("div");
    name.className = "puzzle-name";
    name.textContent = p.title;

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const badge = document.createElement("span");
    badge.className = "badge " + (solved ? "solved" : "unlocked");
    badge.textContent = solved ? "Solved ✅" : "Unlocked";

    meta.appendChild(badge);

    top.appendChild(name);
    top.appendChild(meta);

    const open = document.createElement("a");
    open.className = "button";
    open.textContent = "Open";
    open.href = p.path;

    li.appendChild(top);
    li.appendChild(open);
    listEl.appendChild(li);
  }

  // Reset (optional)
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
  getPuzzleState,
};
