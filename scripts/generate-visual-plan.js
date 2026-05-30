import fs from "node:fs";
import { FILES, writeJson } from "./config.js";
import { loadTopics } from "./lib.js";
import { makeVisualPlanEntry } from "./visual-system.js";

const topics = loadTopics();
let auditById = new Map();

if (fs.existsSync(FILES.visualAuditStats)) {
  const audit = JSON.parse(fs.readFileSync(FILES.visualAuditStats, "utf8"));
  auditById = new Map((audit.pages || audit.sample_issues || []).map((entry) => [entry.id, entry]));
}

const pages = topics.map((topic) => makeVisualPlanEntry(topic, auditById.get(topic.id) || {}));
const totals = pages.reduce(
  (acc, page) => {
    acc.required_visuals += page.required_visual_count;
    acc.planned_visuals += page.visuals.length;
    acc[page.importance_type] = (acc[page.importance_type] ?? 0) + 1;
    return acc;
  },
  { required_visuals: 0, planned_visuals: 0, major: 0, medium: 0, small: 0 }
);

writeJson(FILES.visualPlan, {
  generated_at: new Date().toISOString(),
  topic_count: topics.length,
  totals,
  pages
});

console.log(JSON.stringify({ topic_count: topics.length, ...totals }, null, 2));
