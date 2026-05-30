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
  pages_needing_manual_review: content.pages_needing_manual_review ?? 0,
  validation_ok: Boolean(validation.ok && linkCheck.ok && content.ok)
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
- Pages needing manual review: ${summary.pages_needing_manual_review}
- Validation summary: ${summary.validation_ok ? "passed" : "failed"}
- Local command: \`npm.cmd run dev\`
`
);

console.log(JSON.stringify(summary, null, 2));
