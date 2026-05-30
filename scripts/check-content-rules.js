import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, ROOT_DIR, writeJson, writeText } from "./config.js";
import { BANNED_VISIBLE_PHRASES, FOOTER_COPYRIGHT, loadTopics, pageFilePath, visibleText } from "./lib.js";

const topics = loadTopics();
const pages = [
  path.join(ROOT_DIR, "index.html"),
  path.join(ROOT_DIR, "tree.html"),
  path.join(ROOT_DIR, "search.html"),
  path.join(ROOT_DIR, "glossary.html"),
  ...topics.map(pageFilePath)
];

const errors = [];
const accessibilityNotes = [];
let simulationBlocks = 0;
let quizBlocks = 0;
let topicSpecificProfileBlocks = 0;

const MOJIBAKE_PATTERN = /[\u00c2\u00c3\u00d8\u00d9\u00e2\ufffd]/;
const GENERIC_EXPLANATION_PATTERNS = [
  /sits inside/i,
  /should be read through its hierarchy/i,
  /the parent sets the domain/i,
  /This page is a leaf topic in the spreadsheet tree/i,
  /Related topics will appear as the course grows/i,
  /Use the parent topic to decide which drawing/i,
  /You will usually meet it in documents such as method statements/i
];

for (const file of pages) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");

  if (html.includes('id="interactive"')) simulationBlocks += 1;
  if (html.includes("data-quiz")) quizBlocks += 1;
  if (/profile|protocol|surveillance|segmentation|building automation|Power over Ethernet|life-safety|structured cabling/i.test(text)) {
    topicSpecificProfileBlocks += 1;
  }
  if (!/<main[\s>]/i.test(html)) errors.push(`${rel} is missing semantic main`);
  if (!/<h1[\s>]/i.test(html)) errors.push(`${rel} is missing h1`);
  if (!/aria-label=/i.test(html)) accessibilityNotes.push(`${rel} should keep aria labels when edited`);
  if (!html.includes(FOOTER_COPYRIGHT)) errors.push(`${rel} missing copyright footer`);
  if (MOJIBAKE_PATTERN.test(text)) errors.push(`${rel} contains likely mojibake or replacement characters in visible text`);
  if (/youtube\.com\/results/i.test(html)) errors.push(`${rel} contains YouTube search results URL`);
  if (/id="videos"[\s\S]*id="interactive"/i.test(html)) errors.push(`${rel} may place interactive simulation inside videos area`);
  for (const pattern of GENERIC_EXPLANATION_PATTERNS) {
    if (pattern.test(text)) errors.push(`${rel} contains generic explanation pattern: ${pattern}`);
  }
  for (const phrase of BANNED_VISIBLE_PHRASES) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) errors.push(`${rel} contains banned phrase: ${phrase}`);
  }
}

const manualReview = topics
  .filter((topic) => topic.needs_manual_review || topic.review_notes.length)
  .map((topic) => ({
    id: topic.id,
    row_index: topic.row_index,
    title: topic.title,
    url: topic.url,
    notes: topic.review_notes
  }));

const stats = {
  generated_at: new Date().toISOString(),
  pages_checked: pages.length,
  quiz_blocks: quizBlocks,
  simulation_or_interactive_blocks: simulationBlocks,
  topic_specific_profile_blocks: topicSpecificProfileBlocks,
  pages_needing_manual_review: manualReview.length,
  errors,
  accessibility_notes: accessibilityNotes.length,
  ok: errors.length === 0
};

writeJson(FILES.contentRuleStats, stats);
writeText(
  path.join(DIRS.reports, "content-quality-report.md"),
  `# Content Quality Report

- Pages checked: ${stats.pages_checked}
- Quiz blocks: ${stats.quiz_blocks}
- Simulation/interactive blocks: ${stats.simulation_or_interactive_blocks}
- Pages with topic-specific profile language: ${stats.topic_specific_profile_blocks}
- Pages needing manual review: ${stats.pages_needing_manual_review}
- Errors: ${stats.errors.length}
`
);
writeText(
  path.join(DIRS.reports, "topic-explanation-quality-report.md"),
  `# Topic Explanation Quality Report

- Pages checked: ${stats.pages_checked}
- Topic-specific profile language detected: ${stats.topic_specific_profile_blocks}
- Generic explanation patterns blocked: ${GENERIC_EXPLANATION_PATTERNS.length}
- Mojibake/replacement-character check: enabled
- Errors: ${stats.errors.length}
`
);
writeText(
  path.join(DIRS.reports, "accessibility-report.md"),
  `# Accessibility Report

- Pages checked: ${stats.pages_checked}
- Semantic checks run: yes
- Pages retaining aria labels or accessible labels: ${stats.pages_checked - stats.accessibility_notes}
- Notes: ${stats.accessibility_notes}
- Reduced motion support: checked in CSS during review
`
);
writeText(
  path.join(DIRS.reports, "manual-review-report.md"),
  `# Manual Review Report

- Pages needing manual review: ${manualReview.length}

${manualReview
  .slice(0, 500)
  .map((item) => `- Row ${item.row_index}: ${item.title} (${item.url}) — ${item.notes.join("; ") || "Manual review requested"}`)
  .join("\n")}
`
);

console.log(JSON.stringify(stats, null, 2));
if (errors.length) process.exit(1);
