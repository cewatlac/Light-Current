import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, ROOT_DIR, writeJson, writeText } from "./config.js";
import { loadTopics, pageFilePath } from "./lib.js";

const topics = loadTopics();
const pages = [
  path.join(ROOT_DIR, "index.html"),
  path.join(ROOT_DIR, "tree.html"),
  path.join(ROOT_DIR, "search.html"),
  path.join(ROOT_DIR, "glossary.html"),
  ...topics.map(pageFilePath)
];

const broken = [];
let internalLinks = 0;
let externalLinks = 0;

function isExternal(href) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

for (const file of pages) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
  for (const match of html.matchAll(/\shref="([^"]+)"/gi)) {
    const href = match[1];
    if (!href || href.startsWith("#")) continue;
    if (isExternal(href)) {
      externalLinks += 1;
      continue;
    }
    const [hrefPath, hash] = href.split("#");
    const resolved = path.resolve(path.dirname(file), hrefPath);
    internalLinks += 1;
    if (!fs.existsSync(resolved)) {
      broken.push({ page: rel, href });
      continue;
    }
    if (hash) {
      const targetHtml = fs.readFileSync(resolved, "utf8");
      const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`id="${escaped}"|'${escaped}'`).test(targetHtml)) {
        broken.push({ page: rel, href, reason: "missing hash target" });
      }
    }
  }
}

const stats = {
  generated_at: new Date().toISOString(),
  pages_checked: pages.length,
  internal_links_checked: internalLinks,
  external_links_seen: externalLinks,
  broken_links: broken,
  ok: broken.length === 0
};

writeJson(FILES.linkCheckStats, stats);
writeText(
  path.join(DIRS.reports, "broken-link-report.md"),
  `# Broken Link Report

- Pages checked: ${stats.pages_checked}
- Internal links checked: ${stats.internal_links_checked}
- External links seen: ${stats.external_links_seen}
- Broken internal links: ${broken.length}

${broken.slice(0, 200).map((item) => `- ${item.page} -> ${item.href}${item.reason ? ` (${item.reason})` : ""}`).join("\n")}
`
);

console.log(JSON.stringify(stats, null, 2));
if (broken.length) process.exit(1);
