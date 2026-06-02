import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config.js";
import { buildTree, loadTopics } from "./lib.js";
import { siteFooter, siteHeader, topPageHtml } from "./page-template.js";

const topics = loadTopics();
const units = buildTree(topics);
const counts = topics.reduce(
  (acc, topic) => {
    acc[topic.importance_type] += 1;
    acc[`level_${topic.level}`] = (acc[`level_${topic.level}`] ?? 0) + 1;
    return acc;
  },
  { major: 0, medium: 0, small: 0 }
);

const unitCards = units
  .map(
    (unit) => `<article class="unit-card">
      <span class="chapter-num">UNIT</span>
      <h3><a href="${unit.url}">${unit.title}</a></h3>
      <p>${unit.children.length} main branches · ${countDesc(unit)} pages</p>
    </article>`
  )
  .join("");

function countDesc(node) {
  let count = 1;
  for (const child of node.children) count += Number.parseInt(countDesc(child), 10);
  return String(count);
}

const body = `<body class="lang-ar home-page">
${siteHeader({ prefix: "./", breadcrumbHtml: "<span>Home</span>", sectionLabel: "Static Course" })}
<main>
  <section class="hero home-hero">
    <div class="wrap hero-grid">
      <div class="reveal">
        <div class="pill"><span class="pulse-dot"></span> Light Current · Static Course Website</div>
        <h1><span class="gradient">Light Current Course</span></h1>
        <p class="lead ar-block">منصة تعليمية static مبنية من spreadsheet كاملة. كل topic له صفحة مستقلة، مع tree، search، glossary، وinternal linking يساعدك تتحرك بين الأنظمة والمفاهيم بسرعة.</p>
        <p class="lead en-block en">A static educational course generated from the full spreadsheet. Every topic has a dedicated page with tree navigation, search, glossary, and internal links.</p>
        <div class="hero-search" role="search">
          <input type="search" placeholder="Search topics, acronyms, systems..." data-home-search aria-label="Search course topics">
          <div data-home-results class="home-results"></div>
        </div>
        <div class="hero-actions">
          <a class="btn" href="tree.html">Open Full Tree</a>
          <a class="btn ghost" href="search.html">Search</a>
          <a class="btn ghost" href="glossary.html">Glossary</a>
        </div>
      </div>
      <div class="hero-card reveal">
        <div class="course-radar" aria-label="Course generation statistics">
          <div class="radar-ring"></div>
          <div class="radar-core">${topics.length}</div>
          <span>Generated topic pages</span>
        </div>
      </div>
    </div>
  </section>

  <section class="stats-strip">
    <div class="wrap stats-grid-wide">
      <div class="stat-wide"><b>${topics.length}</b><span>Total topic rows</span></div>
      <div class="stat-wide"><b>${counts.major}</b><span>Major pages</span></div>
      <div class="stat-wide"><b>${counts.medium}</b><span>Medium pages</span></div>
      <div class="stat-wide"><b>${counts.small}</b><span>Small pages</span></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="chapter-head">
        <div>
          <span class="chapter-num">UNITS</span>
          <h2>Course Units</h2>
        </div>
        <a class="btn ghost" href="tree.html">Expand Tree</a>
      </div>
      <div class="grid-3">${unitCards}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="card">
        <div class="chapter-head">
          <div>
            <span class="chapter-num">TREE PREVIEW</span>
            <h2>Interactive Course Tree</h2>
          </div>
          <div class="tree-tools">
            <button class="btn ghost" type="button" data-expand-all>Expand</button>
            <button class="btn ghost" type="button" data-collapse-all>Collapse</button>
          </div>
        </div>
        <div class="tree-view compact" data-tree-root data-tree-limit="280"></div>
      </div>
    </div>
  </section>
</main>
${siteFooter("./")}
</body>`;

fs.writeFileSync(
  path.join(ROOT_DIR, "index.html"),
  topPageHtml({
    title: "Light Current Course | Static Learning Platform",
    description: "Static Light Current course homepage with interactive tree and search.",
    body,
    prefix: "./",
    extraScripts: ["./js/tree.js", "./js/search.js"]
  }),
  "utf8"
);

console.log(JSON.stringify({ generated: "index.html", topics: topics.length }, null, 2));
