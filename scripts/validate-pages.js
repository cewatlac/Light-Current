import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, ROOT_DIR, readJson, writeJson, writeText } from "./config.js";
import { BANNED_VISIBLE_PHRASES, FOOTER_COPYRIGHT, loadTopics, pageFilePath, visibleText } from "./lib.js";

const topics = loadTopics();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

const slugs = new Set();
for (const topic of topics) {
  if (slugs.has(topic.slug)) fail(`Duplicate slug: ${topic.slug}`);
  slugs.add(topic.slug);
  if (!fs.existsSync(pageFilePath(topic))) fail(`Missing generated page for row ${topic.row_index}: ${topic.generated_page_path}`);
}

const indexes = [
  ["tree", FILES.tree, null],
  ["search-index", FILES.searchIndex, (value) => value.map((item) => item.id)],
  ["glossary", FILES.glossary, (value) => value.map((item) => item.id)],
  ["page-map", FILES.pageMap, (value) => Object.keys(value)]
];

for (const [name, file, idsFn] of indexes) {
  if (!fs.existsSync(file)) {
    fail(`Missing data file: ${name}`);
    continue;
  }
  if (!idsFn) continue;
  const value = readJson(file);
  const ids = new Set(idsFn(value));
  if (ids.size !== topics.length) fail(`${name} has ${ids.size} entries; expected ${topics.length}`);
  for (const topic of topics) {
    if (!ids.has(topic.id)) fail(`${name} missing topic ${topic.id}`);
  }
}

const pagesToCheck = [
  path.join(ROOT_DIR, "index.html"),
  path.join(ROOT_DIR, "tree.html"),
  path.join(ROOT_DIR, "search.html"),
  path.join(ROOT_DIR, "glossary.html"),
  ...topics.map(pageFilePath)
];

let checkedPages = 0;
for (const file of pagesToCheck) {
  if (!fs.existsSync(file)) {
    fail(`Missing page: ${path.relative(ROOT_DIR, file)}`);
    continue;
  }
  checkedPages += 1;
  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");

  if (!/<title>[^<]{3,}<\/title>/i.test(html)) fail(`${rel} is missing a useful title`);
  if (text.length < 250) fail(`${rel} has too little visible content`);
  if (!html.includes("https://anzmatech.com/")) fail(`${rel} is missing the logo destination`);
  if (!text.includes("Eng Mohamed El-Sisi") || !text.includes("Ashraf") || !text.includes(FOOTER_COPYRIGHT)) {
    fail(`${rel} is missing required footer credits`);
  }
  for (const phrase of BANNED_VISIBLE_PHRASES) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) fail(`${rel} contains banned visible phrase: ${phrase}`);
  }
  if (!rel.includes("electric-charge") && !text.includes("A. Foundations") && text.includes("A1. Electrical Basics")) {
    fail(`${rel} has a hardcoded A1 breadcrumb without A. Foundations context`);
  }
  if (html.includes("youtube.com/results")) fail(`${rel} contains a YouTube search URL`);
  if (/<div class="formula"[\s\S]*?<\/div>/i.test(html) && !/formula-explain/i.test(html)) {
    fail(`${rel} has a formula without a nearby explanation block`);
  }
}

const stats = {
  generated_at: new Date().toISOString(),
  topic_records: topics.length,
  checked_pages: checkedPages,
  generated_topic_pages: topics.filter((topic) => fs.existsSync(pageFilePath(topic))).length,
  errors,
  warnings,
  ok: errors.length === 0
};

writeJson(FILES.validationStats, stats);
writeText(
  path.join(DIRS.reports, "page-generation-report.md"),
  `# Page Generation Report

- Total topic records: ${stats.topic_records}
- Generated topic pages: ${stats.generated_topic_pages}
- Checked pages including top-level pages: ${stats.checked_pages}
- Validation status: ${stats.ok ? "passed" : "failed"}
- Errors: ${errors.length}
- Warnings: ${warnings.length}
`
);

console.log(JSON.stringify(stats, null, 2));
if (errors.length) process.exit(1);
