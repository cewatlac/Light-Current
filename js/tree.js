(() => {
  let treeData = null;

  async function loadTree() {
    if (!treeData) treeData = await fetch("./data/tree.json").then((res) => res.json());
    return treeData;
  }

  function countChildren(node) {
    return 1 + (node.children || []).reduce((sum, child) => sum + countChildren(child), 0);
  }

  function matches(node, filters) {
    const text = `${node.title} ${node.level} ${node.importance_type}`.toLowerCase();
    const queryOk = !filters.query || text.includes(filters.query);
    const levelOk = !filters.level || String(node.level) === filters.level;
    return queryOk && levelOk;
  }

  function renderNode(node, filters, unitTitle) {
    const children = node.children || [];
    const childHtml = children.map((child) => renderNode(child, filters, unitTitle || node.title)).filter(Boolean).join("");
    const unitOk = !filters.unit || unitTitle === filters.unit || node.title === filters.unit;
    const selfOk = unitOk && matches(node, filters);
    if (!selfOk && !childHtml) return "";

    const meta = `Level ${node.level} · ${countChildren(node)} page${countChildren(node) === 1 ? "" : "s"}`;
    if (!children.length) {
      return `<div class="tree-leaf"><a href="${node.url}">${node.title}</a><span class="tree-meta">${meta}</span></div>`;
    }
    return `<details class="tree-node" ${node.level <= 2 ? "open" : ""}>
      <summary><a href="${node.url}">${node.title}</a><span class="tree-meta">${meta}</span></summary>
      <div class="tree-children">${childHtml}</div>
    </details>`;
  }

  async function render(root) {
    const data = await loadTree();
    const query = document.querySelector("[data-tree-search]")?.value.trim().toLowerCase() || "";
    const unit = document.querySelector("[data-tree-unit]")?.value || "";
    const level = document.querySelector("[data-tree-level]")?.value || "";
    const limit = Number(root.dataset.treeLimit || 0);
    const filters = { query, unit, level };
    let html = data.map((node) => renderNode(node, filters, node.title)).filter(Boolean).join("");
    if (limit && html.length > 0) {
      root.classList.add("compact");
    }
    root.innerHTML = html || `<div class="card">No matching topics.</div>`;
    const summary = document.querySelector("[data-tree-summary]");
    if (summary) summary.textContent = `${data.reduce((sum, node) => sum + countChildren(node), 0)} pages`;
  }

  const roots = document.querySelectorAll("[data-tree-root]");
  roots.forEach((root) => render(root));
  document.querySelectorAll("[data-tree-search], [data-tree-unit], [data-tree-level]").forEach((control) => {
    control.addEventListener("input", () => roots.forEach((root) => render(root)));
    control.addEventListener("change", () => roots.forEach((root) => render(root)));
  });
  document.querySelectorAll("[data-expand-all]").forEach((button) => {
    button.addEventListener("click", () => document.querySelectorAll(".tree-node").forEach((node) => (node.open = true)));
  });
  document.querySelectorAll("[data-collapse-all]").forEach((button) => {
    button.addEventListener("click", () => document.querySelectorAll(".tree-node").forEach((node) => (node.open = false)));
  });
})();
