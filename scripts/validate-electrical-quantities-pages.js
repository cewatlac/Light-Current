import fs from "node:fs";
import path from "node:path";
import { DIRS, ROOT_DIR, writeText } from "./config.js";
import { BANNED_VISIBLE_PHRASES, FOOTER_COPYRIGHT, loadTopics, pageFilePath, stripLeadingCode, visibleText } from "./lib.js";

const BASE_PATH = ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities"];
const titles = [
  "Electric charge",
  "Current",
  "Voltage",
  "Resistance",
  "Conductance",
  "Power",
  "Energy",
  "Frequency",
  "Period",
  "Phase",
  "RMS value",
  "Peak value",
  "Average value",
  "Instantaneous value"
];

const mojibakePattern = /[\u00c2\u00c3\u00d8\u00d9\u00e2\ufffd]/;

function topicKey(parts) {
  return parts.join(" > ");
}

function selectedTopics() {
  const topics = loadTopics();
  const byPath = new Map(topics.map((topic) => [topicKey(topic.full_path), topic]));
  return titles.map((title) => {
    const topic = byPath.get(topicKey([...BASE_PATH, title]));
    if (!topic) throw new Error(`Missing topic record for ${title}`);
    return topic;
  });
}

function parseQuiz(html) {
  const match = html.match(/<script type="application\/json" data-quiz-data>([\s\S]*?)<\/script>/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function internalLinks(html, filePath) {
  const links = [];
  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    const [hrefPath, hash] = href.split("#");
    if (!hrefPath) continue;
    links.push({
      href,
      resolved: path.resolve(path.dirname(filePath), hrefPath.replaceAll("/", path.sep)),
      hash
    });
  }
  return links;
}

function validateTopic(topic) {
  const file = pageFilePath(topic);
  const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
  const result = {
    title: stripLeadingCode(topic.title),
    path: rel,
    visuals: 0,
    visualKinds: 0,
    interaction: "",
    quiz: 0,
    references: 0,
    visibleCharacters: 0,
    links: 0,
    brokenLinks: 0,
    issues: []
  };

  if (!fs.existsSync(file)) {
    result.issues.push("missing generated page");
    return result;
  }

  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  result.visibleCharacters = text.length;
  result.visuals = (html.match(/data-educational-visual="true"/g) || []).length;
  result.visualKinds = new Set([...html.matchAll(/data-visual-kind="([^"]+)"/g)].map((match) => match[1])).size;
  result.interaction = html.match(/data-interaction="([^"]+)"/)?.[1] ?? "";
  const refsSection = html.match(/<section class="section" id="refs"[\s\S]*?<\/section>/i)?.[0] ?? "";
  result.references = (refsSection.match(/target="_blank"\s+rel="noopener"/g) || []).length;

  if (!/<body[^>]+class="[^"]*\blang-ar\b/.test(html)) result.issues.push("body does not default to lang-ar");
  if (!html.includes('href="https://anzmatech.com/"')) result.issues.push("missing Anzma logo link");
  for (const required of ["Eng Mohamed El-Sisi", "Eng Ashraf", FOOTER_COPYRIGHT]) {
    if (!text.includes(required)) result.issues.push(`missing footer credit: ${required}`);
  }
  for (const required of ["data-lang-btn", "data-theme-btn", "data-focus-btn", "data-top-btn"]) {
    if (!html.includes(required)) result.issues.push(`missing required control ${required}`);
  }
  for (const required of ["ar-block", "en-block", "data-quiz-question", "data-quiz-feedback", "data-result"]) {
    if (!html.includes(required)) result.issues.push(`missing bilingual/interactive marker ${required}`);
  }
  if (!html.includes("../../styles/electrical-quantities.css")) result.issues.push("missing shared electrical CSS");
  if (!html.includes("../../js/electrical-quantities.js")) result.issues.push("missing shared electrical JS");

  if (result.visuals < 3) result.issues.push("fewer than three educational visuals");
  if (result.visualKinds < 3) result.issues.push("visual kinds are not distinct enough");
  const figures = [...html.matchAll(/<figure\b[^>]*data-educational-visual="true"[\s\S]*?<\/figure>/gi)].map((match) => match[0]);
  for (const [index, figure] of figures.entries()) {
    if (!/<svg\b[^>]*role="img"/i.test(figure)) result.issues.push(`visual ${index + 1} missing role=img`);
    if (!/<svg\b[^>]*aria-label="[^"]{12,}"/i.test(figure)) result.issues.push(`visual ${index + 1} missing useful aria-label`);
    if (!/<figcaption\b[\s\S]*?<\/figcaption>/i.test(figure)) result.issues.push(`visual ${index + 1} missing caption`);
    if (!/data-visual-purpose="[^"]{20,}"/i.test(figure)) result.issues.push(`visual ${index + 1} missing purpose metadata`);
  }

  if (!result.interaction) result.issues.push("missing data-interaction");
  const formulas = (html.match(/class="formula"/g) || []).length;
  const explanations = (html.match(/formula-explain/g) || []).length;
  if (formulas === 0) result.issues.push("missing formula block");
  if (explanations < formulas) result.issues.push("formula without matching explanation");
  if (!/Symbols And Units|الرموز والوحدات/.test(html)) result.issues.push("formula symbols/units explanation missing");

  try {
    const quiz = parseQuiz(html);
    if (!quiz) result.issues.push("missing quiz JSON");
    else {
      result.quiz = quiz.length;
      if (quiz.length < 8) result.issues.push("quiz has fewer than eight questions");
      for (const [index, question] of quiz.entries()) {
        if (!question.q?.ar || !question.q?.en) result.issues.push(`quiz ${index + 1} missing bilingual question`);
        if (!Array.isArray(question.choices) || question.choices.length < 4) result.issues.push(`quiz ${index + 1} has too few choices`);
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) result.issues.push(`quiz ${index + 1} invalid answer`);
        if (!question.feedback?.ar || !question.feedback?.en) result.issues.push(`quiz ${index + 1} missing bilingual feedback`);
      }
    }
  } catch (error) {
    result.issues.push(`quiz JSON invalid: ${error.message}`);
  }

  const links = internalLinks(html, file);
  result.links = links.length;
  for (const link of links) {
    if (!fs.existsSync(link.resolved)) {
      result.brokenLinks += 1;
      result.issues.push(`broken internal link ${link.href}`);
      continue;
    }
    if (link.hash) {
      const targetHtml = fs.readFileSync(link.resolved, "utf8");
      const escaped = link.hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`id="${escaped}"|id='${escaped}'`).test(targetHtml)) {
        result.brokenLinks += 1;
        result.issues.push(`missing hash target ${link.href}`);
      }
    }
  }

  if (!/Parent[\s\S]*Previous[\s\S]*Next/i.test(html)) result.issues.push("missing parent/previous/next navigation");
  if (!/Related/.test(html)) result.issues.push("missing related topics section");
  if (result.references < 3) result.issues.push("fewer than three references");
  if (result.visibleCharacters < 5200) result.issues.push("visible content is too thin for requested depth");
  if (mojibakePattern.test(text)) result.issues.push("visible mojibake/replacement characters detected");
  if (/youtube\.com\/results|search YouTube/i.test(html)) result.issues.push("YouTube search link detected");
  if (/TODO|FIXME|lorem ipsum|placeholder content|as an AI/i.test(text)) result.issues.push("placeholder/meta phrase detected");
  for (const phrase of BANNED_VISIBLE_PHRASES) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) result.issues.push(`banned visible phrase: ${phrase}`);
  }

  return result;
}

function main() {
  const results = selectedTopics().map(validateTopic);
  const errors = results.flatMap((item) => item.issues.map((issue) => `${item.path}: ${issue}`));
  const passed = results.filter((item) => item.issues.length === 0).length;
  const rows = results.map((item) => {
    const status = item.issues.length ? "FAIL" : "PASS";
    return `| ${item.title} | \`${item.path}\` | ${item.visuals} | ${item.interaction || "none"} | ${item.quiz} | ${item.references} | ${item.links - item.brokenLinks}/${item.links} | ${item.visibleCharacters} | ${status} | ${item.issues.join("; ") || "clean"} |`;
  }).join("\n");

  const report = `# Electrical Quantities Validation

Scope: only the 14 generated topic pages under A. Foundations / A1. Electrical Basics / Basic electrical quantities.

## Summary

- Pages checked: ${results.length}
- Passed: ${passed}
- Failed: ${results.length - passed}
- Required footer: Eng Mohamed El-Sisi / Eng Ashraf / ${FOOTER_COPYRIGHT}
- Arabic default required: yes
- Shared CSS/JS required: yes
- Minimum visuals per page: 3
- Minimum quiz questions per page: 8

## Results

| Page | Path | Visuals | Interaction | Quiz | Refs | Links OK | Visible Chars | Status | Notes |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- | --- |
${rows}

## Commands

- \`node scripts/rebuild-electrical-quantities-pages.js\`
- \`node scripts/validate-electrical-quantities-pages.js\`
`;

  writeText(path.join(DIRS.reports, "electrical-quantities-validation.md"), report);
  console.log(JSON.stringify({
    checked_pages: results.length,
    passed,
    failed: results.length - passed,
    errors
  }, null, 2));

  if (errors.length) process.exit(1);
}

main();
