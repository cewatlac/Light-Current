import { classifyImportance, deriveRelationships, loadTopics, saveTopics } from "./lib.js";

const topics = loadTopics();

const counts = { major: 0, medium: 0, small: 0 };
for (const topic of topics) {
  topic.importance_type = classifyImportance(topic);
  counts[topic.importance_type] += 1;
}

deriveRelationships(topics);
saveTopics(topics);

console.log(JSON.stringify({ classified_topics: topics.length, counts }, null, 2));
