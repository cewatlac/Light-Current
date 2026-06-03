(() => {
  const body = document.body;
  const root = document.documentElement;
  const toast = document.querySelector("[data-toast]");
  const langModes = ["lang-ar", "lang-en", "lang-both"];

  const texts = {
    ar: {
      next: "التالي",
      retry: "إعادة",
      score: "النتيجة",
      answered: "تم اختيار إجابة",
      focusOn: "تم تشغيل Focus Mode",
      focusOff: "تم إيقاف Focus Mode",
      dark: "الوضع الداكن",
      light: "الوضع الفاتح"
    },
    en: {
      next: "Next",
      retry: "Retry",
      score: "Score",
      answered: "Answer selected",
      focusOn: "Focus Mode on",
      focusOff: "Focus Mode off",
      dark: "Dark mode",
      light: "Light mode"
    }
  };

  const currentLang = () => body.classList.contains("lang-en") ? "en" : "ar";
  const say = (key) => texts[currentLang()][key] || key;
  const number = (value, digits = 3) => {
    if (!Number.isFinite(value)) return "0";
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < .001)) return value.toExponential(digits);
    return Number(value.toFixed(digits)).toString();
  };

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1500);
  }

  function setLanguage(mode) {
    body.classList.remove(...langModes);
    body.classList.add(mode);
    localStorage.setItem("eq-language", mode);
    const label = mode === "lang-en" ? "EN" : mode === "lang-both" ? "AR + EN" : "AR";
    document.querySelectorAll("[data-lang-btn]").forEach((button) => {
      button.textContent = label;
      button.setAttribute("aria-pressed", String(mode !== "lang-ar"));
    });
    updateInteractions();
    updateQuizLabels();
  }

  function initLanguage() {
    const stored = localStorage.getItem("eq-language");
    setLanguage(langModes.includes(stored) ? stored : "lang-ar");
    document.querySelectorAll("[data-lang-btn]").forEach((button) => {
      button.addEventListener("click", () => {
        const current = langModes.findIndex((mode) => body.classList.contains(mode));
        setLanguage(langModes[(current + 1) % langModes.length]);
      });
    });
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("eq-theme", theme);
    document.querySelectorAll("[data-theme-btn]").forEach((button) => {
      button.textContent = theme === "dark" ? "☾ / ☀" : "☀ / ☾";
      button.setAttribute("aria-label", theme === "dark" ? say("dark") : say("light"));
    });
  }

  function initTheme() {
    const stored = localStorage.getItem("eq-theme");
    setTheme(stored === "light" ? "light" : "dark");
    document.querySelectorAll("[data-theme-btn]").forEach((button) => {
      button.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    });
  }

  function initUtilities() {
    const progress = document.querySelector("[data-scroll-progress]");
    const updateProgress = () => {
      if (!progress) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : "0";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    document.querySelectorAll("[data-top-btn]").forEach((button) => {
      button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    });

    const focusStored = localStorage.getItem("eq-focus-mode") === "true";
    if (focusStored) body.classList.add("focus-mode");
    document.querySelectorAll("[data-focus-btn]").forEach((button) => {
      button.setAttribute("aria-pressed", String(body.classList.contains("focus-mode")));
      button.addEventListener("click", () => {
        body.classList.toggle("focus-mode");
        const on = body.classList.contains("focus-mode");
        localStorage.setItem("eq-focus-mode", String(on));
        button.setAttribute("aria-pressed", String(on));
        showToast(on ? say("focusOn") : say("focusOff"));
      });
    });

    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    }, { threshold: .08 });
    document.querySelectorAll(".reveal").forEach((item) => reveal.observe(item));
  }

  const quizState = new WeakMap();

  function textOf(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (body.classList.contains("lang-both")) return `${value.ar || ""} / ${value.en || ""}`;
    return value[currentLang()] || value.en || value.ar || "";
  }

  function initQuizzes() {
    document.querySelectorAll("[data-quiz]").forEach((quiz) => {
      const source = quiz.querySelector("[data-quiz-data]");
      if (!source) return;
      const questions = JSON.parse(source.textContent);
      quizState.set(quiz, { questions, index: 0, score: 0, answered: false, seen: new Set() });
      quiz.querySelector("[data-quiz-next]")?.addEventListener("click", () => nextQuestion(quiz));
      quiz.querySelector("[data-quiz-restart]")?.addEventListener("click", () => {
        quizState.set(quiz, { questions, index: 0, score: 0, answered: false, seen: new Set() });
        renderQuiz(quiz);
      });
      renderQuiz(quiz);
    });
  }

  function updateQuizLabels() {
    document.querySelectorAll("[data-quiz]").forEach(renderQuiz);
  }

  function renderQuiz(quiz) {
    const state = quizState.get(quiz);
    if (!state) return;
    const item = state.questions[state.index];
    const question = quiz.querySelector("[data-quiz-question]");
    const choices = quiz.querySelector("[data-quiz-choices]");
    const feedback = quiz.querySelector("[data-quiz-feedback]");
    const count = quiz.querySelector("[data-quiz-count]");
    const score = quiz.querySelector("[data-quiz-score]");
    const progress = quiz.querySelector("[data-quiz-progress]");
    const next = quiz.querySelector("[data-quiz-next]");
    const retry = quiz.querySelector("[data-quiz-restart]");

    if (question) question.textContent = textOf(item.q);
    if (count) count.textContent = `${state.index + 1} / ${state.questions.length}`;
    if (score) score.textContent = `${say("score")}: ${state.score}`;
    if (progress) progress.style.width = `${(state.index / state.questions.length) * 100}%`;
    if (next) next.textContent = say("next");
    if (retry) retry.textContent = say("retry");
    if (feedback) feedback.textContent = "";
    state.answered = false;

    if (!choices) return;
    choices.innerHTML = "";
    item.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "choice";
      button.type = "button";
      button.textContent = textOf(choice);
      button.addEventListener("click", () => answerQuestion(quiz, button, index));
      choices.appendChild(button);
    });
  }

  function answerQuestion(quiz, button, choiceIndex) {
    const state = quizState.get(quiz);
    const item = state.questions[state.index];
    if (state.answered) return;
    state.answered = true;
    const buttons = [...quiz.querySelectorAll(".choice")];
    buttons.forEach((choiceButton, index) => {
      choiceButton.disabled = true;
      if (index === item.answer) choiceButton.classList.add("correct");
    });
    if (choiceIndex !== item.answer) button.classList.add("wrong");
    if (choiceIndex === item.answer) state.score += 1;
    state.seen.add(state.index);
    const feedback = quiz.querySelector("[data-quiz-feedback]");
    if (feedback) feedback.textContent = textOf(item.feedback);
    showToast(say("answered"));
  }

  function nextQuestion(quiz) {
    const state = quizState.get(quiz);
    if (!state) return;
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuiz(quiz);
      return;
    }
    const feedback = quiz.querySelector("[data-quiz-feedback]");
    const progress = quiz.querySelector("[data-quiz-progress]");
    if (progress) progress.style.width = "100%";
    if (feedback) {
      feedback.textContent = currentLang() === "ar"
        ? `انتهى الاختبار. النتيجة ${state.score} من ${state.questions.length}. راجع أي سؤال أخطأت فيه ثم أعد المحاولة.`
        : `Quiz complete. Score ${state.score} of ${state.questions.length}. Review missed questions, then retry.`;
    }
  }

  function value(card, selector, fallback = 0) {
    const input = card.querySelector(selector);
    if (!input) return fallback;
    const parsed = Number(input.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function writeResult(card, ar, en, percent = 50) {
    const output = card.querySelector("[data-result]");
    const meter = card.querySelector("[data-meter]");
    if (output) output.textContent = currentLang() === "ar" ? ar : en;
    if (meter) meter.style.width = `${Math.max(4, Math.min(100, percent))}%`;
  }

  function updateInteractions() {
    document.querySelectorAll("[data-interaction]").forEach(updateInteraction);
  }

  function initInteractions() {
    document.querySelectorAll("[data-interaction]").forEach((card) => {
      card.querySelectorAll("input, select").forEach((input) => {
        input.addEventListener("input", () => updateInteraction(card));
        input.addEventListener("change", () => updateInteraction(card));
      });
      card.querySelectorAll("[data-set-value]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = card.querySelector(button.dataset.target);
          if (target) {
            target.value = button.dataset.setValue;
            target.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      });
      updateInteraction(card);
    });
  }

  function updateInteraction(card) {
    const type = card.dataset.interaction;
    if (type === "charge") {
      const exp = value(card, "[data-exp]", 12);
      const q1 = value(card, "[data-a]", 1) * 1e-6;
      const q2 = value(card, "[data-b]", -1) * 1e-6;
      const r = Math.max(value(card, "[data-c]", 10) / 100, .001);
      const electrons = 10 ** exp;
      const q = electrons * 1.602176634e-19;
      const force = 8.9875517923e9 * Math.abs(q1 * q2) / (r * r);
      card.querySelector("[data-exp-label]")?.replaceChildren(document.createTextNode(String(exp)));
      writeResult(card, `عدد الإلكترونات 10^${exp} يعطي charge = ${number(q, 4)} C. قوة Coulomb بين q1 وq2 ≈ ${number(force)} N عند هذه المسافة.`, `10^${exp} electrons give charge = ${number(q, 4)} C. Coulomb force between q1 and q2 is about ${number(force)} N.`, Math.log10(force + 1) * 20);
    } else if (type === "current") {
      const charge = value(card, "[data-a]", 2);
      const time = Math.max(value(card, "[data-b]", 4), .001);
      const current = charge / time;
      writeResult(card, `I = Q/t = ${charge} C / ${time} s = ${number(current)} A. التيار يزيد عندما تزيد الشحنة أو يقل الزمن.`, `I = Q/t = ${charge} C / ${time} s = ${number(current)} A. Current rises when more charge passes in less time.`, current * 30);
    } else if (type === "voltage") {
      const energy = value(card, "[data-a]", 24);
      const charge = Math.max(value(card, "[data-b]", 2), .001);
      const voltage = energy / charge;
      writeResult(card, `V = W/Q = ${energy} J / ${charge} C = ${number(voltage)} V. الجهد دائما بين نقطتين وليس عند نقطة منفردة.`, `V = W/Q = ${energy} J / ${charge} C = ${number(voltage)} V. Voltage is always between two points.`, voltage * 5);
    } else if (type === "resistance") {
      const volts = value(card, "[data-a]", 12);
      const amps = Math.max(value(card, "[data-b]", .5), .001);
      const length = value(card, "[data-c]", 40);
      const resistance = volts / amps;
      const cableDrop = amps * length * .085;
      writeResult(card, `R = V/I = ${number(resistance)} Ω. هبوط كابل تقريبي عند ${length} m و ${amps} A ≈ ${number(cableDrop)} V.`, `R = V/I = ${number(resistance)} Ω. Estimated cable drop at ${length} m and ${amps} A is ${number(cableDrop)} V.`, resistance * 4);
    } else if (type === "conductance") {
      const resistance = Math.max(value(card, "[data-a]", 20), .001);
      const conductance = 1 / resistance;
      writeResult(card, `G = 1/R = ${number(conductance)} S. كلما زادت G أصبح المسار أسهل لمرور current.`, `G = 1/R = ${number(conductance)} S. Higher G means an easier path for current.`, conductance * 300);
    } else if (type === "power") {
      const volts = value(card, "[data-a]", 48);
      const amps = value(card, "[data-b]", .25);
      const devices = value(card, "[data-c]", 8);
      const power = volts * amps;
      const total = power * devices;
      writeResult(card, `P = V × I = ${number(power)} W لكل جهاز. ${devices} أجهزة تحتاج تقريبا ${number(total)} W قبل هامش الأمان.`, `P = V × I = ${number(power)} W per device. ${devices} devices need about ${number(total)} W before margin.`, total);
    } else if (type === "energy") {
      const power = value(card, "[data-a]", 60);
      const hours = value(card, "[data-b]", 4);
      const battery = value(card, "[data-c]", 480);
      const energy = power * hours;
      const runtime = battery / Math.max(power, .001);
      writeResult(card, `E = P × t = ${number(energy)} Wh. بطارية ${battery} Wh تعطي runtime تقريبي ${number(runtime)} h لهذا الحمل.`, `E = P × t = ${number(energy)} Wh. A ${battery} Wh battery gives about ${number(runtime)} h runtime for this load.`, energy / 10);
    } else if (type === "frequency") {
      const periodMs = Math.max(value(card, "[data-a]", 20), .001);
      const frequency = 1000 / periodMs;
      writeResult(card, `f = 1/T. عند T = ${periodMs} ms تكون f = ${number(frequency)} Hz.`, `f = 1/T. With T = ${periodMs} ms, f = ${number(frequency)} Hz.`, frequency);
    } else if (type === "period") {
      const frequency = Math.max(value(card, "[data-a]", 50), .001);
      const period = 1 / frequency;
      writeResult(card, `T = 1/f = ${number(period, 5)} s = ${number(period * 1000)} ms لكل دورة.`, `T = 1/f = ${number(period, 5)} s = ${number(period * 1000)} ms per cycle.`, period * 1000);
    } else if (type === "phase") {
      const degrees = value(card, "[data-a]", 90);
      const frequency = value(card, "[data-b]", 50);
      const shiftMs = (degrees / 360) * (1000 / Math.max(frequency, .001));
      writeResult(card, `phase shift = ${degrees}°. عند ${frequency} Hz يساوي فرق زمن تقريبي ${number(shiftMs)} ms.`, `Phase shift = ${degrees}°. At ${frequency} Hz this is about ${number(shiftMs)} ms time shift.`, Math.abs(degrees) / 3.6);
    } else if (type === "rms") {
      const peak = value(card, "[data-a]", 325);
      const rms = peak / Math.sqrt(2);
      writeResult(card, `لموجة sine: RMS = peak / √2 = ${number(rms)} V. هذه هي القيمة المكافئة حراريا لـ DC.`, `For a sine wave: RMS = peak / √2 = ${number(rms)} V. This is the heating-equivalent DC value.`, rms / 3);
    } else if (type === "peak") {
      const rms = value(card, "[data-a]", 230);
      const peak = rms * Math.sqrt(2);
      const p2p = 2 * peak;
      writeResult(card, `peak = RMS × √2 = ${number(peak)} V, و peak-to-peak ≈ ${number(p2p)} V.`, `peak = RMS × √2 = ${number(peak)} V, and peak-to-peak is about ${number(p2p)} V.`, peak / 4);
    } else if (type === "average") {
      const amplitude = value(card, "[data-a]", 10);
      const mode = card.querySelector("[data-mode]")?.value || "rectified";
      const avg = mode === "sine" ? 0 : (2 * amplitude) / Math.PI;
      writeResult(card, mode === "sine" ? `متوسط sine كاملة = 0 لأن النصف الموجب يساوي النصف السالب.` : `متوسط الموجة rectified ≈ 2A/π = ${number(avg)} V.`, mode === "sine" ? "A full sine average is 0 because positive and negative halves cancel." : `Rectified sine average ≈ 2A/π = ${number(avg)} V.`, Math.abs(avg) * 8);
    } else if (type === "instantaneous") {
      const amplitude = value(card, "[data-a]", 10);
      const frequency = value(card, "[data-b]", 50);
      const timeMs = value(card, "[data-c]", 5);
      const valueNow = amplitude * Math.sin(2 * Math.PI * frequency * timeMs / 1000);
      writeResult(card, `v(t) = Vpeak sin(2πft). عند t = ${timeMs} ms تكون القيمة اللحظية ${number(valueNow)} V.`, `v(t) = Vpeak sin(2πft). At t = ${timeMs} ms, instantaneous value is ${number(valueNow)} V.`, Math.abs(valueNow) * 8);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initLanguage();
    initUtilities();
    initQuizzes();
    initInteractions();
  });
})();
