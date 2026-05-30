(() => {
  const currentLang = () => {
    if (document.body.classList.contains("lang-en")) return "en";
    return "ar";
  };

  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const raw = quiz.querySelector("[data-quiz-data]")?.textContent || "[]";
    let questions = [];
    try {
      questions = JSON.parse(raw);
    } catch {
      questions = [];
    }
    if (!questions.length) return;

    let index = 0;
    let score = 0;
    let answered = false;
    const count = quiz.querySelector("[data-quiz-count]");
    const progress = quiz.querySelector("[data-quiz-progress]");
    const scoreEl = quiz.querySelector("[data-quiz-score]");
    const questionEl = quiz.querySelector("[data-quiz-question]");
    const choicesEl = quiz.querySelector("[data-quiz-choices]");
    const feedbackEl = quiz.querySelector("[data-quiz-feedback]");
    const nextBtn = quiz.querySelector("[data-quiz-next]");
    const restartBtn = quiz.querySelector("[data-quiz-restart]");

    function render() {
      const q = questions[index];
      const lang = currentLang();
      answered = false;
      count.textContent = `${index + 1} / ${questions.length}`;
      progress.style.width = `${(index / questions.length) * 100}%`;
      scoreEl.textContent = `${score}`;
      questionEl.textContent = q[`q_${lang}`] || q.q_en || q.q_ar;
      feedbackEl.textContent = "";
      choicesEl.innerHTML = "";
      const choices = q[`choices_${lang}`] || q.choices_en || q.choices_ar || [];
      choices.forEach((choice, choiceIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.textContent = choice;
        button.addEventListener("click", () => choose(choiceIndex));
        choicesEl.appendChild(button);
      });
    }

    function choose(choiceIndex) {
      if (answered) return;
      answered = true;
      const q = questions[index];
      const lang = currentLang();
      const buttons = [...choicesEl.querySelectorAll("button")];
      const correct = choiceIndex === q.answer;
      if (correct) score += 1;
      buttons.forEach((button, i) => {
        button.disabled = true;
        if (i === q.answer) button.classList.add("correct");
        if (i === choiceIndex && !correct) button.classList.add("wrong");
      });
      feedbackEl.textContent = q[`feedback_${lang}`] || q.feedback_en || q.feedback_ar || "";
      progress.style.width = `${((index + 1) / questions.length) * 100}%`;
      scoreEl.textContent = `${score}`;
    }

    nextBtn?.addEventListener("click", () => {
      if (index < questions.length - 1) {
        index += 1;
        render();
      } else {
        feedbackEl.textContent = `Score: ${score} / ${questions.length}`;
      }
    });

    restartBtn?.addEventListener("click", () => {
      index = 0;
      score = 0;
      render();
    });

    render();
  });
})();
