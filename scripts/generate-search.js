import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config.js";
import { loadTopics } from "./lib.js";
import { siteFooter, siteHeader, topPageHtml } from "./page-template.js";

const topics = loadTopics();

const body = `<body class="lang-ar search-page">
${siteHeader({ prefix: "./", breadcrumbHtml: "<span>Search</span>", sectionLabel: "Search" })}
<main>
  <section class="page-hero">
    <div class="wrap">
      <span class="chapter-num">SEARCH</span>
      <h1>Search The Course</h1>
      <p class="lead ar-block">ابحث بالعنوان، acronym، alias، unit، category، أو full path.</p>
      <p class="lead en-block en">Search by title, acronym, alias, unit, category, or full path.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="search-panel">
        <input type="search" data-search-input placeholder="Type CCTV, BACnet, voltage, handover..." aria-label="Search course">
        <div class="search-meta" data-search-meta>${topics.length} searchable topics</div>
      </div>
      <div class="search-results" data-search-results></div>
    </div>
  </section>
</main>
${siteFooter("./")}
</body>`;

fs.writeFileSync(
  path.join(ROOT_DIR, "search.html"),
  topPageHtml({
    title: "Search | Light Current Course",
    description: "Client-side search for all generated Light Current course pages.",
    body,
    prefix: "./",
    extraScripts: ["./js/search.js"]
  }),
  "utf8"
);

console.log(JSON.stringify({ generated: "search.html", topics: topics.length }, null, 2));
