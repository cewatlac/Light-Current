(() => {
  const modes = ["lang-ar", "lang-en", "lang-both"];
  const labels = {
    "lang-both": "AR + EN",
    "lang-ar": "AR",
    "lang-en": "EN"
  };
  const savedMode = localStorage.getItem("lc-lang");
  const saved = savedMode === "lang-en" ? "lang-en" : "lang-ar";

  function setMode(mode) {
    const next = modes.includes(mode) ? mode : "lang-ar";
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
      const current = modes.find((mode) => document.body.classList.contains(mode)) || "lang-ar";
      setMode(modes[(modes.indexOf(current) + 1) % modes.length]);
    });
  });
})();
