import fs from "node:fs";
import { byId, loadTopics, pageFilePath, cleanGeneratedPagesDir } from "./lib.js";
import { topicPageHtml } from "./page-template.js";
import { loadVisualPlan } from "./visual-system.js";

const topics = loadTopics();
cleanGeneratedPagesDir();
const context = {
  lookup: byId(topics),
  pathLookup: new Map(topics.map((topic) => [topic.full_path.join(" > "), topic])),
  visualPlan: loadVisualPlan()
};

let generated = 0;
for (const topic of topics) {
  fs.writeFileSync(pageFilePath(topic), topicPageHtml(topic, topics, context), "utf8");
  generated += 1;
}

console.log(JSON.stringify({ generated_topic_pages: generated }, null, 2));
