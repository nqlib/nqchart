#!/usr/bin/env node
/**
 * Fail when the plan index, the plan files, the stories, and the epics disagree on status.
 *
 * The vault drifted before this lint: plans 001–006 said TODO in their files and DONE in
 * plans/README.md, and ST-022 / ST-023 stayed in `review` after v0.3.1 and v0.3.2 shipped.
 * Rules and status values: docs/conventions.md § Docs-as-code.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const plansDir = join(root, "plans");
const epicsDir = join(root, "docs/product/epics");

const PLAN_STATUS = new Set(["TODO", "IN-PROGRESS", "VERIFY", "DONE", "BLOCKED", "CANCELLED"]);
const STORY_STATUS = new Set([
  "backlog",
  "ready",
  "in-progress",
  "review",
  "done",
  "blocked",
  "cancelled",
]);
const EPIC_STATUS = new Set(["planned", "in-progress", "done", "cancelled"]);
const CLOSED = new Set(["done", "cancelled"]);

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const rel = (path) => path.slice(root.length + 1).replace(/\\/g, "/");

/** First word of a status cell: "**VERIFY** — ready" → "VERIFY". */
const firstWord = (cell) =>
  cell
    .replace(/\*\*/g, "")
    .trim()
    .split(/[\s(—–;,]/)[0];

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function tableRows(text) {
  return text
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .map((l) =>
      l
        .slice(1, l.endsWith("|") ? -1 : undefined)
        .split("|")
        .map((c) => c.trim()),
    );
}

// ---- Plans -------------------------------------------------------------------------------
const planFiles = readdirSync(plansDir).filter((f) => /^\d{3}-.+\.md$/.test(f));
const planStatus = new Map(); // "016" → "VERIFY"

for (const file of planFiles) {
  const id = file.slice(0, 3);
  const m = read(join(plansDir, file)).match(/^- \*\*Status:\*\*\s*(.+)$/m);
  if (!m) {
    fail(`plans/${file}`, "no `- **Status:**` line");
    continue;
  }
  const status = firstWord(m[1]);
  if (!PLAN_STATUS.has(status)) fail(`plans/${file}`, `unknown status "${status}"`);
  planStatus.set(id, status);
}

const indexRows = new Map();
for (const cells of tableRows(read(join(plansDir, "README.md")))) {
  if (/^\d{3}$/.test(cells[0] ?? "")) indexRows.set(cells[0], firstWord(cells.at(-1)));
}
for (const [id, status] of planStatus) {
  if (!indexRows.has(id)) fail("plans/README.md", `no row for plan ${id}`);
  else if (indexRows.get(id) !== status)
    fail("plans/README.md", `plan ${id} is "${indexRows.get(id)}" here and "${status}" in its file`);
}
for (const id of indexRows.keys()) {
  if (!planStatus.has(id)) fail("plans/README.md", `row ${id} has no plans/${id}-*.md file`);
}

// ---- Stories and epics -------------------------------------------------------------------
const epicIndex = new Map();
for (const cells of tableRows(read(join(root, "docs/product/README.md")))) {
  const id = cells[0]?.match(/EP-\d{3}/)?.[0];
  if (id && cells.length >= 3) epicIndex.set(id, firstWord(cells[2]));
}

for (const dir of readdirSync(epicsDir).filter((d) => d.startsWith("EP-"))) {
  const epicPath = join(epicsDir, dir, "epic.md");
  if (!existsSync(epicPath)) continue;
  const epicText = read(epicPath);
  const epic = frontmatter(epicText);
  const where = rel(epicPath);
  if (!EPIC_STATUS.has(epic.status)) fail(where, `unknown status "${epic.status}"`);
  if (epicIndex.has(epic.id) && epicIndex.get(epic.id) !== epic.status)
    fail(
      "docs/product/README.md",
      `${epic.id} is "${epicIndex.get(epic.id)}" here and "${epic.status}" in epic.md`,
    );

  // Story table inside the epic: every row counts toward "epic done".
  const tableStatus = new Map();
  for (const cells of tableRows(epicText)) {
    const sid = cells[0]?.match(/ST-\d{3}/)?.[0];
    if (sid && cells.length >= 3) tableStatus.set(sid, firstWord(cells[2]));
  }

  const storiesDir = join(epicsDir, dir, "stories");
  const storyFiles = existsSync(storiesDir)
    ? readdirSync(storiesDir).filter((f) => f.endsWith(".md"))
    : [];
  const storyStatus = new Map(tableStatus);

  for (const file of storyFiles) {
    const path = join(storiesDir, file);
    const story = frontmatter(read(path));
    const swhere = rel(path);
    storyStatus.set(story.id, story.status);
    if (!STORY_STATUS.has(story.status)) fail(swhere, `unknown status "${story.status}"`);
    if (story.epic && story.epic !== epic.id)
      fail(swhere, `epic is ${story.epic} but the file is under ${epic.id}`);
    if (tableStatus.has(story.id) && tableStatus.get(story.id) !== story.status)
      fail(where, `${story.id} is "${tableStatus.get(story.id)}" here and "${story.status}" in its file`);

    const planRef = story.plan?.match(/plans\/(\d{3})-/)?.[1];
    if (planRef) {
      const ps = planStatus.get(planRef);
      if (!ps) fail(swhere, `plan ${planRef} not found in plans/`);
      else if (story.status === "done" && ps !== "DONE")
        fail(swhere, `story is done but plan ${planRef} is ${ps}`);
      else if (ps === "DONE" && !CLOSED.has(story.status))
        fail(swhere, `plan ${planRef} is DONE but the story is "${story.status}"`);
    }
  }

  if (epic.status === "done") {
    for (const [sid, s] of storyStatus) {
      if (!CLOSED.has(s)) fail(where, `epic is done but ${sid} is "${s}"`);
    }
  }
}

if (errors.length) {
  console.error(`lint:status — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ${e}`);
  console.error("Status values and rules: docs/conventions.md § Docs-as-code.");
  process.exit(1);
}
console.log(`lint:status — ${planStatus.size} plans, epics and stories agree.`);

