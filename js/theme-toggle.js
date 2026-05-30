(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem("lc-theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  function label(button) {
    if (!button) return;
    button.textContent = root.dataset.theme === "light" ? "☀ / ☾" : "☾ / ☀";
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    label(button);
    button.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem("lc-theme", root.dataset.theme);
      document.querySelectorAll("[data-theme-toggle]").forEach(label);
    });
  });
})();
