import { FILES, writeJson } from "./config.js";
import { loadTopics } from "./lib.js";

const topics = loadTopics();
const aliasMap = new Map();

for (const topic of topics) {
  const aliases = new Set([topic.title, ...topic.aliases, ...topic.acronyms]);
  for (const alias of aliases) {
    const key = alias.trim().toLowerCase();
    if (!key || key.length < 3) continue;
    if (!aliasMap.has(key)) aliasMap.set(key, { alias: alias.trim(), topic_ids: [] });
    aliasMap.get(key).topic_ids.push(topic.id);
  }
}

const entries = [...aliasMap.values()]
  .map((entry) => ({
    alias: entry.alias,
    normalized: entry.alias.toLowerCase(),
    topic_ids: [...new Set(entry.topic_ids)],
    ambiguous: new Set(entry.topic_ids).size > 1
  }))
  .sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));

const dictionary = {
  generated_at: new Date().toISOString(),
  topic_count: topics.length,
  alias_count: entries.length,
  ambiguous_alias_count: entries.filter((entry) => entry.ambiguous).length,
  entries
};

writeJson(FILES.internalLinkDictionary, dictionary);

console.log(
  JSON.stringify(
    {
      topics: dictionary.topic_count,
      aliases: dictionary.alias_count,
      ambiguous_aliases: dictionary.ambiguous_alias_count
    },
    null,
    2
  )
);
