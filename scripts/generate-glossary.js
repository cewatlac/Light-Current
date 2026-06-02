import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config.js";
import { loadTopics } from "./lib.js";
import { siteFooter, siteHeader, topPageHtml } from "./page-template.js";

const topics = loadTopics();
const units = [...new Set(topics.map((topic) => topic.unit))];
const unitOptions = units.map((unit) => `<option value="${unit}">${unit}</option>`).join("");

const body = `<body class="lang-ar glossary-page">
${siteHeader({ prefix: "./", breadcrumbHtml: "<span>Glossary</span>", sectionLabel: "Glossary" })}
<main>
  <section class="page-hero">
    <div class="wrap">
      <span class="chapter-num">GLOSSARY</span>
      <h1>Course Glossary</h1>
      <p class="lead ar-block">كل terms من spreadsheet في مكان واحد، مع روابط مباشرة للصفحات.</p>
      <p class="lead en-block en">All spreadsheet terms in one place, linked to their generated pages.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="toolbar">
        <input type="search" data-glossary-search placeholder="Filter glossary..." aria-label="Filter glossary">
        <select data-glossary-unit aria-label="Filter glossary by unit"><option value="">All units</option>${unitOptions}</select>
      </div>
      <div class="glossary-summary" data-glossary-summary>${topics.length} terms</div>
      <div class="glossary-list" data-glossary-list></div>
    </div>
  </section>
</main>
${siteFooter("./")}
</body>`;

fs.writeFileSync(
  path.join(ROOT_DIR, "glossary.html"),
  topPageHtml({
    title: "Glossary | Light Current Course",
    description: "Generated glossary for all Light Current course topics.",
    body,
    prefix: "./",
    extraScripts: ["./js/glossary.js"]
  }),
  "utf8"
);

console.log(JSON.stringify({ generated: "glossary.html", topics: topics.length }, null, 2));
