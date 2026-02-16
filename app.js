// app.js — soft-lock puzzle hunt + wicked transitions

const PUZZLES = [
  { id: 1, title: "The Red Fruit",     path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Orange Identity",   path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Banana Business",   path: "puzzles/puzzle3.html", answer: "BANANA" },
];

const STORAGE_KEY = "puzzle_hunt_progress_v5";

// -------------------------
// Wicked background + transitions bootstrap
// -------------------------
function ensureWickedLayers() {
  // Emerald City background
  if (!document.querySelector(".bg-emerald-city")) {
    const city = document.createElement("div");
    city.className = "bg-emerald-city";
    document.body.appendChild(city);
  }

  // Transition overlay
  if (!document.getElementById("pageTransition")) {
    const t = document.createElement("div");
    t.id = "pageTransition";
    document.body.appendChild(t);
  }
}

function getPath() {
  return window.location.pathname || "";
}

function isPuzzlePath(href) {
  return href.includes("/puzzles/") || href.includes("puzzles/");
}

function isHomePath(href) {
  // covers /index.html and directory root
  return href.endsWith("/index.html") || href.endsWith("/");
}

function chooseTransitionForNavigation(fromPath, toHref, reason) {
  // reason can override (e.g., "solve")
  if (reason === "solve") return "t-emerald-burst";

  const goingToPuzzle = isPuzzlePath(toHref);
  const leavingPuzzle = isPuzzlePath(fromPath);

  if (!leavingPuzzle && goingToPuzzle) return "t-emerald-sweep";    // home -> puzzle
  if (leavingPuzzle && isHomePath(toHref)) return "t-pink-sparkle"; // puzzle -> home

  return "t-fade";
}

function navigateWithTransition(href, transitionClass) {
  ensureWickedLayers();
  // clear any prior transition classes
  document.body.classList.remove("t-fade", "t-emerald-sweep", "t-pink-sparkle", "t-emerald-burst");
  document.body.classList.add(transitionClass);

  // small delay so animation plays before navigation
  window.setTimeout(() => {
    window.location.href = href;
  }, 420);
}

// Intercept same-site link clicks to animate between pages
function enableLinkTransitions() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    // ignore modified clicks/new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (!a.href) return;

    const url = new URL(a.href, window.location.href);

    // only intercept same origin
    if (url.origin !== window.location.origin) return;

    // if disabled
    if (a.getAttribute("aria-disabled") === "true") return;

    e.preventDefault();
    const fromPath = getPath();
    const toHref = url.href;

    const tClass = chooseTransitionForNavigation(fromPath, toHref);
    navigateWithTransition(toHref, tClass);
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
    navigateWithTransition("../index.html", "t-pink-sparkle");
  }
}

function submitAnswer(puzzleId, inputValue) {
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

    const solved = new Set(progress.solvedIds);
    solved.add(puzzleId);
    progress.solvedIds = Array.from(solved);

    progress.unlockedUpTo = Math.max(progress.unlockedUpTo, puzzleId + 1);
    saveProgress(progress);

    const isLast = puzzleId === PUZZLES[PUZZLES.length - 1].id;
    return {
      ok: true,
      msg: isLast ? "Correct! You solved the final puzzle!" : "Correct! Next puzzle unlocked.",
      redirectHome: true,
      transition: "solve",
    };
  }

  return { ok: false, msg: "Not quite. Try again!" };
}

function getPuzzleState(puzzleId) {
  const { unlockedUpTo, solvedIds } = loadProgress();
  return { unlockedUpTo, solved: solvedIds.includes(puzzleId) };
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

  // Only show puzzles up to the next available one
  const visible = PUZZLES.filter((p) => p.id <= unlockedUpTo);

  // Progress text
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

  // Reset button
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
  ensureWickedLayers();
  enableLinkTransitions();
  renderIndex();
});

// Export for puzzle pages
window.PuzzleHunt = {
  requireUnlocked,
  submitAnswer,
  getPuzzleState,
  // also expose transition nav helper for puzzle pages if needed
  _navigateWithTransition: navigateWithTransition,
  _chooseTransition: chooseTransitionForNavigation,
};
