import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, writeJson, writeText } from "./config.js";
import { loadTopics } from "./lib.js";

function readOptional(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const topics = loadTopics();
const validation = readOptional(FILES.validationStats, {});
const links = readOptional(FILES.linkStats, {});
const linkCheck = readOptional(FILES.linkCheckStats, {});
const content = readOptional(FILES.contentRuleStats, {});
const visual = readOptional(FILES.visualValidationStats, {});

const summary = {
  generated_at: new Date().toISOString(),
  total_rows_in_csv: topics.length,
  total_topic_records_created: topics.length,
  total_html_pages_generated: validation.generated_topic_pages ?? 0,
  every_row_has_page: (validation.generated_topic_pages ?? 0) === topics.length,
  homepage_created: fs.existsSync(path.join(DIRS.scripts, "..", "index.html")),
  tree_page_created: fs.existsSync(path.join(DIRS.scripts, "..", "tree.html")),
  search_page_created: fs.existsSync(path.join(DIRS.scripts, "..", "search.html")),
  glossary_page_created: fs.existsSync(path.join(DIRS.scripts, "..", "glossary.html")),
  global_internal_link_count: links.total_internal_links_inserted ?? 0,
  broken_link_count: linkCheck.broken_links?.length ?? 0,
  ambiguous_link_count: links.ambiguous_terms ?? 0,
  simulation_interactive_blocks_added: content.simulation_or_interactive_blocks ?? 0,
  total_pages_reviewed_for_visuals: visual.pages_reviewed ?? 0,
  total_pages_with_meaningful_visual: visual.pages_with_at_least_one_meaningful_visual ?? 0,
  total_major_pages_with_3_plus_visuals: visual.major_pages_with_3_plus_visuals ?? 0,
  total_medium_pages_with_visuals: visual.medium_pages_with_visuals ?? 0,
  total_small_pages_with_visuals: visual.small_pages_with_visuals ?? 0,
  total_diagrams_generated: visual.diagrams_generated ?? 0,
  total_external_images_used: visual.external_images_used ?? 0,
  total_external_images_with_attribution: visual.external_images_with_attribution ?? 0,
  total_broken_images: visual.broken_images ?? 0,
  total_pages_expanded_for_content_depth: visual.pages_expanded_for_content_depth ?? 0,
  pages_needing_manual_review: content.pages_needing_manual_review ?? 0,
  validation_ok: Boolean(validation.ok && linkCheck.ok && content.ok && (visual.ok ?? true))
};

writeJson(FILES.buildSummary, summary);
writeText(
  path.join(DIRS.reports, "build-summary.md"),
  `# Build Summary

- Total rows in CSV: ${summary.total_rows_in_csv}
- Total topic records created: ${summary.total_topic_records_created}
- Total HTML pages generated: ${summary.total_html_pages_generated}
- Every row has a page: ${summary.every_row_has_page ? "yes" : "no"}
- Homepage created: ${summary.homepage_created ? "yes" : "no"}
- Tree page created: ${summary.tree_page_created ? "yes" : "no"}
- Search page created: ${summary.search_page_created ? "yes" : "no"}
- Glossary page created: ${summary.glossary_page_created ? "yes" : "no"}
- Global internal link count: ${summary.global_internal_link_count}
- Broken link count: ${summary.broken_link_count}
- Ambiguous link count: ${summary.ambiguous_link_count}
- Simulation/interactive blocks added: ${summary.simulation_interactive_blocks_added}
- Pages reviewed for visual/content depth: ${summary.total_pages_reviewed_for_visuals}
- Pages with at least one meaningful visual: ${summary.total_pages_with_meaningful_visual}
- Major pages with 3+ visuals: ${summary.total_major_pages_with_3_plus_visuals}
- Medium pages with visuals: ${summary.total_medium_pages_with_visuals}
- Small pages with visuals: ${summary.total_small_pages_with_visuals}
- Diagrams generated: ${summary.total_diagrams_generated}
- External images used: ${summary.total_external_images_used}
- External images with attribution: ${summary.total_external_images_with_attribution}
- Broken images: ${summary.total_broken_images}
- Pages expanded for content depth: ${summary.total_pages_expanded_for_content_depth}
- Pages needing manual review: ${summary.pages_needing_manual_review}
- Validation summary: ${summary.validation_ok ? "passed" : "failed"}
- Local command: \`npm.cmd run dev\`
`
);

console.log(JSON.stringify(summary, null, 2));
