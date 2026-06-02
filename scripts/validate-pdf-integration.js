import fs from "node:fs";
import { PDF_FILES, PDF_REFERENCE, REPORT_FILES, rel } from "./pdf-reference-system.js";
import { readJson, writeText } from "./config.js";
import { loadTopics, pageFilePath, visibleText } from "./lib.js";

function mustExist(file, errors) {
  if (!fs.existsSync(file)) errors.push(`missing required file: ${rel(file)}`);
}

function main() {
  const errors = [];
  const warnings = [];
  for (const file of Object.values(PDF_FILES)) mustExist(file, errors);

  const topics = loadTopics();
  const mapping = fs.existsSync(PDF_FILES.topicMapping) ? readJson(PDF_FILES.topicMapping) : { topic_integrations: [], section_mappings: [] };
  const coverage = fs.existsSync(PDF_FILES.coverageIndex) ? readJson(PDF_FILES.coverageIndex) : { coverage: [] };
  const concepts = fs.existsSync(PDF_FILES.extractedConcepts) ? readJson(PDF_FILES.extractedConcepts) : { concepts: [] };

  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  let pagesWithBlocks = 0;
  let mappedPagesChecked = 0;

  for (const integration of mapping.topic_integrations ?? []) {
    const topic = topicById.get(integration.topic_id);
    if (!topic) {
      errors.push(`mapped topic id not found in topics.json: ${integration.topic_id}`);
      continue;
    }
    const file = pageFilePath(topic);
    if (!fs.existsSync(file)) {
      errors.push(`mapped page file missing: ${topic.url}`);
      continue;
    }
    mappedPagesChecked += 1;
    const html = fs.readFileSync(file, "utf8");
    const text = visibleText(html);
    if (html.includes('data-pdf-reference="')) pagesWithBlocks += 1;
    else errors.push(`mapped page missing PDF reference block: ${topic.url}`);
    if (!text.includes("Eng Mohamed El-Sisi") || !text.includes("Ashraf")) errors.push(`mapped page missing footer credit: ${topic.url}`);
    if (!html.includes("https://anzmatech.com/")) errors.push(`mapped page missing logo link: ${topic.url}`);
    if (/youtube\.com\/results|search YouTube/i.test(html)) errors.push(`mapped page contains YouTube search link: ${topic.url}`);
    if (/TODO|FIXME|lorem ipsum|placeholder content|as an AI/i.test(text)) errors.push(`mapped page contains placeholder/meta text: ${topic.url}`);
    if (text.includes("هذه الملاحظات مبنية") && !text.includes(PDF_REFERENCE.author_ar)) errors.push(`mapped page missing PDF attribution author: ${topic.url}`);
  }

  const coveredSections = new Set((coverage.coverage ?? []).map((item) => item.section_id));
  for (const concept of concepts.concepts ?? []) {
    if (!coveredSections.has(concept.id)) errors.push(`concept missing from coverage index: ${concept.id}`);
    if (!concept.integration_status) errors.push(`concept missing integration status: ${concept.id}`);
    if (!concept.manual_review_status) errors.push(`concept missing manual review status: ${concept.id}`);
  }

  if ((mapping.section_mappings ?? []).length !== (concepts.concepts ?? []).length) {
    warnings.push("section mapping count differs from extracted concept count");
  }

  const stats = {
    generated_at: new Date().toISOString(),
    concepts: concepts.concepts?.length ?? 0,
    coverage_rows: coverage.coverage?.length ?? 0,
    mapped_pages_checked: mappedPagesChecked,
    pages_with_pdf_blocks: pagesWithBlocks,
    errors,
    warnings,
    ok: errors.length === 0
  };

  writeText(REPORT_FILES.integration.replace(".md", "-validation.md"), `# PDF Integration Validation

- Concepts: ${stats.concepts}
- Coverage rows: ${stats.coverage_rows}
- Mapped pages checked: ${stats.mapped_pages_checked}
- Pages with PDF blocks: ${stats.pages_with_pdf_blocks}
- Errors: ${stats.errors.length}
- Warnings: ${stats.warnings.length}
- Status: ${stats.ok ? "passed" : "failed"}

${stats.errors.length ? stats.errors.map((item) => `- ${item}`).join("\n") : "No validation errors."}
`);

  console.log(JSON.stringify(stats, null, 2));
  if (errors.length) process.exit(1);
}

main();
