import { PDF_FILES, PDF_REFERENCE, REPORT_FILES, markdownTable, rel } from "./pdf-reference-system.js";
import { readJson, writeJson, writeText } from "./config.js";

function main() {
  const outline = readJson(PDF_FILES.outline);
  const mappings = readJson(PDF_FILES.topicMapping);
  const conceptPayload = readJson(PDF_FILES.extractedConcepts);

  const mapBySection = new Map(mappings.section_mappings.map((item) => [item.section_id, item]));
  const coverage = conceptPayload.concepts.map((concept) => {
    const mapping = mapBySection.get(concept.id);
    const decision = mapping?.primary_topic_id
      ? "integrate-into-existing-page"
      : concept.integration_status === "manual-review-needed"
        ? "manual-review-needed"
        : "manual-review-needed-no-confident-topic";
    return {
      section_id: concept.id,
      group_id: concept.group_id,
      group: concept.group,
      section_title: concept.section_title,
      page_range: concept.page_range,
      decision,
      suggested_topic_id: mapping?.primary_topic_id ?? null,
      suggested_topics: mapping?.suggested_topics ?? [],
      useful_concepts_detected: concept.component_names.length + concept.formulas_or_calculations.length + concept.diagram_or_visual_ideas.length,
      integration_status: mapping?.integration_status ?? concept.integration_status,
      manual_review_status: mapping?.manual_review_status ?? concept.manual_review_status
    };
  });

  const grouped = new Map();
  for (const item of coverage) {
    const stats = grouped.get(item.group_id) ?? { group: item.group, sections: 0, mapped: 0, manual: 0 };
    stats.sections += 1;
    if (item.suggested_topic_id) stats.mapped += 1;
    else stats.manual += 1;
    grouped.set(item.group_id, stats);
  }

  const output = {
    generated_at: new Date().toISOString(),
    source_reference: PDF_REFERENCE,
    outline_sections: outline.sections.length,
    coverage,
    totals: {
      sections: coverage.length,
      mapped: coverage.filter((item) => item.suggested_topic_id).length,
      manual_review: coverage.filter((item) => !item.suggested_topic_id).length,
      groups: grouped.size
    }
  };

  writeJson(PDF_FILES.coverageIndex, output);

  const groupRows = [...grouped.values()].sort((a, b) => a.group.localeCompare(b.group)).map((item) => [
    item.group,
    item.sections,
    item.mapped,
    item.manual
  ]);
  const manualRows = coverage.filter((item) => !item.suggested_topic_id).slice(0, 120).map((item) => [
    item.section_id,
    item.group,
    item.section_title,
    `${item.page_range[0]}-${item.page_range[1]}`,
    item.manual_review_status
  ]);

  writeText(REPORT_FILES.coverage, `# PDF Coverage Report

Reference: ${PDF_REFERENCE.label_en} / ${PDF_REFERENCE.label_ar}

- Sections covered by a decision: ${output.totals.sections}
- Sections mapped to existing pages: ${output.totals.mapped}
- Sections needing manual review: ${output.totals.manual_review}
- Groups covered: ${output.totals.groups}

## Coverage By Group

${markdownTable(groupRows, ["Group", "Sections", "Mapped", "Manual Review"])}

## Manual Review Queue

${manualRows.length ? markdownTable(manualRows, ["Section", "Group", "Title", "PDF Pages", "Status"]) : "No manual review items."}

Coverage data file: \`${rel(PDF_FILES.coverageIndex)}\`
`);

  writeText(REPORT_FILES.manualReview, `# PDF Manual Review Report

${manualRows.length ? markdownTable(manualRows, ["Section", "Group", "Title", "PDF Pages", "Status"]) : "No manual review items were produced by the current automated mapping."}

Important: manual review items are not discarded. They are held here because the script could not confidently map them to one existing generated page.
`);

  console.log(JSON.stringify(output.totals, null, 2));
}

main();
