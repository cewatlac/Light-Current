import {
  GROUPS,
  PDF_FILES,
  PDF_REFERENCE,
  REPORT_FILES,
  buildSectionConcept,
  inferGroupRanges,
  loadOrExtractPdfPages,
  markdownTable,
  parseTocSections,
  rel
} from "./pdf-reference-system.js";
import { writeJson, writeText } from "./config.js";

function main() {
  const extracted = loadOrExtractPdfPages();
  const groups = inferGroupRanges(extracted.pages);
  const outlineSections = parseTocSections(extracted.pages, groups);
  const groupById = new Map(GROUPS.map((group) => [group.id, group]));
  const concepts = outlineSections.map((section) => {
    const group = groupById.get(section.group_id);
    return buildSectionConcept(section, extracted.pages, group);
  });
  const standardsGroup = GROUPS.find((group) => group.id === "group-10-standards-handover");
  concepts.push(
    {
      id: "pdf-section-standards-0001",
      group_id: standardsGroup.id,
      group: standardsGroup.chapter,
      section_title: "Cross-system codes, standards, specifications, and acceptance criteria",
      page_range: [21, 56],
      source_text_hash: "cross-system-standards",
      system_names: standardsGroup.terms,
      component_names: standardsGroup.topicTerms,
      formulas_or_calculations: ["Acceptance criteria should connect each standard or specification to a testable result."],
      design_rules: [standardsGroup.design_en],
      design_rules_ar: [standardsGroup.design_ar],
      installation_checks: [standardsGroup.site_en],
      installation_checks_ar: [standardsGroup.site_ar],
      testing_checks: [standardsGroup.test_en],
      testing_checks_ar: [standardsGroup.test_ar],
      warnings_or_mistakes: standardsGroup.mistakes,
      practical_examples: ["Convert a specification clause into a drawing note, BOQ item, inspection point, and commissioning evidence row."],
      standards_or_references: standardsGroup.externalReferences,
      diagram_or_visual_ideas: standardsGroup.visualIdeas,
      integration_status: "candidate-for-integration",
      manual_review_status: "ready-for-mapping",
      copyright_note: "Virtual cross-system concept generated from the PDF workflow and standards discussion; no verbatim text copied."
    },
    {
      id: "pdf-section-standards-0002",
      group_id: standardsGroup.id,
      group: standardsGroup.chapter,
      section_title: "Testing, commissioning, handover, and evidence chain",
      page_range: [19, 22],
      source_text_hash: "cross-system-handover",
      system_names: ["testing", "commissioning", "handover", "documentation"],
      component_names: ["Testing", "Commissioning", "Handover", "Documentation", "BOQ", "Specifications"],
      formulas_or_calculations: ["Traceability is the key calculation: asset + location + expected result + evidence + approval."],
      design_rules: [standardsGroup.design_en],
      design_rules_ar: [standardsGroup.design_ar],
      installation_checks: [standardsGroup.site_en],
      installation_checks_ar: [standardsGroup.site_ar],
      testing_checks: [standardsGroup.test_en],
      testing_checks_ar: [standardsGroup.test_ar],
      warnings_or_mistakes: standardsGroup.mistakes,
      practical_examples: ["Build a test sheet row that names the system, exact location, device label, actual result, screenshot/reading, and sign-off."],
      standards_or_references: standardsGroup.externalReferences,
      diagram_or_visual_ideas: standardsGroup.visualIdeas,
      integration_status: "candidate-for-integration",
      manual_review_status: "ready-for-mapping",
      copyright_note: "Virtual cross-system concept generated from the PDF workflow discussion; no verbatim text copied."
    }
  );

  const knowledgeMap = {
    generated_at: new Date().toISOString(),
    source_reference: PDF_REFERENCE,
    extraction_policy: "No public page should copy PDF paragraphs. Concepts are paraphrased into design, site, testing, warning, and visual-decision fields.",
    groups: GROUPS.map((group) => ({
      id: group.id,
      order: group.order,
      chapter: group.chapter,
      terms: group.terms,
      topic_terms: group.topicTerms,
      external_references: group.externalReferences,
      integration_templates: {
        design_ar: group.design_ar,
        design_en: group.design_en,
        site_ar: group.site_ar,
        site_en: group.site_en,
        test_ar: group.test_ar,
        test_en: group.test_en,
        mistakes: group.mistakes,
        visual_ideas: group.visualIdeas
      },
      section_count: concepts.filter((concept) => concept.group_id === group.id).length
    })),
    concept_count: concepts.length
  };

  writeJson(PDF_FILES.knowledgeMap, knowledgeMap);
  writeJson(PDF_FILES.extractedConcepts, {
    generated_at: new Date().toISOString(),
    source_reference: PDF_REFERENCE,
    copyright_policy: "Paraphrased extraction only. Raw PDF text is not stored in this public data file.",
    concepts
  });

  const rows = knowledgeMap.groups.map((group) => [
    group.order,
    group.chapter,
    group.section_count,
    group.terms.slice(0, 8).join(", "),
    group.integration_templates.visual_ideas.slice(0, 2).join("; ")
  ]);
  writeText(REPORT_FILES.coverage.replace("coverage", "knowledge-map"), `# PDF Knowledge Map Report

Reference: ${PDF_REFERENCE.label_en} / ${PDF_REFERENCE.label_ar}

- Groups: ${knowledgeMap.groups.length}
- Extracted section concepts: ${concepts.length}
- Public text policy: paraphrased concepts and decisions only.

${markdownTable(rows, ["#", "Group", "Sections", "Detected Terms", "Visual Ideas"])}
`);

  console.log(JSON.stringify({
    groups: knowledgeMap.groups.length,
    concepts: concepts.length,
    files: [rel(PDF_FILES.knowledgeMap), rel(PDF_FILES.extractedConcepts)]
  }, null, 2));
}

main();
