import fs from "node:fs";
import { PDF_FILES, PDF_REFERENCE, REPORT_FILES, markdownTable, rel } from "./pdf-reference-system.js";
import { DIRS, readJson, writeText } from "./config.js";
import { escapeAttr, escapeHtml, loadTopics, pageFilePath, stripLeadingCode } from "./lib.js";

const START = "<!-- pdf-reference:start -->";
const END = "<!-- pdf-reference:end -->";

function removeExistingBlock(html) {
  const pattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
  return html.replace(pattern, "");
}

function sectionLimit(topic) {
  if (topic.importance_type === "major") return 4;
  if (topic.importance_type === "medium") return 3;
  return 1;
}

function pdfBlock(topic, integration) {
  const sections = integration.sections.slice(0, sectionLimit(topic));
  const cards = sections.map((section, index) => {
    const pageRange = section.page_range[0] === section.page_range[1]
      ? `p. ${section.page_range[0]}`
      : `pp. ${section.page_range[0]}-${section.page_range[1]}`;
    const componentText = section.components.length ? section.components.slice(0, 6).join(", ") : stripLeadingCode(topic.title);
    const standards = section.standards_or_references.slice(0, 4).join(" / ");
    return `<article class="card pdf-insight-card" data-pdf-section="${escapeAttr(section.section_id)}">
        <span class="chapter-num">PDF ${index + 1} · ${escapeHtml(pageRange)}</span>
        <h3>${escapeHtml(section.section_title)}</h3>
        <p class="ar-block" data-linkable>${escapeHtml(section.design_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(section.design_en)}</p>
        <ul>
          <li class="ar-block" data-linkable>${escapeHtml(section.site_ar)}</li>
          <li class="en-block en" data-linkable>${escapeHtml(section.site_en)}</li>
          <li class="ar-block" data-linkable>${escapeHtml(section.test_ar)}</li>
          <li class="en-block en" data-linkable>${escapeHtml(section.test_en)}</li>
          <li data-linkable>${escapeHtml(section.mistakes[0] ?? "Keep design assumptions traceable to drawings, schedules, and test evidence.")}</li>
        </ul>
        <p class="caption"><span class="ar-block">مصطلحات مرتبطة: ${escapeHtml(componentText)}</span><span class="en-block en">Related concepts: ${escapeHtml(componentText)}</span></p>
        ${standards ? `<p class="caption">References to check: ${escapeHtml(standards)}</p>` : ""}
      </article>`;
  }).join("\n");

  return `${START}
<section class="section pdf-reference-section" id="pdf-reference" data-pdf-reference="${escapeAttr(PDF_REFERENCE.label_en)}">
  <div class="wrap">
    <div class="chapter-head">
      <div>
        <span class="chapter-num">PDF REFERENCE</span>
        <h2><span class="ar-block">إضافات من المرجع العملي</span><span class="en-block en">Reference-Based Practical Notes</span></h2>
      </div>
    </div>
    <div class="card">
      <p class="ar-block">هذه الملاحظات مبنية على تحليل مرجع التيار الخفيف وإعادة صياغته كإرشادات تصميم وتركيب واختبار، وليست نقلا حرفيا من الكتاب.</p>
      <p class="en-block en">These notes are rewritten from the low-current reference as design, installation, and testing guidance. They are not copied from the book.</p>
      <p class="caption">${escapeHtml(PDF_REFERENCE.label_ar)} / ${escapeHtml(PDF_REFERENCE.label_en)}</p>
    </div>
    <div class="grid-2">
      ${cards}
    </div>
  </div>
</section>
${END}`;
}

function insertBlock(html, block) {
  const clean = removeExistingBlock(html);
  const refsIndex = clean.indexOf('<section class="section" id="refs">');
  if (refsIndex >= 0) return `${clean.slice(0, refsIndex)}${block}\n${clean.slice(refsIndex)}`;
  const mainEnd = clean.lastIndexOf("</main>");
  if (mainEnd >= 0) return `${clean.slice(0, mainEnd)}${block}\n${clean.slice(mainEnd)}`;
  return clean;
}

function ensurePageRules(html) {
  let next = html
    .replace(/<body class="[^"]*\blang-both\b([^"]*)"/, (match) => match.replace("lang-both", "lang-ar"))
    .replace(/<body class="[^"]*\blang-en\b([^"]*)"/, (match) => match.replace("lang-en", "lang-ar"))
    .replaceAll("<strong>Ashraf</strong>", "<strong>Eng Ashraf</strong>")
    .replaceAll(">Ashraf<", ">Eng Ashraf<")
    .replaceAll("Â© Anzma Tech Academy. All rights reserved.", "© Anzma Tech Academy. All rights reserved.");
  if (!next.includes("data-focus-btn")) {
    const tools = `<div class="floating-tools">
  <button class="smallbtn" type="button" data-top-btn aria-label="Back to top">↑</button>
  <button class="smallbtn" type="button" data-focus-btn aria-label="Focus mode" aria-pressed="false">◎</button>
</div>
`;
    next = next.replace("</body>", `${tools}</body>`);
  }
  return next;
}

function main() {
  const topics = loadTopics();
  const mapping = readJson(PDF_FILES.topicMapping);
  const byTopic = new Map(mapping.topic_integrations.map((item) => [item.topic_id, item]));
  const updated = [];
  const skipped = [];

  for (const topic of topics) {
    const integration = byTopic.get(topic.id);
    if (!integration) continue;
    const file = pageFilePath(topic);
    if (!fs.existsSync(file)) {
      skipped.push({ topic_id: topic.id, title: topic.title, reason: "page missing" });
      continue;
    }
    const before = fs.readFileSync(file, "utf8");
    const after = ensurePageRules(insertBlock(before, pdfBlock(topic, integration)));
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      updated.push({
        topic_id: topic.id,
        title: topic.title,
        path: rel(file),
        sections: integration.sections.length,
        groups: integration.groups
      });
    }
  }

  const rows = updated.slice(0, 140).map((item) => [
    item.topic_id,
    item.title,
    item.sections,
    item.groups.join("; "),
    `\`${item.path}\``
  ]);

  writeText(REPORT_FILES.integration, `# PDF Integration Report

Reference: ${PDF_REFERENCE.label_en} / ${PDF_REFERENCE.label_ar}

- Pages updated with PDF reference sections: ${updated.length}
- Skipped mapped pages: ${skipped.length}
- Integration method: inserted paraphrased bilingual reference notes into existing pages without deleting existing content.
- Public copyright rule: no long PDF text copied into HTML.

${markdownTable(rows, ["Topic ID", "Topic", "Sections", "Groups", "Path"])}
`);

  console.log(JSON.stringify({
    updated_pages: updated.length,
    skipped: skipped.length,
    integration_report: rel(REPORT_FILES.integration),
    data_file: rel(PDF_FILES.topicMapping)
  }, null, 2));

  if (skipped.length) {
    writeText(`${REPORT_FILES.integration}.skipped.json`, `${JSON.stringify(skipped, null, 2)}\n`);
  }
}

main();
