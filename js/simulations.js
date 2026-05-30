(() => {
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  document.querySelectorAll("[data-scenario]").forEach((card) => {
    const output = card.querySelector("[data-scenario-output]");
    const customCopy = card.querySelector("[data-scenario-copy]");
    const copy = customCopy ? JSON.parse(customCopy.textContent || "{}") : {
      design: ["Design focus", "Confirm scope, parent system, interfaces, symbols, units, and coordination notes before issuing drawings."],
      site: ["Site focus", "Check installation location, cable route, panel or device label, mounting requirements, and coordination with other systems."],
      test: ["Testing focus", "Define the expected result, record evidence, verify alarms or values, and keep the handover document traceable."]
    };
    card.querySelectorAll("[data-scenario-btn]").forEach((button) => {
      button.addEventListener("click", () => {
        card.querySelectorAll("[data-scenario-btn]").forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        const [title, text] = copy[button.dataset.scenarioBtn] || copy.design;
        output.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
      });
    });
  });

  const electronInput = document.querySelector("[data-electron-count]");
  const electronOutput = document.querySelector("[data-electron-output]");
  const electronButton = document.querySelector("[data-electron-calc]");
  const calc = () => {
    if (!electronInput || !electronOutput) return;
    const n = Math.max(0, Number(electronInput.value || 0));
    const q = -(n * 1.602e-19);
    electronOutput.value = `Q = ${q.toExponential(3)} C`;
    electronOutput.textContent = `Q = ${q.toExponential(3)} C`;
  };
  electronButton?.addEventListener("click", calc);
  electronInput?.addEventListener("input", calc);
  calc();
})();
