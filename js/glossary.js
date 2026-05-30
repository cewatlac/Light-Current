(() => {
  let glossary = null;

  async function loadGlossary() {
    if (!glossary) glossary = await fetch("./data/glossary.json").then((res) => res.json());
    return glossary;
  }

  function renderEntry(entry) {
    return `<article class="glossary-card">
      <h3><a href="${entry.url}">${entry.term}</a></h3>
      <p>${entry.definition}</p>
      <span class="tree-meta">${entry.group} · ${entry.unit}</span>
    </article>`;
  }

  async function render() {
    const data = await loadGlossary();
    const query = document.querySelector("[data-glossary-search]")?.value.trim().toLowerCase() || "";
    const unit = document.querySelector("[data-glossary-unit]")?.value || "";
    const filtered = data.filter((entry) => {
      const text = `${entry.term} ${entry.acronym} ${entry.definition} ${entry.unit} ${entry.category}`.toLowerCase();
      return (!query || text.includes(query)) && (!unit || entry.unit === unit);
    });
    document.querySelector("[data-glossary-list]").innerHTML = filtered.slice(0, 600).map(renderEntry).join("");
    document.querySelector("[data-glossary-summary]").textContent = `${filtered.length} term${filtered.length === 1 ? "" : "s"}`;
  }

  document.querySelectorAll("[data-glossary-search], [data-glossary-unit]").forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });
  if (document.querySelector("[data-glossary-list]")) render();
})();
