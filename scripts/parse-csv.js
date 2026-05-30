import fs from "node:fs";
import { DEFAULT_SOURCE_CSV, DEFAULT_TEMPLATE_HTML, FILES, copyIfPresent, ensureProjectDirs, sourceCsvPath, templateHtmlPath } from "./config.js";
import { makeTopicsFromCsv, writeDerivedData } from "./lib.js";

ensureProjectDirs();

const csvPath = sourceCsvPath();
if (!fs.existsSync(csvPath)) {
  throw new Error(`Source CSV not found. Expected ${csvPath}`);
}

copyIfPresent(csvPath, FILES.sourceCsvCopy);
copyIfPresent(templateHtmlPath(), FILES.templateCopy);

const csvText = fs.readFileSync(csvPath, "utf8");
const topics = makeTopicsFromCsv(csvText);
writeDerivedData(topics);

const maxLevel = Math.max(...topics.map((topic) => topic.level));
const levelCounts = topics.reduce((counts, topic) => {
  counts[topic.level] = (counts[topic.level] ?? 0) + 1;
  return counts;
}, {});

console.log(
  JSON.stringify(
    {
      source_csv: csvPath,
      fallback_csv: DEFAULT_SOURCE_CSV,
      template_html: templateHtmlPath(),
      fallback_template: DEFAULT_TEMPLATE_HTML,
      topics: topics.length,
      max_level: maxLevel,
      level_counts: levelCounts,
      copied_csv: FILES.sourceCsvCopy,
      copied_template: FILES.templateCopy
    },
    null,
    2
  )
);
