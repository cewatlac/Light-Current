import fs from "node:fs";
import path from "node:path";
import { DIRS, ROOT_DIR, writeText } from "./config.js";
import { BANNED_VISIBLE_PHRASES, loadTopics, pageFilePath, stripLeadingCode, visibleText } from "./lib.js";

const targetPaths = [
  ["A. Foundations"],
  ["A. Foundations", "A1. Electrical Basics"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Electric charge"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Current"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Voltage"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Resistance"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Conductance"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Power"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Energy"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Frequency"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Period"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Phase"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "RMS value"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Peak value"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Average value"],
  ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities", "Instantaneous value"]
];

const requiredFooter = [
  "Eng Mohamed El-Sisi",
  "Eng Ashraf",
  "© Anzma Tech Academy. All rights reserved."
];

function countMatches(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

function topicKey(parts) {
  return parts.join(" > ");
}

function parseQuiz(html) {
  const match = html.match(/<script type="application\/json" data-quiz-data>([\s\S]*?)<\/script>/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

function relativeLinkTargets(html, filePath) {
  const links = [];
  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (
      href.startsWith("#") ||
      href.startsWith("http:") ||
      href.startsWith("https:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }
    const withoutHash = href.split("#")[0];
    if (!withoutHash) continue;
    links.push({
      href,
      path: path.resolve(path.dirname(filePath), withoutHash.replaceAll("/", path.sep))
    });
  }
  return links;
}

function validatePage(topic) {
  const filePath = pageFilePath(topic);
  const rel = path.relative(ROOT_DIR, filePath).replaceAll(path.sep, "/");
  const result = {
    title: stripLeadingCode(topic.title),
    path: rel,
    visuals: 0,
    visualKinds: 0,
    interaction: false,
    quizCount: 0,
    footer: false,
    focusTools: false,
    language: false,
    formulas: true,
    links: 0,
    brokenLinks: 0,
    issues: []
  };

  if (!fs.existsSync(filePath)) {
    result.issues.push("missing generated HTML file");
    return result;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const text = visibleText(html);
  result.visuals = countMatches(html, /data-educational-visual="true"/g);
  result.visualKinds = new Set([...html.matchAll(/data-visual-kind="([^"]+)"/g)].map((match) => match[1])).size;
  result.interaction = /data-interaction="/.test(html);
  result.footer = requiredFooter.every((item) => html.includes(item));
  result.focusTools = html.includes("data-top-btn") && html.includes("data-focus-btn");
  result.language = /<body[^>]+class="[^"]*\blang-ar\b/.test(html) && html.includes("ar-block") && html.includes("en-block");

  const classTokens = [...html.matchAll(/class="([^"]+)"/g)].map((match) => match[1].split(/\s+/));
  const formulas = classTokens.filter((tokens) => tokens.includes("formula")).length;
  const explanations = classTokens.filter((tokens) => tokens.includes("formula-explain")).length;
  result.formulas = formulas === 0 || explanations >= formulas;

  try {
    const quiz = parseQuiz(html);
    result.quizCount = quiz.length;
    for (const [index, item] of quiz.entries()) {
      if (!item.q_ar || !item.q_en || !Array.isArray(item.choices_ar) || !Array.isArray(item.choices_en)) {
        result.issues.push(`quiz item ${index + 1} missing bilingual fields`);
      }
      if (item.answer !== 0 && !Number.isInteger(item.answer)) {
        result.issues.push(`quiz item ${index + 1} has invalid answer index`);
      }
    }
  } catch (error) {
    result.issues.push(`quiz JSON is invalid: ${error.message}`);
  }

  const links = relativeLinkTargets(html, filePath);
  result.links = links.length;
  for (const link of links) {
    if (!fs.existsSync(link.path)) {
      result.brokenLinks += 1;
      result.issues.push(`broken relative link ${link.href}`);
    }
  }

  if (result.visuals < 3) result.issues.push("fewer than three teaching visuals");
  if (result.visualKinds < 3) result.issues.push("visuals are not sufficiently distinct");
  if (!result.interaction) result.issues.push("missing interactive section");
  if (result.quizCount < 8) result.issues.push("quiz has fewer than eight questions");
  if (!result.footer) result.issues.push("missing required footer credits");
  if (!result.focusTools) result.issues.push("missing Back to top or Focus mode tools");
  if (!result.language) result.issues.push("Arabic default or bilingual blocks missing");
  if (!result.formulas) result.issues.push("formula lacks matching explanation block");
  if (text.length < 3200) result.issues.push("visible lesson text is too thin for the requested depth");

  for (const phrase of BANNED_VISIBLE_PHRASES) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      result.issues.push(`banned visible phrase: ${phrase}`);
    }
  }
  if (/[ØÙÂâ]/.test(text)) result.issues.push("mojibake-like visible encoding artifacts detected");
  if (/youtube\.com\/results|search YouTube/i.test(html)) result.issues.push("YouTube search link detected");
  if (/TODO|FIXME|lorem ipsum|placeholder content|as an AI/i.test(text)) result.issues.push("placeholder or meta text detected");
  if (/A\. Foundations<\/span><span>\/<\/span><span>A1\. Electrical Basics/.test(html) && topic.level > 2) {
    result.issues.push("breadcrumb appears hardcoded instead of path-aware");
  }

  return result;
}

function main() {
  const topics = loadTopics();
  const byPath = new Map(topics.map((topic) => [topicKey(topic.full_path), topic]));
  const selected = targetPaths.map((parts) => {
    const topic = byPath.get(topicKey(parts));
    if (!topic) throw new Error(`Missing topic record for ${topicKey(parts)}`);
    return topic;
  });

  const results = selected.map(validatePage);
  const errors = results.flatMap((item) => item.issues.map((issue) => `${item.path}: ${issue}`));
  const passCount = results.filter((item) => item.issues.length === 0).length;
  const rows = results.map((item) => {
    const status = item.issues.length ? "FAIL" : "PASS";
    const issueText = item.issues.length ? item.issues.join("; ") : "clean";
    return `| ${item.title} | \`${item.path}\` | ${item.visuals} | ${item.interaction ? "yes" : "no"} | ${item.quizCount} | ${item.links - item.brokenLinks}/${item.links} | ${status} | ${issueText} |`;
  }).join("\n");

  const report = `# Foundations Basic Quantities Validation

Scope: targeted repair of the first 17 Foundations/Electrical Basics rows only. No full-site regeneration is part of this validation.

## Summary

- Pages checked: ${results.length}
- Passed: ${passCount}
- Failed: ${results.length - passCount}
- Required visible footer credits: ${requiredFooter.join(" / ")}
- Required tools checked: Back to top and Focus mode
- Required language default checked: \`body.lang-ar\`

## Page Results

| Page | Path | Visuals | Interaction | Quiz Questions | Internal Links OK | Status | Notes |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
${rows}

## Commands

- \`node scripts/rebuild-basic-quantities-pages.js\`
- \`node scripts/validate-basic-quantities-pages.js\`
`;

  writeText(path.join(DIRS.reports, "foundations-basic-quantities-validation.md"), report);
  console.log(JSON.stringify({
    checked_pages: results.length,
    passed: passCount,
    failed: results.length - passCount,
    errors
  }, null, 2));

  if (errors.length) process.exit(1);
}

main();
