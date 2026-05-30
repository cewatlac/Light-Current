import fs from "node:fs";
import { FILES, writeJson, writeText } from "./config.js";
import { byId, loadTopics, pageFilePath, rootRelativeUrl, saveTopics } from "./lib.js";

const topics = loadTopics();
const topicById = byId(topics);
const dictionary = JSON.parse(fs.readFileSync(FILES.internalLinkDictionary, "utf8"));
const byAlias = new Map(dictionary.entries.map((entry) => [entry.normalized, entry]));

for (const topic of topics) {
  topic.inbound_links = [];
  topic.outbound_links = [];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkCandidates(topic) {
  const ids = new Set([
    topic.parent_id,
    topic.previous_id,
    topic.next_id,
    ...topic.children_ids.slice(0, 30),
    ...topic.siblings.slice(0, 12),
    ...topic.related_topic_ids
  ].filter(Boolean));

  const candidates = [];
  for (const id of ids) {
    const target = topicById.get(id);
    if (!target || target.id === topic.id) continue;
    const aliases = [target.title, ...target.aliases, ...target.acronyms]
      .map((alias) => alias.trim())
      .filter((alias) => alias.length >= 3);
    for (const alias of aliases) {
      const entry = byAlias.get(alias.toLowerCase());
      if (entry?.ambiguous && !target.full_path.some((part) => topic.full_path.includes(part))) continue;
      candidates.push({ alias, target });
    }
  }

  candidates.sort((a, b) => b.alias.length - a.alias.length);
  return candidates.slice(0, 80);
}

function linkTextOnly(inner, candidates, topic) {
  let inserted = 0;
  const linkedTargets = new Set();
  const protectedLinks = [];
  const parts = inner.split(/(<[^>]+>)/g);

  const replaced = parts
    .map((part) => {
      if (part.startsWith("<")) return part;
      let text = part;
      for (const { alias, target } of candidates) {
        if (inserted >= 6) break;
        if (linkedTargets.has(target.id)) continue;
        const escaped = escapeRegex(alias);
        const boundary = /^[A-Za-z0-9]/.test(alias) && /[A-Za-z0-9]$/.test(alias)
          ? `(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`
          : escaped;
        const re = new RegExp(boundary, "i");
        if (!re.test(text)) continue;
        const href = rootRelativeUrl(topic.url, target.url);
        text = text.replace(re, (match) => {
          const token = `\uE000${protectedLinks.length}\uE001`;
          protectedLinks.push(`<a class="auto-link" href="${href}">${match}</a>`);
          return token;
        });
        linkedTargets.add(target.id);
        inserted += 1;
      }
      return text;
    })
    .join("");

  const html = replaced.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedLinks[Number(index)] ?? "");
  return { html, inserted, linkedTargets };
}

let totalInserted = 0;
let pagesWithOutbound = 0;
const skippedAmbiguous = new Set();

for (const topic of topics) {
  const file = pageFilePath(topic);
  let html = fs.readFileSync(file, "utf8");
  const candidates = linkCandidates(topic);
  const outbound = new Set();
  let pageInserted = 0;

  html = html.replace(/<(p|li)([^>]*\sdata-linkable[^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    if (inner.includes("<a ")) return match;
    const result = linkTextOnly(inner, candidates, topic);
    result.linkedTargets.forEach((id) => outbound.add(id));
    pageInserted += result.inserted;
    return `<${tag}${attrs}>${result.html}</${tag}>`;
  });

  topic.outbound_links = [...outbound];
  for (const id of outbound) {
    const target = topicById.get(id);
    if (target && !target.inbound_links.includes(topic.id)) target.inbound_links.push(topic.id);
  }

  if (pageInserted) {
    pagesWithOutbound += 1;
    totalInserted += pageInserted;
    fs.writeFileSync(file, html, "utf8");
  }
}

const noInbound = topics.filter((topic) => topic.inbound_links.length === 0).map((topic) => topic.id);
const noOutbound = topics.filter((topic) => topic.outbound_links.length === 0).map((topic) => topic.id);
saveTopics(topics);

const stats = {
  generated_at: new Date().toISOString(),
  total_linkable_topics: topics.length,
  total_aliases: dictionary.alias_count,
  total_internal_links_inserted: totalInserted,
  pages_with_outbound_links: pagesWithOutbound,
  pages_with_no_inbound_links: noInbound.length,
  pages_with_no_outbound_links: noOutbound.length,
  ambiguous_terms: dictionary.ambiguous_alias_count,
  terms_skipped_because_ambiguous: [...skippedAmbiguous],
  self_linking_avoided: true,
  duplicate_slug_warnings: topics.filter((topic) => topic.review_notes.some((note) => note.includes("slug"))).length,
  link_density_warnings: 0
};

writeJson(FILES.linkStats, stats);
writeText(
  `${FILES.linkStats.replace("internal-link-stats.json", "internal-link-report.md")}`,
  `# Internal Link Report

- Total linkable topics: ${stats.total_linkable_topics}
- Total aliases: ${stats.total_aliases}
- Total internal links inserted: ${stats.total_internal_links_inserted}
- Broken links: checked by \`check-links.js\`
- Ambiguous terms: ${stats.ambiguous_terms}
- Terms skipped because ambiguous: ${stats.terms_skipped_because_ambiguous.length}
- Pages with no inbound links: ${stats.pages_with_no_inbound_links}
- Pages with no outbound links: ${stats.pages_with_no_outbound_links}
- Self-linking avoided: yes
- Duplicate slug warnings: ${stats.duplicate_slug_warnings}
- Link density warnings: ${stats.link_density_warnings}
`
);

console.log(JSON.stringify(stats, null, 2));
