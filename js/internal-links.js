(() => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a.auto-link");
    if (!link) return;
    link.dataset.visitedInternal = "true";
  });
})();
