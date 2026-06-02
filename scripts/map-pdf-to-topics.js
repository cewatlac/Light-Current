import { PDF_FILES, PDF_REFERENCE, REPORT_FILES, candidateQueriesForConcept, markdownTable, normalizeKey, rel } from "./pdf-reference-system.js";
import { loadTopics } from "./lib.js";
import { readJson, writeJson, writeText } from "./config.js";

const STOP_TOKENS = new Set([
  "system", "systems", "data", "network", "control", "current", "light", "low", "page", "pages",
  "design", "testing", "test", "site", "chapter", "section", "project", "device", "devices",
  "الكهرباء", "النظام", "انظمة", "التيار", "الخفیف"
]);

function buildTokenIndex(topics) {
  const index = new Map();
  for (const topic of topics) {
    const text = normalizeKey([topic.title, topic.full_path.join(" "), topic.aliases?.join(" "), topic.acronyms?.join(" ")].join(" "));
    const tokens = new Set(text.split(/\s+/).filter((token) => token.length >= 3 && !STOP_TOKENS.has(token)));
    for (const token of tokens) {
      const list = index.get(token) ?? [];
      list.push(topic);
      index.set(token, list);
    }
  }
  for (const [token, list] of index) {
    if (list.length > 800) index.delete(token);
  }
  return index;
}

function prepareTopics(topics) {
  return topics.map((topic) => ({
    ...topic,
    search_text: normalizeKey([topic.title, topic.full_path.join(" "), topic.aliases?.join(" "), topic.acronyms?.join(" "), topic.keywords?.join(" ")].join(" "))
  }));
}

function localScore(topic, query, group) {
  const q = normalizeKey(query);
  if (!q) return 0;
  let score = 0;
  if (topic.search_text === q) score += 60;
  if (topic.search_text.includes(q)) score += 28;
  const tokens = q.split(/\s+/).filter((item) => item.length >= 3 && !STOP_TOKENS.has(item));
  for (const token of tokens) {
    if (topic.search_text.includes(token)) score += 5;
  }
  if (topic.importance_type === "major") score += 8;
  if (topic.importance_type === "medium") score += 4;
  if (group.terms.some((term) => topic.search_text.includes(normalizeKey(term)))) score += 4;
  return score;
}

function indexedTopicMatches(tokenIndex, concept, group, max = 5) {
  const pool = new Map();
  const queries = candidateQueriesForConcept(concept, group);
  for (const query of queries) {
    for (const token of normalizeKey(query).split(/\s+/).filter((item) => item.length >= 3 && !STOP_TOKENS.has(item))) {
      for (const topic of tokenIndex.get(token) ?? []) pool.set(topic.id, topic);
      if (pool.size > 2500) break;
    }
    if (pool.size > 2500) break;
  }
  const candidates = [...pool.values()];
  if (!candidates.length) return [];
  return candidates
    .map((topic) => {
      let score = 0;
      for (const query of queries) score = Math.max(score, localScore(topic, query, group));
      return { topic_id: topic.id, score, title: topic.title, url: topic.url, full_path: topic.full_path };
    })
    .filter((item) => item.score > 18)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

function main() {
  const topics = prepareTopics(loadTopics());
  const tokenIndex = buildTokenIndex(topics);
  const conceptsPayload = readJson(PDF_FILES.extractedConcepts);
  const knowledgeMap = readJson(PDF_FILES.knowledgeMap);
  const groupById = new Map(knowledgeMap.groups.map((group) => [group.id, group]));
  const groupsForScoring = new Map(knowledgeMap.groups.map((group) => [group.id, {
    id: group.id,
    chapter: group.chapter,
    terms: group.terms,
    topicTerms: group.topic_terms,
    externalReferences: group.external_references
  }]));

  const mappings = conceptsPayload.concepts.map((concept) => {
    const group = groupsForScoring.get(concept.group_id);
    const matches = indexedTopicMatches(tokenIndex, concept, group, 5);
    return {
      section_id: concept.id,
      group_id: concept.group_id,
      group: concept.group,
      section_title: concept.section_title,
      page_range: concept.page_range,
      suggested_topics: matches,
      primary_topic_id: matches[0]?.topic_id ?? null,
      integration_status: matches.length ? "mapped-to-existing-topic" : "manual-review-needed",
      manual_review_status: matches.length ? "not-needed" : "needs-topic-or-human-mapping",
      decision: matches.length
        ? "Integrate as a paraphrased PDF reference insight on the most specific matching existing page."
        : "No confident existing generated page found; keep in manual review report."
    };
  });

  const byTopic = new Map();
  for (const mapping of mappings) {
    for (const suggested of mapping.suggested_topics) {
      const list = byTopic.get(suggested.topic_id) ?? [];
      list.push({ ...mapping, mapped_topic_id: suggested.topic_id, mapped_score: suggested.score });
      byTopic.set(suggested.topic_id, list);
    }
  }

  const topicIntegrations = [...byTopic.entries()].map(([topic_id, entries]) => {
    const topic = topics.find((item) => item.id === topic_id);
    const groups = [...new Set(entries.map((entry) => entry.group_id))].map((id) => groupById.get(id)).filter(Boolean);
    const sections = entries.slice(0, 8).map((entry) => {
      const concept = conceptsPayload.concepts.find((item) => item.id === entry.section_id);
      return {
        section_id: entry.section_id,
        section_title: entry.section_title,
        page_range: entry.page_range,
        group_id: entry.group_id,
        group: entry.group,
        design_ar: concept.design_rules_ar[0],
        design_en: concept.design_rules[0],
        site_ar: concept.installation_checks_ar[0],
        site_en: concept.installation_checks[0],
        test_ar: concept.testing_checks_ar[0],
        test_en: concept.testing_checks[0],
        mistakes: concept.warnings_or_mistakes,
        visual_ideas: concept.diagram_or_visual_ideas,
        components: concept.component_names.slice(0, 10),
        standards_or_references: concept.standards_or_references.slice(0, 8)
      };
    });
    return {
      topic_id,
      title: topic.title,
      url: topic.url,
      full_path: topic.full_path,
      importance_type: topic.importance_type,
      group_ids: groups.map((group) => group.id),
      groups: groups.map((group) => group.chapter),
      section_count: entries.length,
      sections,
      source_reference: PDF_REFERENCE.label_en
    };
  }).sort((a, b) => b.section_count - a.section_count || a.title.localeCompare(b.title));

  const output = {
    generated_at: new Date().toISOString(),
    source_reference: PDF_REFERENCE,
    mapping_policy: "Map each inferred PDF section to the most specific existing topic page. Ambiguous or unmapped sections remain in manual review.",
    section_mappings: mappings,
    topic_integrations: topicIntegrations,
    totals: {
      sections: mappings.length,
      mapped_sections: mappings.filter((item) => item.primary_topic_id).length,
      manual_review_sections: mappings.filter((item) => !item.primary_topic_id).length,
      topics_receiving_pdf_insights: topicIntegrations.length
    }
  };

  writeJson(PDF_FILES.topicMapping, output);

  const topRows = topicIntegrations.slice(0, 80).map((item) => [
    item.topic_id,
    item.title,
    item.groups.join("; "),
    item.section_count,
    `\`${item.url}\``
  ]);
  const manualRows = mappings.filter((item) => !item.primary_topic_id).slice(0, 80).map((item) => [
    item.section_id,
    item.group,
    item.section_title,
    `${item.page_range[0]}-${item.page_range[1]}`,
    item.decision
  ]);

  writeText(REPORT_FILES.mapping, `# PDF Topic Mapping Report

Reference: ${PDF_REFERENCE.label_en} / ${PDF_REFERENCE.label_ar}

- Inferred PDF sections: ${output.totals.sections}
- Sections mapped to existing topic pages: ${output.totals.mapped_sections}
- Sections needing manual review: ${output.totals.manual_review_sections}
- Existing topic pages selected for PDF insights: ${output.totals.topics_receiving_pdf_insights}

## Top Topic Integrations

${markdownTable(topRows, ["Topic ID", "Topic", "PDF Groups", "Sections", "URL"])}

## Manual Review Samples

${manualRows.length ? markdownTable(manualRows, ["Section", "Group", "Title", "PDF Pages", "Decision"]) : "No unmapped sections."}

Mapping data file: \`${rel(PDF_FILES.topicMapping)}\`
`);

  console.log(JSON.stringify(output.totals, null, 2));
}

main();
