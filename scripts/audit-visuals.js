import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, ROOT_DIR, writeJson, writeText } from "./config.js";
import { loadTopics, pageFilePath, visibleText } from "./lib.js";

const topics = loadTopics();

function auditPage(topic) {
  const file = pageFilePath(topic);
  const result = {
    id: topic.id,
    row_index: topic.row_index,
    title: topic.title,
    url: topic.url,
    importance_type: topic.importance_type,
    exists: fs.existsSync(file),
    title_correct: false,
    breadcrumb_present: false,
    content_length: 0,
    meaningful_visuals: 0,
    image_count: 0,
    svg_count: 0,
    figure_count: 0,
    missing_alt_count: 0,
    missing_caption_count: 0,
    internal_links: 0,
    has_quiz: false,
    has_navigation: false,
    has_footer: false,
    has_banned_phrase: false,
    shallow: false,
    manual_review_flag: false,
    review_notes: []
  };

  if (!result.exists) {
    result.manual_review_flag = true;
    result.review_notes.push("Generated HTML file is missing.");
    return result;
  }

  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  result.title_correct = html.includes(`<title>${topic.title}`) || html.includes(topic.title);
  result.breadcrumb_present = topic.full_path.every((part) => text.includes(part));
  result.content_length = text.length;
  result.meaningful_visuals = (html.match(/data-educational-visual="true"/g) || []).length;
  result.image_count = (html.match(/<img\b/gi) || []).length;
  result.svg_count = (html.match(/<svg\b/gi) || []).length;
  result.figure_count = (html.match(/<figure\b/gi) || []).length;
  result.missing_alt_count = (html.match(/<img\b(?![^>]*\balt=)/gi) || []).length;
  result.missing_caption_count = Math.max(0, result.figure_count - (html.match(/<figcaption\b/gi) || []).length);
  result.internal_links = (html.match(/class="auto-link"/g) || []).length;
  result.has_quiz = html.includes("data-quiz");
  result.has_navigation = html.includes("Previous / Next") && html.includes("Related Topics");
  result.has_footer = text.includes("Eng Mohamed El-Sisi") && text.includes("Ashraf");
  result.has_banned_phrase = /\bTODO\b|\bFIXME\b|placeholder content|lorem ipsum|as an AI/i.test(text);

  const min = topic.importance_type === "major" ? 3500 : topic.importance_type === "medium" ? 2400 : 1500;
  result.shallow = result.content_length < min;
  if (result.meaningful_visuals === 0) result.review_notes.push("No explicit meaningful educational visual marker found.");
  if (result.shallow) result.review_notes.push(`Visible text is below ${min} characters for ${topic.importance_type} page.`);
  if (result.missing_alt_count) result.review_notes.push("One or more image tags are missing alt text.");
  if (result.missing_caption_count) result.review_notes.push("One or more figures are missing captions.");
  if (!result.has_quiz) result.review_notes.push("Quiz or quick-check block not detected.");
  if (!result.has_navigation) result.review_notes.push("Parent/related/previous-next navigation not detected.");
  result.manual_review_flag = result.review_notes.length > 0 || result.has_banned_phrase;
  return result;
}

const pages = topics.map(auditPage);
const totals = {
  generated_at: new Date().toISOString(),
  total_topics: topics.length,
  pages_reviewed: pages.length,
  pages_existing: pages.filter((page) => page.exists).length,
  pages_with_meaningful_visual: pages.filter((page) => page.meaningful_visuals > 0).length,
  pages_without_meaningful_visual: pages.filter((page) => page.meaningful_visuals === 0).length,
  pages_shallow: pages.filter((page) => page.shallow).length,
  pages_with_missing_alt: pages.filter((page) => page.missing_alt_count > 0).length,
  pages_with_missing_caption: pages.filter((page) => page.missing_caption_count > 0).length,
  pages_needing_manual_review: pages.filter((page) => page.manual_review_flag).length
};

writeJson(FILES.visualAuditStats, { ...totals, sample_issues: pages.filter((page) => page.manual_review_flag).slice(0, 200) });
writeText(
  path.join(DIRS.reports, "full-page-review-report.md"),
  `# Full Page Review Report

- Total generated topic pages expected: ${totals.total_topics}
- Pages reviewed: ${totals.pages_reviewed}
- Existing pages: ${totals.pages_existing}
- Pages with explicit meaningful visual markers: ${totals.pages_with_meaningful_visual}
- Pages without explicit meaningful visual markers: ${totals.pages_without_meaningful_visual}
- Pages below content-depth threshold: ${totals.pages_shallow}
- Pages with image alt issues: ${totals.pages_with_missing_alt}
- Pages with figure caption issues: ${totals.pages_with_missing_caption}
- Pages needing manual review: ${totals.pages_needing_manual_review}

This audit is generated from the current HTML output and is refreshed by \`npm.cmd run audit\`.
`
);
writeText(
  path.join(DIRS.reports, "content-depth-report.md"),
  `# Content Depth Report

- Major threshold: 3500 visible characters.
- Medium threshold: 2400 visible characters.
- Small threshold: 1500 visible characters.
- Pages below threshold: ${totals.pages_shallow}
- Pages passing threshold: ${totals.pages_reviewed - totals.pages_shallow}
`
);
writeText(
  path.join(DIRS.reports, "visual-coverage-report.md"),
  `# Visual Coverage Report

- Pages reviewed: ${totals.pages_reviewed}
- Pages with at least one explicit meaningful visual: ${totals.pages_with_meaningful_visual}
- Pages missing explicit meaningful visual markers: ${totals.pages_without_meaningful_visual}
- Pages with missing figure captions: ${totals.pages_with_missing_caption}
- Pages with missing image alt text: ${totals.pages_with_missing_alt}
`
);

console.log(JSON.stringify(totals, null, 2));
