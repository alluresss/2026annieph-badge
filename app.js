const PUZZLES = [
  { id: 1, title: "The Red Fruit",     path: "puzzles/puzzle1.html", answer: "APPLE" },
  { id: 2, title: "Orange Identity",   path: "puzzles/puzzle2.html", answer: "ORANGE" },
  { id: 3, title: "Banana Business",   path: "puzzles/puzzle3.html", answer: "BANANA" },
];

const STORAGE_KEY = "puzzle_hunt_progress_v6";
const TRANSITION_KEY = "ph_transition_type";

/* -------------------------
   Wicked layers injection
------------------------- */
function ensureLayers() {
  // glitter + shimmer
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

  // emerald city (SVG silhouette, high-quality inspired)
  if (!document.querySelector(".bg-city")) {
    const city = document.createElement("div");
    city.className = "bg-city";
    city.innerHTML = `
      <svg viewBox="0 0 1200 420" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fog" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="rgba(22,242,165,0.0)"/>
            <stop offset="0.65" stop-color="rgba(22,242,165,0.10)"/>
            <stop offset="1" stop-color="rgba(22,242,165,0.18)"/>
          </linearGradient>
          <linearGradient id="cityFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="rgba(0,0,0,0.92)"/>
            <stop offset="1" stop-color="rgba(0,0,0,0.78)"/>
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feColorMatrix in="b" type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 .45 0" result="g"/>
            <feMerge>
              <feMergeNode in="g"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- glow haze -->
        <rect x="0" y="0" width="1200" height="420" fill="url(#fog)"></rect>

        <!-- CITY silhouette (inspired: spires, domes, central tower) -->
        <g filter="url(#softGlow)">
          <path fill="url(#cityFill)" d="
            M0,420 L0,300
            L40,300 L40,260 L70,260 L70,310 L95,310 L95,240 L130,240 L130,315
            L160,315 L160,220 L190,220 L190,320
            L220,320 L220,245 L250,245 L250,325
            L280,325 L280,205 L315,205 L315,330
            L350,330 L350,260 L380,260 L380,335
            L410,335 L410,190 L455,190 L455,345
            L485,345 L485,230 L515,230 L515,350

            <!-- central tall tower cluster -->
            L540,350 L540,160
            L555,160 L555,120 L570,120 L570,160
            L585,160 L585,90  L605,90  L605,160
            L620,160 L620,60  L640,60  L640,160
            L655,160 L655,95  L675,95  L675,160
            L690,160 L690,125 L705,125 L705,160
            L720,160 L720,190 L740,190 L740,355

            <!-- domes + spires right -->
            L770,355 L770,235 L800,235 L800,360
            L830,360 L830,210 L865,210 L865,365
            L895,365 L895,250 L925,250 L925,370
            L955,370 L955,225 L990,225 L990,375
            L1020,375 L1020,260 L1050,260 L1050,380
            L1085,380 L1085,240 L1120,240 L1120,385
            L1150,385 L1150,280 L1180,280 L1180,390
            L1200,390 L1200,420 Z
          "/>

          <!-- a few "emerald window" glows -->
          <g opacity="0.35">
            <rect x="600" y="105" width="8" height="12" fill="rgba(22,242,165,.8)"/>
            <rect x="632" y="80" width="8" height="14" fill="rgba(22,242,165,.7)"/>
            <rect x="458" y="210" width="7" height="11" fill="rgba(22,242,165,.55)"/>
            <rect x="990" y="245" width="7" height="11" fill="rgba(22,242,165,.50)"/>
          </g>
        </g>
      </svg>
    `;
    document.body.appendChild(city);
  }

  // transition overlay
  if (!document.getElementById("pageTransition")) {
    const t = document.createElement("div");
    t.id = "pageTransition";
    document.body.appendChild(t);
  }
}

/* -------------------------
   Transitions (cinematic)
------------------------- */
function isSameOrigin(url) {
  try { return new URL(url, location.href).origin === location.origin; }
  catch { return false; }
}

function playIncomingTransition() {
  const t = sessionStorage.getItem(TRANSITION_KEY);
  if (!t) return;

  // show overlay then fade it away
  document.body.classList.add("pt-in");
  // ensure it animates after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // remove after animation
      setTimeout(() => {
        document.body.classList.remove("pt-in");
        sessionStorage.removeItem(TRANSITION_KEY);
      }, 520);
    });
  });
}

function navigateWithTransition(href, type) {
  // store transition type for next page IN animation
  sessionStorage.setItem(TRANSITION_KEY, type);

  // OUT animation class
  document.body.classList.remove("pt-out-emerald", "pt-out-pink", "pt-out-solve");
  document.body.classList.add(type);

  // wait for out animation to be visible
  setTimeout(() => {
    location.href = href;
  }, type === "pt-out-solve" ? 600 : 500);
}

function enableLinkTransitions() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.getAttribute("aria-disabled") === "true") return;
    if (!isSameOrigin(a.href)) return;

    e.preventDefault();

    const fromIsPuzzle = location.pathname.includes("/puzzles/");
    const toIsPuzzle = a.href.includes("/puzzles/") || a.href.includes("puzzles/");
    const toIsHome = a.href.endsWith("/index.html") || a.href.endsWith("/");

    let outType = "pt-out-emerald";
    if (fromIsPuzzle && toIsHome) outType = "pt-out-pink";
    if (!fromIsPuzzle && toIsPuzzle) outType = "pt-out-emerald";

    navigateWithTransition(a.href, outType);
  });
}

/* -------------------------
   Storage helpers
------------------------- */
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

/* -------------------------
   Puzzle API
------------------------- */
function requireUnlocked(puzzleId) {
  const { unlockedUpTo } = loadProgress();
  if (puzzleId > unlockedUpTo) {
    navigateWithTransition("../index.html", "pt-out-pink");
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
      msg: isLast ? "Correct! You solved the final puzzle!" : "Correct! Next puzzle unlocked.",
      redirectHome:true,
      outType:"pt-out-solve"
    };
  }
  return { ok:false, msg:"Not quite. Try again!" };
}

function getPuzzleState(puzzleId) {
  const { unlockedUpTo, solvedIds } = loadProgress();
  return { unlockedUpTo, solved: solvedIds.includes(puzzleId) };
}

/* -------------------------
   Home render
------------------------- */
function renderIndex() {
  const listEl = document.getElementById("puzzleList");
  if (!listEl) return;

  const progressEl = document.getElementById("progressText");
  const { unlockedUpTo, solvedIds } = loadProgress();
  const solvedSet = new Set(solvedIds);

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

/* -------------------------
   Init
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  ensureLayers();
  enableLinkTransitions();
  renderIndex();
  playIncomingTransition();
});

window.PuzzleHunt = {
  requireUnlocked,
  submitAnswer,
  getPuzzleState,
  navigateWithTransition, // for solve redirect
};
