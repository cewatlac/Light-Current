import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config.js";
import { loadTopics } from "./lib.js";
import { siteFooter, siteHeader, topPageHtml } from "./page-template.js";

const topics = loadTopics();
const units = [...new Set(topics.map((topic) => topic.unit))];
const unitOptions = units.map((unit) => `<option value="${unit}">${unit}</option>`).join("");

const body = `<body class="lang-both tree-page">
${siteHeader({ prefix: "./", breadcrumbHtml: "<span>Tree</span>", sectionLabel: "Explorer" })}
<main>
  <section class="page-hero">
    <div class="wrap">
      <span class="chapter-num">FULL TREE</span>
      <h1>Course Tree Explorer</h1>
      <p class="lead ar-block">استكشف كل units وtopics من ملف CSV. كل node هنا يفتح صفحة HTML مستقلة.</p>
      <p class="lead en-block en">Explore every unit and topic from the CSV. Every node links to a dedicated HTML page.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="toolbar">
        <input type="search" data-tree-search placeholder="Filter tree..." aria-label="Filter tree topics">
        <select data-tree-unit aria-label="Filter by unit"><option value="">All units</option>${unitOptions}</select>
        <select data-tree-level aria-label="Filter by level">
          <option value="">All levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
        </select>
        <button class="btn ghost" type="button" data-expand-all>Expand all</button>
        <button class="btn ghost" type="button" data-collapse-all>Collapse all</button>
      </div>
      <div class="tree-summary" data-tree-summary>${topics.length} pages</div>
      <div class="tree-view" data-tree-root></div>
    </div>
  </section>
</main>
${siteFooter("./")}
</body>`;

fs.writeFileSync(
  path.join(ROOT_DIR, "tree.html"),
  topPageHtml({
    title: "Course Tree | Light Current Course",
    description: "Full interactive tree explorer for all generated course topics.",
    body,
    prefix: "./",
    extraScripts: ["./js/tree.js"]
  }),
  "utf8"
);

console.log(JSON.stringify({ generated: "tree.html", topics: topics.length }, null, 2));
