(() => {
  let searchIndex = null;

  async function load() {
    if (!searchIndex) searchIndex = await fetch("./data/search-index.json").then((res) => res.json());
    return searchIndex;
  }

  function score(item, query) {
    const haystack = [
      item.title,
      item.title_ar,
      item.title_en,
      item.unit,
      item.category,
      item.full_path?.join(" "),
      ...(item.aliases || []),
      ...(item.acronyms || []),
      ...(item.keywords || [])
    ]
      .join(" ")
      .toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return 0;
    let value = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) return 0;
      value += item.title.toLowerCase().includes(term) ? 5 : 1;
    }
    if (item.importance_type === "major") value += 2;
    if (item.importance_type === "medium") value += 1;
    return value;
  }

  function card(item) {
    return `<article class="result-card">
      <h3><a href="${item.url}">${item.title}</a></h3>
      <p>${item.full_path.join(" / ")}</p>
      <span class="tree-meta">Level ${item.level} · ${item.importance_type}</span>
    </article>`;
  }

  async function run(input, results, meta, limit = 80) {
    const query = input.value.trim();
    const data = await load();
    const ranked = query
      ? data.map((item) => ({ item, score: score(item, query) })).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).map((row) => row.item)
      : data.slice(0, 24);
    results.innerHTML = ranked.slice(0, limit).map(card).join("");
    if (meta) meta.textContent = `${ranked.length} result${ranked.length === 1 ? "" : "s"}`;
  }

  document.querySelectorAll("[data-search-input]").forEach((input) => {
    const results = document.querySelector("[data-search-results]");
    const meta = document.querySelector("[data-search-meta]");
    const trigger = () => run(input, results, meta);
    input.addEventListener("input", trigger);
    trigger();
  });

  document.querySelectorAll("[data-home-search]").forEach((input) => {
    const results = document.querySelector("[data-home-results]");
    const trigger = () => run(input, results, null, 8);
    input.addEventListener("input", trigger);
  });
})();
