// ---------- Helpers ----------
function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch { return fallback; }
}

function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---------- Date ----------
document.getElementById("date").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long", month: "long", day: "numeric",
});

// ---------- Apps ----------
const APPS_KEY = "startpage.apps";
const BRAND = "https://ssl.gstatic.com/images/branding/product/2x/";

// Starting apps. Anything you add or remove on the page is saved in your browser.
const DEFAULT_APPS = [
  { name: "Claude",  url: "https://claude.ai" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Sheets",  url: "https://docs.google.com/spreadsheets", icon: BRAND + "sheets_2020q4_48dp.png" },
  { name: "Drive",   url: "https://drive.google.com",             icon: BRAND + "drive_2020q4_48dp.png" },
  { name: "Meet",    url: "https://meet.google.com",              icon: BRAND + "meet_2020q4_48dp.png" },
  { name: "Docs",    url: "https://docs.google.com/document",     icon: BRAND + "docs_2020q4_48dp.png" },
];

let apps = load(APPS_KEY, DEFAULT_APPS);

const appsEl = document.getElementById("apps");

function faviconFor(url) {
  return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
}

function renderApps() {
  appsEl.innerHTML = "";

  for (const app of apps) {
    const a = document.createElement("a");
    a.className = "app";
    a.href = app.url;
    a.title = app.url;

    const icon = document.createElement("span");
    icon.className = "app-icon";
    const img = document.createElement("img");
    img.alt = "";
    img.src = app.icon || faviconFor(app.url);
    img.onerror = () => { img.onerror = null; img.src = faviconFor(app.url); };
    icon.appendChild(img);

    const name = document.createElement("span");
    name.className = "app-name";
    name.textContent = app.name;

    const remove = document.createElement("button");
    remove.className = "app-remove";
    remove.setAttribute("aria-label", `Remove ${app.name}`);
    remove.textContent = "×";
    remove.onclick = e => {
      e.preventDefault();
      apps = apps.filter(x => x !== app);
      store(APPS_KEY, apps);
      renderApps();
    };

    a.append(icon, name, remove);
    appsEl.appendChild(a);
  }

  const add = document.createElement("button");
  add.className = "app app-add";
  add.innerHTML = '<span class="plus">+</span><span class="app-name">Add</span>';
  add.onclick = () => editAddTile(add);
  appsEl.appendChild(add);
}

// Clicking Add turns the tile into a URL box: Enter adds, Esc or clicking away cancels.
function editAddTile(tile) {
  if (tile.classList.contains("editing")) return;
  tile.classList.add("editing");
  tile.innerHTML = '<span class="plus">+</span>';

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Paste a website";
  input.setAttribute("aria-label", "Website to add");
  tile.appendChild(input);
  input.focus();

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addApp(input.value)) renderApps();
    } else if (e.key === "Escape") {
      renderApps();
    }
  });
  input.addEventListener("blur", () => renderApps());
}

function addApp(raw) {
  raw = raw.trim();
  if (!raw) return false;
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  let url;
  try { url = new URL(raw); } catch { return false; }
  if (!url.hostname.includes(".")) return false;

  const host = url.hostname.replace(/^www\./, "").split(".")[0];
  const name = host.charAt(0).toUpperCase() + host.slice(1);

  apps.push({ name, url: url.href });
  store(APPS_KEY, apps);
  return true;
}

renderApps();

// ---------- To-do list ----------
const TASKS_KEY = "startpage.tasks";
const listEl = document.getElementById("tasks");
const emptyEl = document.getElementById("empty");
const taskForm = document.getElementById("add-form");
const taskInput = document.getElementById("add-input");
const fill = document.getElementById("progress-fill");
const label = document.getElementById("progress-label");

let tasks = load(TASKS_KEY, []);

function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  fill.style.width = pct + "%";
  label.textContent = pct + "%";
  emptyEl.hidden = tasks.length > 0;
}

function renderTasks() {
  listEl.innerHTML = "";
  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");

    const check = document.createElement("button");
    check.className = "check";
    check.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done");
    check.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="#2a2766" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5"/></svg>';
    check.onclick = () => { task.done = !task.done; store(TASKS_KEY, tasks); renderTasks(); };

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = task.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "×";
    del.onclick = () => { tasks = tasks.filter(t => t !== task); store(TASKS_KEY, tasks); renderTasks(); };

    li.append(check, text, del);
    listEl.appendChild(li);
  }
  updateProgress();
}

taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  taskInput.value = "";
  store(TASKS_KEY, tasks);
  renderTasks();
});

renderTasks();

// ---------- Glider that chases the cursor ----------
// The glider was cut out of background.png; these are its spot and size in
// that 1920x1200 image, plus the pivot (centre of the fuselage). Nose points right.
const SPRITE = { x: 557, y: 219, w: 56, h: 85, pivotX: 28, pivotY: 38 };
const IMG_W = 1920, IMG_H = 1200;

const backdrop = document.getElementById("backdrop");
const glider = document.getElementById("glider");

const TRAIL = 26;        // how far behind the cursor it settles (px)
const MAX_SPEED = 16;    // px per frame
const MAX_TURN = 0.9;    // steering force: lower = wider, lazier arcs
const SLOW_RADIUS = 160; // starts easing off this far from the target

let mouse = null;        // null until the mouse first moves
let pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
let angle = 0, bank = 1, scale = 1, last = performance.now();

addEventListener("mousemove", e => { mouse = { x: e.clientX, y: e.clientY }; });

// Where the glider sits in the painting, in screen pixels
function homeSpot() {
  const r = backdrop.getBoundingClientRect();
  scale = r.width / IMG_W;
  return {
    x: r.left + (SPRITE.x + SPRITE.pivotX) * scale,
    y: r.top + (SPRITE.y + SPRITE.pivotY) * scale,
  };
}

function shortestTurn(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function fly(now) {
  const dt = Math.min((now - last) / 16.67, 3);
  last = now;

  if (!mouse) {
    // Until the mouse moves, stay exactly where the painting put it
    pos = homeSpot();
  } else {
    homeSpot(); // keeps the size in sync with the window
    const toX = mouse.x - pos.x, toY = mouse.y - pos.y;
    const dist = Math.hypot(toX, toY) || 1;

    // Aim for a point just behind the cursor, with a slight hover drift
    const t = now / 1000;
    const tx = mouse.x - (toX / dist) * TRAIL + Math.sin(t * 1.3) * 4;
    const ty = mouse.y - (toY / dist) * TRAIL + Math.cos(t * 1.7) * 4;

    // "Arrive" steering: full speed when far, easing in when close
    const dx = tx - pos.x, dy = ty - pos.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = MAX_SPEED * Math.min(1, d / SLOW_RADIUS);
    let sx = (dx / d) * speed - vel.x, sy = (dy / d) * speed - vel.y;
    const s = Math.hypot(sx, sy);
    if (s > MAX_TURN) { sx = (sx / s) * MAX_TURN; sy = (sy / s) * MAX_TURN; }
    vel.x += sx * dt; vel.y += sy * dt;
    pos.x += vel.x * dt; pos.y += vel.y * dt;

    // Always point the nose at the cursor, turning smoothly
    const aim = Math.atan2(toY, toX);
    angle += shortestTurn(angle, aim) * Math.min(1, 0.18 * dt);

    // Roll over (like a real glider) when it swaps between heading left and right
    const c = Math.cos(angle);
    const wantBank = c < -0.25 ? -1 : c > 0.25 ? 1 : Math.sign(bank) || 1;
    bank += (wantBank - bank) * Math.min(1, 0.12 * dt);
  }

  glider.style.width = SPRITE.w * scale + "px";
  glider.style.transformOrigin = `${SPRITE.pivotX * scale}px ${SPRITE.pivotY * scale}px`;
  glider.style.transform =
    `translate(${pos.x - SPRITE.pivotX * scale}px, ${pos.y - SPRITE.pivotY * scale}px) ` +
    `rotate(${angle}rad) scaleY(${bank})`;

  requestAnimationFrame(fly);
}

requestAnimationFrame(fly);

// ---------- AI story of the day ----------
// Uses Hacker News (free, no key) to find the AI article with the most upvotes
// from the past 7 days. One story per day; stories already shown are skipped.
const NEWS_KEY = "startpage.news";
const SEARCH_TERMS = ["AI", "LLM", "OpenAI", "Anthropic", "Claude", "ChatGPT", "Gemini", "GPT"];
const AI_TITLE = /\b(AI|A\.I\.|AGI|LLMs?|GPT[-\w.]*|ChatGPT|OpenAI|Anthropic|Claude|Gemini|DeepMind|Copilot|Llama|Mistral|machine learning|neural net\w*)\b/i;
// Paywalled sites and things that aren't really articles
const SKIP_SITES = [
  "nytimes.com", "wsj.com", "ft.com", "bloomberg.com", "economist.com", "washingtonpost.com",
  "theatlantic.com", "newyorker.com", "wired.com", "businessinsider.com", "theinformation.com",
  "telegraph.co.uk", "thetimes.co.uk", "barrons.com", "hbr.org", "medium.com", "newscientist.com",
  "technologyreview.com", "fortune.com", "reuters.com",
  "github.com", "arxiv.org", "x.com", "twitter.com", "youtube.com", "linkedin.com",
];

const newsTitle = document.getElementById("news-title");
const newsMeta = document.getElementById("news-meta");

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function siteOf(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function isSkipped(url) {
  const host = siteOf(url);
  return SKIP_SITES.some(s => host === s || host.endsWith("." + s));
}

function timeAgo(seconds) {
  const days = Math.floor((Date.now() / 1000 - seconds) / 86400);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

function showStory(story) {
  newsTitle.textContent = story.title;
  newsTitle.href = story.url;
  newsMeta.innerHTML = "";
  const hn = document.createElement("a");
  hn.href = `https://news.ycombinator.com/item?id=${story.id}`;
  hn.textContent = `${story.comments} comments`;
  newsMeta.append(`${siteOf(story.url)} · ${story.points} points · ${timeAgo(story.created)} · `, hn);
}

async function findStory(alreadyShown) {
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const results = await Promise.all(SEARCH_TERMS.map(term =>
    fetch("https://hn.algolia.com/api/v1/search?" + new URLSearchParams({
      query: term,
      tags: "story",
      restrictSearchableAttributes: "title",
      numericFilters: `created_at_i>${since},points>50`,
      hitsPerPage: "50",
    })).then(r => r.json()).catch(() => ({ hits: [] }))
  ));

  const seen = new Set();
  const candidates = results.flatMap(r => r.hits).filter(h => {
    if (seen.has(h.objectID)) return false;
    seen.add(h.objectID);
    return h.url && AI_TITLE.test(h.title) && !isSkipped(h.url) && !/^(Ask|Tell) HN/i.test(h.title);
  });
  candidates.sort((a, b) => b.points - a.points);

  const pick = candidates.find(h => !alreadyShown.includes(h.objectID)) || candidates[0];
  if (!pick) return null;
  return {
    id: pick.objectID, title: pick.title, url: pick.url,
    points: pick.points, comments: pick.num_comments, created: pick.created_at_i,
  };
}

async function loadNews() {
  const saved = load(NEWS_KEY, { day: null, story: null, shown: [] });

  if (saved.day === todayKey() && saved.story) {
    showStory(saved.story);
    return;
  }

  try {
    const story = await findStory(saved.shown);
    if (!story) throw new Error("no story");
    const shown = [story.id, ...saved.shown.filter(id => id !== story.id)].slice(0, 60);
    store(NEWS_KEY, { day: todayKey(), story, shown });
    showStory(story);
  } catch {
    if (saved.story) showStory(saved.story);
    else newsTitle.textContent = "Couldn't reach the news right now. Try again later.";
  }
}

loadNews();
