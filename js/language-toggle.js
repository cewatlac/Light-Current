(() => {
  const modes = ["lang-both", "lang-ar", "lang-en"];
  const labels = {
    "lang-both": "AR + EN",
    "lang-ar": "AR",
    "lang-en": "EN"
  };
  const saved = localStorage.getItem("lc-lang") || "lang-both";

  function setMode(mode) {
    const next = modes.includes(mode) ? mode : "lang-both";
    document.body.classList.remove(...modes);
    document.body.classList.add(next);
    localStorage.setItem("lc-lang", next);
    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      button.textContent = labels[next];
    });
  }

  if (document.body) setMode(saved);
  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = modes.find((mode) => document.body.classList.contains(mode)) || "lang-both";
      setMode(modes[(modes.indexOf(current) + 1) % modes.length]);
    });
  });
})();
