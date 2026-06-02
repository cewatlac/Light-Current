import fs from "node:fs";
import path from "node:path";
import {
  PDF_FILES,
  PDF_PAGE_CACHE,
  PDF_PATH,
  PDF_REFERENCE,
  REPORT_FILES,
  cleanText,
  inferGroupRanges,
  loadOrExtractPdfPages,
  markdownTable,
  parseTocSections,
  rel
} from "./pdf-reference-system.js";
import { ensureDir, writeJson, writeText } from "./config.js";

function main() {
  const extracted = loadOrExtractPdfPages();
  const pages = extracted.pages;
  const groups = inferGroupRanges(pages);
  const sections = parseTocSections(pages, groups);

  const outline = {
    generated_at: new Date().toISOString(),
    source_pdf: rel(PDF_PATH),
    source_reference: PDF_REFERENCE,
    page_count: extracted.page_count,
    metadata: extracted.metadata,
    has_embedded_outline: false,
    extraction_note: "The PDF has no embedded bookmarks; chapter ranges and sections were inferred from visible page headers and table-of-contents text.",
    private_cache: rel(PDF_PAGE_CACHE),
    chapters: groups.map((group) => ({
      id: group.id,
      order: group.order,
      title: group.chapter,
      page_range: [group.start_page, group.end_page],
      section_count: sections.filter((section) => section.group_id === group.id).length
    })),
    sections
  };

  writeJson(PDF_FILES.outline, outline);
  ensureDir(path.dirname(REPORT_FILES.outline));
  const chapterRows = outline.chapters.map((chapter) => [
    chapter.order,
    chapter.title,
    `${chapter.page_range[0]}-${chapter.page_range[1]}`,
    chapter.section_count
  ]);
  const sectionRows = sections.slice(0, 120).map((section) => [
    section.group,
    cleanText(section.title).slice(0, 80),
    `${section.start_page}-${section.end_page}`,
    section.source
  ]);
  writeText(REPORT_FILES.outline, `# PDF Outline Report

Reference: ${PDF_REFERENCE.label_en} / ${PDF_REFERENCE.label_ar}

- Source PDF: \`${rel(PDF_PATH)}\`
- Pages: ${outline.page_count}
- Embedded bookmarks: no
- Inferred chapters: ${outline.chapters.length}
- Inferred sections: ${sections.length}
- Private extraction cache: \`${rel(PDF_PAGE_CACHE)}\`

## Chapter Ranges

${markdownTable(chapterRows, ["#", "Chapter", "PDF Pages", "Sections"])}

## First Inferred Sections

${markdownTable(sectionRows, ["Group", "Section", "PDF Pages", "Source"])}

Copyright note: this report records outline and page ranges only. It does not reproduce the book text.
`);

  console.log(JSON.stringify({
    source_pdf: rel(PDF_PATH),
    page_count: outline.page_count,
    chapters: outline.chapters.length,
    sections: sections.length,
    cache_exists: fs.existsSync(PDF_PAGE_CACHE)
  }, null, 2));
}

main();
