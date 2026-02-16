const PUZZLES = [
  { id: 1, title: "The Red Fruit",     path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Orange Identity",   path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Banana Business",   path: "puzzles/puzzle3.html", answer: "BANANA" },
];

const STORAGE_KEY = "puzzle_hunt_progress_v7";

// -------------------------
// Background layers + transition overlay
// -------------------------
function ensureLayers() {
  if (!document.querySelector(".bg-glitter")) {
    const g = document.createElement("div");
    g.className = "bg-glitter";
    document.body.appendChild(g);
  }
  if (!document.querySelector(".bg-shimmer")) {
    const s = document.createElement("div");
    s.className = "bg-shimmer";
    document.body.appendChild(s);
  }
  if (!document.getElementById("pageTransition")) {
    const t = document.createElement("div");
    t.id = "pageTransition";
    document.body.appendChild(t);
  }
}

function navigateWithTransition(href) {
  ensureLayers();
  document.body.classList.add("pt-out");
  setTimeout(() => {
    window.location.href = href;
  }, 520);
}

// Intercept same-site links for smooth transitions
function enableLinkTransitions() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.getAttribute("aria-disabled") === "true") return;

    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    e.preventDefault();
    navigateWithTransition(url.href);
  });
}

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

    const solvedSet = new Set(solvedIds.map(Number).filter((n) => Number.isFinite(n) && n >= 1));
    return { unlockedUpTo, solvedIds: Array.from(solvedSet) };
  } catch {
    return fallback;
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function normalizeAnswer(s) {
  return (s ?? "").toString().trim().toUpperCase().replace(/\s+/g, " ");
}

function isSolved(puzzleId) {
  return loadProgress().solvedIds.includes(puzzleId);
}

// -------------------------
// Puzzle API
// -------------------------
function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
    navigateWithTransition("../index.html");
  }
}

function submitAnswer(puzzleId, inputValue) {
  if (isSolved(puzzleId)) {
    return { ok:false, msg:"You already solved this puzzle. Resubmission is disabled." };
  }

  const guess = normalizeAnswer(inputValue);
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return { ok:false, msg:"Puzzle not found." };
  if (!guess) return { ok:false, msg:"Type an answer first." };

  if (guess === normalizeAnswer(puzzle.answer)) {
    const progress = loadProgress();
    const solved = new Set(progress.solvedIds);
    solved.add(puzzleId);
    progress.solvedIds = Array.from(solved);
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, puzzleId + 1);
    saveProgress(progress);

    const isLast = puzzleId === PUZZLES[PUZZLES.length - 1].id;
    return {
      ok:true,
      msg: isLast ? "Correct! Final puzzle solved ✨" : "Correct! Next puzzle unlocked ✨",
      redirectHome:true
    };
  }

  return { ok:false, msg:"Not quite — try again." };
}

function getPuzzleState(puzzleId) {
  const { unlockedUpTo, solvedIds } = loadProgress();
  return { unlockedUpTo, solved: solvedIds.includes(puzzleId) };
}

// -------------------------
// Home render
// -------------------------
function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return;

  const progressEl = document.getElementById("progressText");
  const { unlockedUpTo, solvedIds } = loadProgress();
  const solvedSet = new Set(solvedIds);

  // Only show puzzles up to the next available one
  const visible = PUZZLES.filter(p => p.id <= unlockedUpTo);

  if (progressEl) progressEl.textContent = `Solved ${solvedSet.size} / ${PUZZLES.length}`;
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

// -------------------------
// Init
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  ensureLayers();
  enableLinkTransitions();
  renderIndex();
});

window.PuzzleHunt = {
  requireUnlocked,
  submitAnswer,
  getPuzzleState,
  navigateWithTransition,
};
