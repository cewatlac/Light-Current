import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DIRS, FILES, ensureDir, readJson, readText, writeJson } from "./config.js";

export const FOOTER_COPYRIGHT = "© Anzma Tech Academy. All rights reserved.";

export const BANNED_VISIBLE_PHRASES = [
  "Anzma Tech website reference for brand direction",
  "هنكتب المصطلحات العملية",
  "ده اسمه هبل",
  "ELV engineers care",
  "as an AI",
  "placeholder content",
  "lorem ipsum",
  "search YouTube for",
  "click here to search",
  "TODO",
  "FIXME"
];

const STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "for",
  "to",
  "in",
  "on",
  "with",
  "by",
  "from",
  "system",
  "systems",
  "final",
  "big"
]);

const AMBIGUOUS_SINGLE_TERMS = new Set([
  "panel",
  "loop",
  "controller",
  "sensor",
  "server",
  "network",
  "storage",
  "reader",
  "gateway",
  "protocol",
  "alarm",
  "integration",
  "module",
  "device",
  "cable",
  "switch",
  "report",
  "test",
  "manual",
  "schedule",
  "matrix",
  "deliverables"
]);

export function hashText(text, length = 10) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, length);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export function stripLeadingCode(value) {
  return String(value ?? "").replace(/^[A-Z](?:\d+)?\.\s+/i, "").trim();
}

export function normalizeSpaces(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function titleContainsArabic(value) {
  return /[\u0600-\u06ff]/.test(String(value ?? ""));
}

export function asciiFold(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^\x00-\x7F]/g, "");
}

export function slugify(value) {
  const folded = asciiFold(stripLeadingCode(value) || value).toLowerCase();
  const slug = folded.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
  return (slug || "topic").slice(0, 76).replace(/-+$/g, "") || "topic";
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function topicPathFromRow(row) {
  const cells = row.map((cell) => normalizeSpaces(cell));
  while (cells.length && !cells[cells.length - 1]) cells.pop();
  return cells.filter((cell, index) => cell || index < cells.length - 1);
}

export function pathKey(topicPath) {
  return topicPath.join(" > ");
}

export function generateAcronyms(title) {
  const clean = stripLeadingCode(title);
  const acronyms = new Set();
  for (const match of clean.matchAll(/\b[A-Z][A-Z0-9]{1,}\b/g)) acronyms.add(match[0]);
  const words = clean.match(/[A-Za-z0-9]+/g) || [];
  if (words.length >= 2 && words.length <= 6) {
    const initials = words.map((word) => word[0]?.toUpperCase()).join("");
    if (initials.length >= 2 && initials.length <= 8) acronyms.add(initials);
  }
  return [...acronyms];
}

export function generateAliases(title, fullPath = []) {
  const aliases = new Set();
  const cleaned = normalizeSpaces(title);
  const noCode = stripLeadingCode(cleaned);
  const noPunctuation = normalizeSpaces(noCode.replace(/[()/_-]+/g, " "));
  const lower = noPunctuation.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  for (const candidate of [cleaned, noCode, noPunctuation]) {
    const normalized = normalizeSpaces(candidate);
    if (normalized.length >= 3) aliases.add(normalized);
  }

  if (words.length > 1) aliases.add(words.join(" "));
  if (words.length === 1 && words[0].length >= 4 && !AMBIGUOUS_SINGLE_TERMS.has(words[0])) {
    aliases.add(words[0]);
  }

  for (const acronym of generateAcronyms(title)) aliases.add(acronym);

  const pathTail = fullPath.slice(-2).map(stripLeadingCode).join(" ");
  if (pathTail.length >= 8 && pathTail.length <= 90) aliases.add(pathTail);

  return [...aliases]
    .map(normalizeSpaces)
    .filter((alias) => alias.length >= 3)
    .filter((alias) => !AMBIGUOUS_SINGLE_TERMS.has(alias.toLowerCase()))
    .slice(0, 10);
}

export function generateKeywords(topicPath) {
  const tokens = topicPath
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
  return [...new Set(tokens)].slice(0, 24);
}

export function classifyImportance(topic) {
  if (topic.level <= 2) return "major";
  if (topic.level === 3) return "medium";

  const pathText = `${topic.title} ${topic.full_path.join(" ")}`.toLowerCase();
  const highValue =
    /\b(cctv|camera|vms|nvr|access control|fire alarm|bms|bacnet|modbus|poe|vlan|ip address|subnet|protocol|gateway|controller|panel|detector|sensor|commissioning|integration|calculation|calculator|testing|handover|cybersecurity|network|architecture|storage|server|fiber|rack)\b/.test(
      pathText
    );
  return highValue ? "medium" : "small";
}

export function deriveRelationships(topics) {
  const byPath = new Map(topics.map((topic) => [pathKey(topic.full_path), topic]));
  const byId = new Map(topics.map((topic) => [topic.id, topic]));

  for (const topic of topics) {
    topic.parent_id = null;
    topic.children_ids = [];
    topic.siblings = [];
    topic.previous_id = null;
    topic.next_id = null;
  }

  for (const topic of topics) {
    const parentPath = topic.full_path.slice(0, -1);
    if (parentPath.length) {
      const parent = byPath.get(pathKey(parentPath));
      if (parent) {
        topic.parent_id = parent.id;
        parent.children_ids.push(topic.id);
      } else {
        topic.needs_manual_review = true;
        topic.review_notes.push("Parent path was not found in the CSV.");
      }
    }
  }

  for (let index = 0; index < topics.length; index += 1) {
    topics[index].previous_id = topics[index - 1]?.id ?? null;
    topics[index].next_id = topics[index + 1]?.id ?? null;
  }

  for (const topic of topics) {
    const siblings = topic.parent_id ? byId.get(topic.parent_id)?.children_ids ?? [] : topics.filter((t) => t.level === 1).map((t) => t.id);
    topic.siblings = siblings.filter((id) => id !== topic.id);
  }

  for (const topic of topics) {
    const related = new Set();
    if (topic.parent_id) related.add(topic.parent_id);
    topic.children_ids.slice(0, 12).forEach((id) => related.add(id));
    topic.siblings.slice(0, 8).forEach((id) => related.add(id));
    if (topic.previous_id) related.add(topic.previous_id);
    if (topic.next_id) related.add(topic.next_id);
    related.delete(topic.id);
    topic.related_topic_ids = [...related].slice(0, 18);
  }
}

export function buildTree(topics) {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const toNode = (topic) => ({
    id: topic.id,
    row_index: topic.row_index,
    title: topic.title,
    slug: topic.slug,
    url: topic.url,
    level: topic.level,
    importance_type: topic.importance_type,
    needs_manual_review: topic.needs_manual_review,
    children: topic.children_ids.map((id) => toNode(byId.get(id))).filter(Boolean)
  });
  return topics.filter((topic) => !topic.parent_id).map(toNode);
}

export function buildSearchIndex(topics) {
  return topics.map((topic) => ({
    id: topic.id,
    row_index: topic.row_index,
    title: topic.title,
    title_ar: topic.title_ar,
    title_en: topic.title_en,
    url: topic.url,
    level: topic.level,
    full_path: topic.full_path,
    unit: topic.unit,
    category: topic.category,
    aliases: topic.aliases,
    acronyms: topic.acronyms,
    keywords: topic.keywords,
    importance_type: topic.importance_type,
    snippet: `${topic.title} belongs to ${topic.full_path.join(" / ")}.`
  }));
}

export function buildGlossary(topics) {
  const entries = topics.map((topic) => {
    const group = stripLeadingCode(topic.title)[0]?.toUpperCase();
    return {
      id: topic.id,
      term: topic.title,
      term_ar: topic.title_ar,
      term_en: topic.title_en,
      acronym: topic.acronyms[0] ?? "",
      definition: `${topic.title} is a course concept under ${topic.full_path.slice(0, -1).join(" / ") || "the course root"}.`,
      url: topic.url,
      group: /[A-Z0-9]/.test(group ?? "") ? group : "#",
      unit: topic.unit,
      category: topic.category,
      keywords: topic.keywords
    };
  });
  entries.sort((a, b) => a.term.localeCompare(b.term, "en"));
  return entries;
}

export function buildPageMap(topics) {
  const map = {};
  for (const topic of topics) {
    map[topic.id] = {
      row_index: topic.row_index,
      title: topic.title,
      slug: topic.slug,
      url: topic.url,
      generated_page_path: topic.generated_page_path,
      full_path: topic.full_path
    };
  }
  return map;
}

export function writeDerivedData(topics) {
  writeJson(FILES.topics, topics);
  writeJson(FILES.tree, buildTree(topics));
  writeJson(FILES.searchIndex, buildSearchIndex(topics));
  writeJson(FILES.glossary, buildGlossary(topics));
  writeJson(FILES.pageMap, buildPageMap(topics));
}

export function loadTopics() {
  return readJson(FILES.topics);
}

export function saveTopics(topics) {
  writeDerivedData(topics);
}

export function makeTopicsFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const rawTopics = [];

  rows.forEach((row, zeroIndex) => {
    const topicPath = topicPathFromRow(row);
    if (!topicPath.length) return;
    rawTopics.push({
      row_index: zeroIndex + 1,
      full_path: topicPath,
      title: topicPath[topicPath.length - 1],
      level: topicPath.length
    });
  });

  const baseCounts = new Map();
  for (const topic of rawTopics) {
    const base = slugify(topic.title);
    baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
  }

  const usedSlugs = new Set();
  const topics = rawTopics.map((raw, index) => {
    const fullPathText = pathKey(raw.full_path);
    const base = slugify(raw.title);
    let slug = baseCounts.get(base) === 1 ? base : `${base}-${hashText(fullPathText, 6)}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${raw.row_index}`;
    usedSlugs.add(slug);

    const id = `topic-${String(index + 1).padStart(5, "0")}`;
    const aliases = generateAliases(raw.title, raw.full_path);
    const acronyms = generateAcronyms(raw.title);
    const keywords = generateKeywords(raw.full_path);
    const titleHasArabic = titleContainsArabic(raw.title);

    return {
      id,
      row_index: raw.row_index,
      source_row_hash: hashText(`${raw.row_index}|${fullPathText}`, 14),
      title: raw.title,
      title_ar: titleHasArabic ? raw.title : "",
      title_en: titleHasArabic ? "" : stripLeadingCode(raw.title),
      slug,
      url: `pages/generated/${slug}.html`,
      level: raw.level,
      full_path: raw.full_path,
      parent_id: null,
      children_ids: [],
      siblings: [],
      previous_id: null,
      next_id: null,
      unit: raw.full_path[0] ?? "",
      category: raw.full_path[1] ?? raw.full_path[0] ?? "",
      aliases,
      acronyms,
      keywords,
      importance_type: raw.level <= 2 ? "major" : raw.level === 3 ? "medium" : "small",
      generated_page_path: `pages/generated/${slug}.html`,
      inbound_links: [],
      outbound_links: [],
      related_topic_ids: [],
      needs_manual_review: false,
      review_notes: []
    };
  });

  const titleCounts = new Map();
  const slugBases = new Map();
  for (const topic of topics) {
    const titleKey = topic.title.toLowerCase();
    titleCounts.set(titleKey, (titleCounts.get(titleKey) ?? 0) + 1);
    const base = slugify(topic.title);
    slugBases.set(base, (slugBases.get(base) ?? 0) + 1);
  }

  for (const topic of topics) {
    if ((titleCounts.get(topic.title.toLowerCase()) ?? 0) > 1) {
      topic.review_notes.push("Duplicate title exists elsewhere; slug uses path-aware uniqueness.");
    }
    if ((slugBases.get(slugify(topic.title)) ?? 0) > 1) {
      topic.review_notes.push("Duplicate slug base exists; final slug is unique.");
    }
  }

  deriveRelationships(topics);
  return topics;
}

export function byId(topics) {
  return new Map(topics.map((topic) => [topic.id, topic]));
}

export function rootRelativeUrl(fromRootUrl, toRootUrl) {
  const fromDir = path.posix.dirname(fromRootUrl);
  let relative = path.posix.relative(fromDir, toRootUrl);
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}

export function pageFilePath(topic) {
  return path.join(DIRS.generatedPages, `${topic.slug}.html`);
}

export function cleanGeneratedPagesDir() {
  ensureDir(DIRS.generatedPages);
  for (const entry of fs.readdirSync(DIRS.generatedPages)) {
    if (entry.endsWith(".html")) fs.unlinkSync(path.join(DIRS.generatedPages, entry));
  }
}

export function fileExists(file) {
  return fs.existsSync(file);
}

export function readPage(topic) {
  return readText(pageFilePath(topic));
}

export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
