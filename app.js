// ---- CONFIG ----
// Add puzzles here. The "answer" is what unlocks the NEXT puzzle.
// For soft-locking: answers are in client-side code, so players *can* inspect them.
// You can reduce casual cheating by using hashes, but it’s still not secure.
const PUZZLES = [
  { id: 1, title: "Puzzle 1", path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Puzzle 2", path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Puzzle 3", path: "puzzles/puzzle3.html", answer: "BANANA" },
];

const STORAGE_KEY = "puzzle_hunt_progress_v1";

// ---- HELPERS ----
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedUpTo: 1 }; // puzzle 1 unlocked by default
    const parsed = JSON.parse(raw);
    // minimal validation
    const unlockedUpTo = Number(parsed.unlockedUpTo);
    if (!Number.isFinite(unlockedUpTo) || unlockedUpTo < 1) return { unlockedUpTo: 1 };
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
    .replace(/\s+/g, " "); // keep single spaces if you want multi-word answers
}

// Called on puzzle pages
function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
    // If locked, send them back home
    window.location.href = "../index.html";
  }
}

// Called on puzzle pages when a player submits an answer
function submitAnswer(puzzleId, inputValue) {
  const guess = normalizeAnswer(inputValue);
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return { ok: false, msg: "Puzzle not found." };

  const correct = normalizeAnswer(puzzle.answer);
  if (guess.length === 0) return { ok: false, msg: "Type an answer first." };

  if (guess === correct) {
    const progress = loadProgress();
    // Unlock next puzzle (or keep at max)
    const nextId = puzzleId + 1;
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, nextId);
    // Cap at last+1 is fine; list rendering checks per puzzle id anyway
    saveProgress(progress);
    return { ok: true, msg: "Correct! Next puzzle unlocked." };
  }

  return { ok: false, msg: "Not quite. Try again!" };
}

// Used on index.html to show lock/unlock state
function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return;

  const { unlockedUpTo } = loadProgress();

  listEl.innerHTML = "";
  for (const p of PUZZLES) {
    const isUnlocked = p.id <= unlockedUpTo;

    const li = document.createElement("li");
    li.className = "puzzle-item";

    const left = document.createElement("div");
    left.className = "left";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${p.title}</strong>`;

    const badge = document.createElement("span");
    badge.className = "badge " + (isUnlocked ? "open" : "locked");
    badge.textContent = isUnlocked ? "Unlocked" : "Locked";

    left.appendChild(title);
    left.appendChild(badge);

    const link = document.createElement("a");
    link.className = "button";
    link.textContent = isUnlocked ? "Open" : "Locked";
    link.href = p.path;
    link.setAttribute("aria-disabled", String(!isUnlocked));
    if (!isUnlocked) link.removeAttribute("href");

    li.appendChild(left);
    li.appendChild(link);
    listEl.appendChild(li);
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderIndex();
      alert("Progress reset on this device.");
    });
  }
}

// Auto-run on index
document.addEventListener("DOMContentLoaded", renderIndex);

// Expose functions to puzzle pages
window.PuzzleHunt = { requireUnlocked, submitAnswer };
