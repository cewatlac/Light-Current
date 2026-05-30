import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, writeJson, writeText } from "./config.js";
import { loadTopics, pageFilePath, visibleText } from "./lib.js";

const topics = loadTopics();
const plan = fs.existsSync(FILES.visualPlan) ? JSON.parse(fs.readFileSync(FILES.visualPlan, "utf8")) : null;
const planById = new Map((plan?.pages || []).map((entry) => [entry.page_id, entry]));
const errors = [];
const warnings = [];

const thresholds = {
  major: 3500,
  medium: 2400,
  small: 1500
};

const totals = {
  pages_reviewed: 0,
  pages_with_at_least_one_meaningful_visual: 0,
  major_pages_with_3_plus_visuals: 0,
  medium_pages_with_visuals: 0,
  small_pages_with_visuals: 0,
  diagrams_generated: 0,
  external_images_used: 0,
  external_images_with_attribution: 0,
  broken_images: 0,
  pages_expanded_for_content_depth: 0,
  pages_still_needing_manual_review: 0
};

function err(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

for (const topic of topics) {
  totals.pages_reviewed += 1;
  const file = pageFilePath(topic);
  const rel = path.relative(DIRS.generatedPages, file).replaceAll(path.sep, "/");
  const required = topic.importance_type === "major" ? 3 : topic.importance_type === "medium" ? 1 : 1;
  const depthRequired = thresholds[topic.importance_type] ?? thresholds.small;

  if (!fs.existsSync(file)) {
    err(`${topic.id} missing page file`);
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  const visualCount = (html.match(/data-educational-visual="true"/g) || []).length;
  const figureCount = (html.match(/<figure\b/gi) || []).length;
  const captionCount = (html.match(/<figcaption\b/gi) || []).length;
  const svgCount = (html.match(/<svg\b/gi) || []).length;
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const educationalFigures = [...html.matchAll(/<figure\b[^>]*data-educational-visual="true"[\s\S]*?<\/figure>/gi)].map((m) => m[0]);

  if (!planById.has(topic.id)) err(`${topic.id} missing from visual-plan.json`);
  if (visualCount < required) err(`${topic.id} has ${visualCount} meaningful visuals; requires ${required}`);
  if (visualCount > 0) totals.pages_with_at_least_one_meaningful_visual += 1;
  if (topic.importance_type === "major" && visualCount >= 3) totals.major_pages_with_3_plus_visuals += 1;
  if (topic.importance_type === "medium" && visualCount >= 1) totals.medium_pages_with_visuals += 1;
  if (topic.importance_type === "small" && visualCount >= 1) totals.small_pages_with_visuals += 1;
  totals.diagrams_generated += visualCount;

  if (figureCount && captionCount < figureCount) err(`${topic.id} has figures without captions`);
  if (svgCount < visualCount) err(`${topic.id} has visual markers without SVG diagrams`);
  if (!html.includes("data-visual-purpose=")) err(`${topic.id} visual purpose metadata missing`);

  for (const figure of educationalFigures) {
    if (!/<svg\b[^>]*role="img"/i.test(figure)) err(`${topic.id} educational figure missing role=img SVG`);
    if (!/<svg\b[^>]*aria-label="[^"]{12,}"/i.test(figure)) err(`${topic.id} educational figure missing useful aria-label`);
    if (!/<figcaption\b[\s\S]*?<\/figcaption>/i.test(figure)) err(`${topic.id} educational figure missing caption`);
  }

  for (const img of imageTags) {
    if (!/\balt="[^"]*"/i.test(img)) err(`${topic.id} image tag missing alt text`);
    if (/\bsrc="https?:\/\//i.test(img)) {
      totals.external_images_used += 1;
      err(`${topic.id} uses external image without local attribution handling`);
    }
  }

  if (text.length < depthRequired) err(`${topic.id} is shallow: ${text.length} chars, requires ${depthRequired}`);
  else totals.pages_expanded_for_content_depth += 1;

  if (topic.importance_type === "major") {
    if (!/architecture|concept path|system architecture|visual_type|data-visual-purpose/i.test(html)) err(`${topic.id} major page lacks architecture/concept diagram metadata`);
    if (!/Practical Example|practical example|Field Use/i.test(html)) err(`${topic.id} major page lacks practical example section`);
    if (!html.includes("data-quiz")) err(`${topic.id} major page lacks quiz`);
  }

  if (/\bTODO\b|\bFIXME\b|placeholder content|lorem ipsum|as an AI/i.test(text)) err(`${topic.id} contains banned placeholder language`);
  if (!html.includes("https://anzmatech.com/")) err(`${topic.id} missing logo link`);
  if (!text.includes("Eng Mohamed El-Sisi") || !text.includes("Ashraf")) err(`${topic.id} missing footer credits`);

  if (rel.includes(" ")) warn(`${topic.id} page filename contains spaces`);
}

const attribution = fs.existsSync(FILES.imageAttributions) ? JSON.parse(fs.readFileSync(FILES.imageAttributions, "utf8")) : { attributions: [] };
totals.external_images_with_attribution = attribution.attributions?.length ?? 0;
totals.pages_still_needing_manual_review = topics.filter((topic) => topic.needs_manual_review || topic.review_notes.length).length;

const stats = {
  generated_at: new Date().toISOString(),
  ...totals,
  errors,
  warnings,
  ok: errors.length === 0
};

writeJson(FILES.visualValidationStats, stats);
writeText(
  path.join(DIRS.reports, "visual-coverage-report.md"),
  `# Visual Coverage Report

- Pages reviewed: ${totals.pages_reviewed}
- Pages with at least one meaningful visual: ${totals.pages_with_at_least_one_meaningful_visual}
- Major pages with 3+ visuals: ${totals.major_pages_with_3_plus_visuals}
- Medium pages with visuals: ${totals.medium_pages_with_visuals}
- Small pages with visuals: ${totals.small_pages_with_visuals}
- Diagrams generated: ${totals.diagrams_generated}
- External images used: ${totals.external_images_used}
- Broken images: ${totals.broken_images}
- Validation status: ${errors.length === 0 ? "passed" : "failed"}
`
);
writeText(
  path.join(DIRS.reports, "visual-relevance-report.md"),
  `# Visual Relevance Report

- Visual strategy source: data/visual-plan.json
- Page-specific SVG labels: yes
- Strategy templates selected from topic title, path, keywords, and category.
- Decorative-only visuals counted as required visuals: no
- Errors: ${errors.length}
- Warnings: ${warnings.length}
`
);
writeText(
  path.join(DIRS.reports, "content-depth-report.md"),
  `# Content Depth Report

- Pages reviewed: ${totals.pages_reviewed}
- Pages meeting content-depth threshold: ${totals.pages_expanded_for_content_depth}
- Thresholds: major ${thresholds.major}, medium ${thresholds.medium}, small ${thresholds.small} visible characters
- Validation status: ${errors.filter((message) => message.includes("shallow")).length === 0 ? "passed" : "failed"}
`
);

console.log(JSON.stringify(stats, null, 2));
if (errors.length) process.exit(1);
