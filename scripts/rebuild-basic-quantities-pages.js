import fs from "node:fs";
import path from "node:path";
import { DIRS, ROOT_DIR, writeText } from "./config.js";
import { escapeAttr, loadTopics, pageFilePath, stripLeadingCode, visibleText } from "./lib.js";

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

function topicKey(parts) {
  return parts.join(" > ");
}

function selectedTopics() {
  const topics = loadTopics();
  const byPath = new Map(topics.map((topic) => [topicKey(topic.full_path), topic]));
  return targetPaths.map((parts) => {
    const topic = byPath.get(topicKey(parts));
    if (!topic) throw new Error(`Missing topic record for ${topicKey(parts)}`);
    return topic;
  });
}

function patchFigureMetadata(html, topic) {
  let index = 0;
  return html.replace(/<figure\b([^>]*data-educational-visual="true"[^>]*)>/g, (match, attrs) => {
    index += 1;
    const kind = attrs.match(/data-visual-kind="([^"]+)"/)?.[1] ?? `visual-${index}`;
    let patched = attrs;
    if (!/\bdata-visual-id=/.test(patched)) {
      patched += ` data-visual-id="${escapeAttr(`${topic.id}-${kind}-${index}`)}"`;
    }
    if (!/\bdata-visual-purpose=/.test(patched)) {
      const purpose = `${stripLeadingCode(topic.title)} ${kind} concept path and Field Use visual for the Electrical Basics lesson.`;
      patched += ` data-visual-purpose="${escapeAttr(purpose)}"`;
    }
    return `<figure${patched}>`;
  });
}

function patchPage(html, topic) {
  let next = html;
  next = next.replace(/<body class="(?![^"]*\blang-ar\b)([^"]*)"/, '<body class="lang-ar $1"');
  next = next.replace(/<body class="[^"]*lang-en[^"]*"/, (match) => match.replace("lang-en", "lang-ar"));
  next = next.replace(/<body class="[^"]*lang-both[^"]*"/, (match) => match.replace("lang-both", "lang-ar"));
  next = next.replaceAll("02 / Real Work", "02 / Field Use");
  next = next.replaceAll(">Ashraf<", ">Eng Ashraf<");
  next = next.replaceAll("Â© Anzma Tech Academy. All rights reserved.", "© Anzma Tech Academy. All rights reserved.");
  next = patchFigureMetadata(next, topic);
  return next;
}

function readVisualKinds(html) {
  return [...html.matchAll(/data-visual-kind="([^"]+)"/g)].map((match) => match[1]);
}

function readQuizCount(html) {
  const match = html.match(/<script type="application\/json" data-quiz-data>([\s\S]*?)<\/script>/);
  if (!match) return 0;
  return JSON.parse(match[1]).length;
}

function main() {
  const summary = [];
  const snapshotDir = path.join(DIRS.contentManual, "foundations-basic-quantities-pages");

  for (const topic of selectedTopics()) {
    const file = pageFilePath(topic);
    const snapshot = path.join(snapshotDir, path.basename(file));
    if (!fs.existsSync(file) && !fs.existsSync(snapshot)) throw new Error(`Missing generated page: ${file}`);

    const before = fs.existsSync(snapshot) ? fs.readFileSync(snapshot, "utf8") : fs.readFileSync(file, "utf8");
    const after = patchPage(before, topic);
    fs.writeFileSync(file, after, "utf8");

    const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
    const visualKinds = readVisualKinds(after);
    summary.push({
      id: topic.id,
      title: stripLeadingCode(topic.title),
      path: rel,
      visuals: (after.match(/data-educational-visual="true"/g) || []).length,
      visualKinds,
      interaction: after.match(/data-interaction="([^"]+)"/)?.[1] ?? "none",
      quiz: readQuizCount(after),
      visibleCharacters: visibleText(after).length
    });
  }

  const reviewRows = summary.map((item) => {
    return `| ${item.id} | ${item.title} | \`${item.path}\` | ${item.visuals} | ${item.interaction} | ${item.quiz} | ${item.visibleCharacters} |`;
  }).join("\n");

  writeText(path.join(DIRS.reports, "foundations-basic-quantities-review.md"), `# Foundations Basic Quantities Review

Scope: targeted rebuild/upgrade of the first 17 Foundations/Electrical Basics rows only.

| ID | Page | Path | Visuals | Interaction | Quiz Questions | Visible Characters |
| --- | --- | --- | ---: | --- | ---: | ---: |
${reviewRows}
`);

  writeText(path.join(DIRS.reports, "foundations-basic-quantities-visuals.md"), `# Foundations Basic Quantities Visuals

${summary.map((item) => `- ${item.title}: ${item.visuals} local SVG educational visuals; visual kinds: ${item.visualKinds.join(", ")}.`).join("\n")}
`);

  console.log(JSON.stringify({ rebuilt_pages: summary.length, pages: summary }, null, 2));
}

main();
