import { escapeAttr, escapeHtml, FOOTER_COPYRIGHT, rootRelativeUrl, stripLeadingCode } from "./lib.js";
import { educationalFigure, makeVisualPlanEntry, strategyForTopic } from "./visual-system.js";
import { lessonForTopic, quizForTopic, referencesForTopic, scenarioForTopic } from "./content-system.js";

const LOGO_URL = "https://dev.anzmatech.com/wp-content/uploads/2024/12/Layer_1.png";
const ANZMA_URL = "https://anzmatech.com/";

function pageAssets(prefix) {
  return {
    css: [
      `${prefix}styles/theme.css`,
      `${prefix}styles/components.css`,
      `${prefix}styles/pages.css`,
      `${prefix}styles/quiz.css`,
      `${prefix}styles/tree.css`,
      `${prefix}styles/print.css`
    ],
    js: [
      `${prefix}js/theme-toggle.js`,
      `${prefix}js/language-toggle.js`,
      `${prefix}js/main.js`,
      `${prefix}js/quiz.js`,
      `${prefix}js/simulations.js`,
      `${prefix}js/internal-links.js`
    ]
  };
}

export function htmlShell({ title, description, body, prefix = "./", lang = "ar", dir = "rtl", extraScripts = [] }) {
  const assets = pageAssets(prefix);
  const css = assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
  const js = [...assets.js, ...extraScripts].map((src) => `<script src="${src}" defer></script>`).join("\n");
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;600;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
${css}
</head>
${body}
${js}
</html>
`;
}

export function siteHeader({ prefix = "./", breadcrumbHtml = "", sectionLabel = "Course" }) {
  return `<header class="topbar">
  <div class="wrap nav">
    <a class="brand" href="${ANZMA_URL}" target="_blank" rel="noopener" aria-label="Open Anzma Tech website">
      <img src="${LOGO_URL}" alt="Anzma Tech logo">
      <span class="brand-fallback">ANZMA TECH</span>
    </a>
    <nav class="navlinks" aria-label="Main navigation">
      <a href="${prefix}index.html">Home</a>
      <a href="${prefix}tree.html">Tree</a>
      <a href="${prefix}search.html">Search</a>
      <a href="${prefix}glossary.html">Glossary</a>
    </nav>
    <div class="actions">
      <button class="btn ghost" type="button" data-lang-toggle aria-label="Change language mode">AR + EN</button>
      <button class="btn ghost" type="button" data-theme-toggle aria-label="Toggle dark and light mode">☾ / ☀</button>
    </div>
  </div>
  <div class="wrap breadcrumb-row">
    <span class="section-label">${escapeHtml(sectionLabel)}</span>
    <nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumbHtml}</nav>
  </div>
  <div class="progress" data-scroll-progress></div>
</header>`;
}

export function siteFooter(prefix = "./") {
  return `<footer class="footer">
  <div class="wrap footer-grid">
    <div>
      <strong>Eng Mohamed El-Sisi</strong><br>
      <strong>Ashraf</strong><br>
      <span>${FOOTER_COPYRIGHT}</span>
    </div>
    <nav aria-label="Footer navigation">
      <a href="${prefix}index.html">Home</a>
      <a href="${prefix}tree.html">Tree</a>
      <a href="${prefix}search.html">Search</a>
      <a href="${prefix}glossary.html">Glossary</a>
    </nav>
  </div>
</footer>`;
}

function findTopicByPath(topics, fullPath, context = {}) {
  const key = fullPath.join(" > ");
  if (context.pathLookup) return context.pathLookup.get(key);
  return topics.find((topic) => topic.full_path.join(" > ") === key);
}

export function breadcrumbForTopic(topic, topics, context = {}) {
  const pieces = [`<a href="../../index.html">Course</a>`];
  for (let i = 1; i <= topic.full_path.length; i += 1) {
    const pathPart = topic.full_path.slice(0, i);
    const found = findTopicByPath(topics, pathPart, context);
    const label = escapeHtml(pathPart[pathPart.length - 1]);
    if (found && found.id !== topic.id) {
      pieces.push(`<a href="${rootRelativeUrl(topic.url, found.url)}">${label}</a>`);
    } else {
      pieces.push(`<span>${label}</span>`);
    }
  }
  return pieces.join("<span aria-hidden=\"true\">/</span>");
}

function navLink(topic, target, label) {
  if (!target) return `<span class="muted">${escapeHtml(label)}: none</span>`;
  return `<a href="${rootRelativeUrl(topic.url, target.url)}">${escapeHtml(label)}: ${escapeHtml(target.title)}</a>`;
}

function topicList(topic, topics, ids, emptyText, max = 18, context = {}) {
  const lookup = context.lookup;
  const items = ids
    .slice(0, max)
    .map((id) => lookup.get(id))
    .filter(Boolean)
    .map((item) => `<li><a href="${rootRelativeUrl(topic.url, item.url)}">${escapeHtml(item.title)}</a></li>`)
    .join("");
  return items || `<li>${escapeHtml(emptyText)}</li>`;
}

function plannedVisuals(topic, context = {}) {
  const plan = context.visualPlan?.get(topic.id) ?? makeVisualPlanEntry(topic);
  const strategy = strategyForTopic(topic);
  return {
    plan,
    strategy,
    visuals: plan.visuals?.length ? plan.visuals : makeVisualPlanEntry(topic).visuals
  };
}

function quizQuestions(topic, count) {
  return quizForTopic(topic, count);
}

function quizBlock(topic, count) {
  const questions = quizQuestions(topic, count);
  return `<section class="section" id="quiz">
  <div class="wrap">
    <div class="chapter-head">
      <div>
        <span class="chapter-num">CHECK</span>
        <h2>Check Your Understanding</h2>
      </div>
    </div>
    <div class="quiz-shell" data-quiz>
      <script type="application/json" data-quiz-data>${JSON.stringify(questions).replaceAll("</", "<\\/")}</script>
      <div class="quiz-top">
        <span data-quiz-count>1 / ${questions.length}</span>
        <div class="quiz-progress" aria-hidden="true"><span data-quiz-progress></span></div>
        <span data-quiz-score>0</span>
      </div>
      <div class="question" data-quiz-question></div>
      <div class="choices" data-quiz-choices></div>
      <div class="feedback" data-quiz-feedback></div>
      <div class="quiz-actions">
        <button class="btn ghost" type="button" data-quiz-next>Next</button>
        <button class="btn ghost" type="button" data-quiz-restart>Retry</button>
      </div>
    </div>
  </div>
</section>`;
}

function diagramBlock(topic, topics, context = {}) {
  const { visuals, strategy } = plannedVisuals(topic, context);
  return educationalFigure(topic, visuals[0], { labels: strategy.labels });
}

function visualGallery(topic, context = {}) {
  const { visuals, strategy } = plannedVisuals(topic, context);
  const rest = visuals.slice(1);
  if (!rest.length) return "";
  return `<section class="section" id="visuals">
  <div class="wrap">
    <div class="chapter-head">
      <div>
        <span class="chapter-num">VISUALS</span>
        <h2>Technical Visuals</h2>
      </div>
    </div>
    <div class="grid-2 visual-grid">
      ${rest.map((visual) => educationalFigure(topic, visual, { labels: strategy.labels })).join("")}
    </div>
  </div>
</section>`;
}

function depthUpgradeSections(topic) {
  const lesson = lessonForTopic(topic);
  const title = escapeHtml(stripLeadingCode(topic.title));
  const mistakes = lesson.mistakes.map((item) => `<li data-linkable>${escapeHtml(item)}</li>`).join("");
  const majorExtra = topic.importance_type === "major"
    ? `<section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">SYSTEM</span>
        <h2>System Architecture</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.architecture_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.architecture_en)}</p>
      </article>
      <article class="card">
        <span class="chapter-num">FLOW</span>
        <h2>Signal, Data, Or Power Flow</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.flow_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.flow_en)}</p>
      </article>
    </div>
  </section>`
    : "";

  return `${majorExtra}
  <section class="section">
    <div class="wrap grid-3">
      <article class="card">
        <span class="chapter-num">DESIGN</span>
        <h2>Design Considerations</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.design_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.design_en)}</p>
      </article>
      <article class="card">
        <span class="chapter-num">SITE</span>
        <h2>Installation Considerations</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.site_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.site_en)}</p>
      </article>
      <article class="card">
        <span class="chapter-num">TEST</span>
        <h2>Testing And Commissioning</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.test_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.test_en)}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">MISTAKES</span>
        <h2>Common Mistakes</h2>
        <ul>${mistakes}</ul>
      </article>
      <article class="card">
        <span class="chapter-num">TROUBLESHOOT</span>
        <h2>Troubleshooting Scenario</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.troubleshoot_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.troubleshoot_en)}</p>
      </article>
    </div>
  </section>`;
}

function interactiveBlock(topic) {
  const lesson = lessonForTopic(topic);
  const scenario = scenarioForTopic(topic);
  const scenarioJson = JSON.stringify(scenario).replaceAll("</", "<\\/");
  const initial = scenario.design;
  return `<section class="section" id="interactive">
  <div class="wrap grid-2">
    <div>
      <span class="chapter-num">INTERACTIVE</span>
      <h2>Interactive Simulation</h2>
      <p class="ar-block" data-linkable>${escapeHtml(lesson.architecture_ar)}</p>
      <p class="en-block en" data-linkable>Use this scenario explorer for ${escapeHtml(stripLeadingCode(topic.title))}. It changes the checklist from design to site work to commissioning using the same topic-specific logic.</p>
    </div>
    <div class="sim-card" data-scenario>
      <script type="application/json" data-scenario-copy>${scenarioJson}</script>
      <div class="segmented" role="tablist" aria-label="Scenario stage">
        <button type="button" class="active" data-scenario-btn="design">Design</button>
        <button type="button" data-scenario-btn="site">Site</button>
        <button type="button" data-scenario-btn="test">Testing</button>
      </div>
      <div class="scenario-output" data-scenario-output>
        <strong>${escapeHtml(initial[0])}</strong>
        <p>${escapeHtml(initial[1])}</p>
      </div>
    </div>
  </div>
</section>`;
}

function referencesBlock(topic) {
  const refs = referencesForTopic(topic);
  const items = refs.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<section class="section" id="refs">
  <div class="wrap">
    <div class="card">
      <span class="chapter-num">REFERENCES</span>
      <h2>Learning References</h2>
      <p class="ar-block">${escapeHtml(refs.intro_ar)}</p>
      <p class="en-block en">${escapeHtml(refs.intro_en)}</p>
      <ul>${items}</ul>
    </div>
  </div>
</section>`;
}

function pageNavigation(topic, topics, context = {}) {
  const lookup = context.lookup;
  return `<section class="section">
  <div class="wrap grid-3 nav-cards">
    <div class="card"><h3>Parent</h3><p>${topic.parent_id ? `<a href="${rootRelativeUrl(topic.url, lookup.get(topic.parent_id).url)}">${escapeHtml(lookup.get(topic.parent_id).title)}</a>` : "Course root"}</p></div>
    <div class="card"><h3>Previous / Next</h3><p>${navLink(topic, lookup.get(topic.previous_id), "Previous")}<br>${navLink(topic, lookup.get(topic.next_id), "Next")}</p></div>
    <div class="card"><h3>Related Topics</h3><ul>${topicList(topic, topics, topic.related_topic_ids, "No related topics found yet.", 6, context)}</ul></div>
  </div>
</section>`;
}

function standardTopicPage(topic, topics, context = {}) {
  const cleanTitle = stripLeadingCode(topic.title);
  const lesson = lessonForTopic(topic);
  const childList = topicList(topic, topics, topic.children_ids, "No child topics are listed below this row.", 20, context);
  const relatedList = topicList(topic, topics, topic.related_topic_ids, "No related topics are listed for this row.", 10, context);
  const quizCount = topic.importance_type === "major" ? 8 : topic.importance_type === "medium" ? 5 : 3;
  const includeInteractive = topic.importance_type !== "small";
  const examples = lesson.examples.map((item) => `<li data-linkable>${escapeHtml(item)}</li>`).join("");

  return `<body class="lang-both topic-page" data-topic-id="${escapeAttr(topic.id)}" data-topic-url="${escapeAttr(topic.url)}">
${siteHeader({ prefix: "../../", breadcrumbHtml: breadcrumbForTopic(topic, topics, context), sectionLabel: topic.importance_type })}
<main>
  <section class="hero topic-hero">
    <div class="wrap hero-grid">
      <div class="reveal">
        <div class="pill"><span class="pulse-dot"></span>${escapeHtml(topic.unit)} · Level ${topic.level} · ${escapeHtml(lesson.profile_name)}</div>
        <h1><span class="gradient">${escapeHtml(topic.title)}</span></h1>
        <p class="lead ar-block" data-linkable>${escapeHtml(lesson.hero_ar)}</p>
        <p class="lead en-block en" data-linkable>${escapeHtml(lesson.hero_en)}</p>
        <div class="hero-actions">
          <a class="btn" href="#definition">Start</a>
          <a class="btn ghost" href="#quiz">Quick Check</a>
        </div>
      </div>
      <div class="hero-card reveal">
        ${diagramBlock(topic, topics, context)}
      </div>
    </div>
  </section>

  ${visualGallery(topic, context)}

  <section class="section" id="definition">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">01</span>
        <h2>Quick Definition</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.definition_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.definition_en)}</p>
      </article>
      <article class="card">
        <span class="chapter-num">02</span>
        <h2>Why It Matters</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.why_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.why_en)}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">03</span>
        <h2>Where It Appears</h2>
        <p class="ar-block" data-linkable>${escapeHtml(lesson.appears_ar)}</p>
        <p class="en-block en" data-linkable>${escapeHtml(lesson.appears_en)}</p>
        <ul>${childList}</ul>
      </article>
      <article class="card">
        <span class="chapter-num">04</span>
        <h2>Practical Examples</h2>
        <ul>${examples}</ul>
      </article>
    </div>
  </section>

  ${depthUpgradeSections(topic)}

  ${includeInteractive ? interactiveBlock(topic) : ""}

  <section class="section">
    <div class="wrap">
      <div class="card">
        <span class="chapter-num">RELATED</span>
        <h2>Related Learning Path</h2>
        <p class="ar-block" data-linkable>راجع الموضوعات القريبة من ${escapeHtml(cleanTitle)} عندما تساعد على فهم نفس النظام أو نفس المستند أو نفس الاختبار.</p>
        <p class="en-block en" data-linkable>Review nearby topics around ${escapeHtml(cleanTitle)} when they clarify the same system, document set, or commissioning check.</p>
        <ul class="link-grid">${relatedList}</ul>
      </div>
    </div>
  </section>

  ${quizBlock(topic, quizCount)}
  ${referencesBlock(topic)}
  ${pageNavigation(topic, topics, context)}
</main>
${siteFooter("../../")}
</body>`;
}

function electricChargePage(topic, topics, context = {}) {
  const lookup = context.lookup;
  const current = topics.find((item) => stripLeadingCode(item.title).toLowerCase() === "current");
  const voltage = topics.find((item) => stripLeadingCode(item.title).toLowerCase() === "voltage");
  const resistance = topics.find((item) => stripLeadingCode(item.title).toLowerCase() === "resistance");
  const count = 10;
  const related = [current, voltage, resistance, ...topic.related_topic_ids.map((id) => lookup.get(id)).filter(Boolean)]
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((other) => other.id === item.id) === index)
    .slice(0, 10);
  const relatedHtml = related.map((item) => `<li><a href="${rootRelativeUrl(topic.url, item.url)}">${escapeHtml(item.title)}</a></li>`).join("");

  return `<body class="lang-both topic-page electric-charge-page" data-topic-id="${escapeAttr(topic.id)}" data-topic-url="${escapeAttr(topic.url)}">
${siteHeader({ prefix: "../../", breadcrumbHtml: breadcrumbForTopic(topic, topics, context), sectionLabel: "Gold Standard Lesson" })}
<main>
  <section class="hero topic-hero">
    <div class="wrap hero-grid">
      <div class="reveal">
        <div class="pill"><span class="pulse-dot"></span> Electrical Basics · Basic electrical quantities</div>
        <h1><span class="gradient">Electric Charge</span><br><span class="ar-block">الشحنة الكهربائية</span></h1>
        <p class="lead ar-block" data-linkable>الشحنة الكهربائية هي البداية الطبيعية قبل: current, voltage, electric field, grounding. من غير فهم charge، يصبح تفسير حركة الإلكترونات، الإشارات، والحماية الكهربائية ناقصًا.</p>
        <p class="lead en-block en" data-linkable>Electric charge is the starting point before current, voltage, electric field, and grounding. Without charge, electron movement, signals, and electrical protection are hard to reason about.</p>
        <div class="hero-actions">
          <a class="btn" href="#formula">Understand Formula</a>
          <a class="btn ghost" href="#interactive">Open Simulation</a>
          <a class="btn ghost" href="#quiz">Take Quiz</a>
        </div>
      </div>
      <div class="hero-card reveal">
        ${diagramBlock(topic, topics, context)}
      </div>
    </div>
  </section>

  <section class="stats-strip">
    <div class="wrap stats-grid-wide">
      <div class="stat-wide"><b>Q / q</b><span>Charge symbol</span></div>
      <div class="stat-wide"><b>C</b><span>Coulomb unit</span></div>
      <div class="stat-wide"><b>e</b><span>Elementary charge</span></div>
      <div class="stat-wide"><b>−e</b><span>Electron charge</span></div>
    </div>
  </section>

  ${visualGallery(topic, context)}

  <section class="section" id="definition">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">01</span>
        <h2>What Charge Means</h2>
        <p class="ar-block" data-linkable>Electric charge هي خاصية في particles مثل electron وproton. الإلكترون يحمل شحنة سالبة، والبروتون يحمل شحنة موجبة. اختلاف نوع الشحنة يسبب attraction أو repulsion.</p>
        <p class="en-block en" data-linkable>Electric charge is a property of particles such as electrons and protons. Electrons are negative, protons are positive, and charge polarity creates attraction or repulsion.</p>
      </article>
      <article class="card">
        <span class="chapter-num">02</span>
        <h2>Why It Matters</h2>
        <p class="ar-block" data-linkable>في electrical systems، فهم charge يشرح لماذا current يتحرك، لماذا voltage يمثل energy difference، ولماذا grounding وshielding مهمين في حماية المعدات والإشارات.</p>
        <p class="en-block en" data-linkable>In electrical systems, charge explains current flow, voltage as energy difference, and why grounding and shielding protect equipment and signals.</p>
      </article>
    </div>
  </section>

  <section class="section" id="formula">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">FORMULA</span>
        <h2>Elementary Charge</h2>
        <p class="formula-explain ar-block">قبل استخدام الرقم، افهم الرموز: <strong>e</strong> تعني elementary charge، و<strong>C</strong> تعني Coulomb. الرقم 10^-19 يعني قيمة صغيرة جدًا.</p>
        <p class="formula-explain en-block en">Before using the number, define the symbols: <strong>e</strong> is elementary charge and <strong>C</strong> is Coulomb. The exponent 10^-19 means a very small number.</p>
        <div class="formula" aria-label="Elementary charge formula">e = 1.602 × 10^-19 C</div>
        <ul>
          <li>Electron charge = −e</li>
          <li>Proton charge = +e</li>
          <li>One Coulomb is huge compared with one electron charge.</li>
        </ul>
      </article>
      <article class="card">
        <span class="chapter-num">CALC</span>
        <h2>Electron Counter</h2>
        <p class="ar-block">لو عرفت عدد الإلكترونات، يمكنك تقدير مقدار الشحنة الكلية. الإشارة السالبة تعني electrons.</p>
        <p class="en-block en">If you know the number of electrons, you can estimate the total charge. The negative sign means electrons.</p>
        <label for="electronCount">Number of electrons</label>
        <input id="electronCount" class="number-input" type="number" min="1" step="1" value="1000000" data-electron-count>
        <button class="btn" type="button" data-electron-calc>Calculate</button>
        <output class="calc-output" data-electron-output>Q = -1.602e-13 C</output>
      </article>
    </div>
  </section>

  <section class="section" id="interactive">
    <div class="wrap grid-2">
      <article>
        <span class="chapter-num">INTERACTIVE</span>
        <h2>Interactive Simulation</h2>
        <p class="ar-block" data-linkable>جرّب simulation يوضح انتقال charge بين جسمين. لاحظ أن الشحنات المتشابهة تتنافر، والمختلفة تتجاذب، وأن grounding يغير توزيع الشحنة.</p>
        <p class="en-block en" data-linkable>Use a simulation to observe charge transfer, attraction, repulsion, and how grounding changes charge distribution.</p>
      </article>
      <article class="sim-card">
        <h3>PhET: Balloons and Static Electricity</h3>
        <p>Move charge between objects and compare attraction, repulsion, and wall interaction.</p>
        <a class="btn" href="https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_en.html" target="_blank" rel="noopener">Open Simulation</a>
        <a class="btn ghost" href="https://phet.colorado.edu/en/simulations/charges-and-fields" target="_blank" rel="noopener">Charges and Fields</a>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">RULES</span>
        <h2>Charge Rules</h2>
        <ul>
          <li data-linkable>Same charge signs repel each other.</li>
          <li data-linkable>Opposite charge signs attract each other.</li>
          <li data-linkable>Charge is conserved; it moves or redistributes but does not disappear in normal circuit analysis.</li>
          <li data-linkable>Current is the rate of charge flow.</li>
        </ul>
      </article>
      <article class="card">
        <span class="chapter-num">RELATED</span>
        <h2>Related Pages</h2>
        <ul class="link-grid">${relatedHtml}</ul>
      </article>
    </div>
  </section>

  ${depthUpgradeSections(topic)}

  ${quizBlock(topic, count)}

  <section class="section" id="refs">
    <div class="wrap">
      <div class="card">
        <span class="chapter-num">REFERENCES</span>
        <h2>References</h2>
        <ul>
          <li><a href="https://openstax.org/books/college-physics-2e/pages/18-introduction-to-electric-charge-and-electric-field" target="_blank" rel="noopener">OpenStax: Electric Charge and Electric Field</a></li>
          <li><a href="https://phet.colorado.edu/en/simulations/filter?subjects=physics&type=html&sort=alpha&view=grid" target="_blank" rel="noopener">PhET Interactive Simulations</a></li>
          <li><a href="https://www.khanacademy.org/science/electrical-engineering/ee-electrostatics" target="_blank" rel="noopener">Khan Academy: Electrostatics</a></li>
        </ul>
      </div>
    </div>
  </section>
  ${pageNavigation(topic, topics, context)}
</main>
${siteFooter("../../")}
</body>`;
}

export function topicPageHtml(topic, topics, context = {}) {
  const body = stripLeadingCode(topic.title).toLowerCase() === "electric charge"
    ? electricChargePage(topic, topics, context)
    : standardTopicPage(topic, topics, context);
  return htmlShell({
    title: `${topic.title} | Light Current Course`,
    description: `${topic.title} in ${topic.full_path.join(" / ")}`,
    body,
    prefix: "../../",
    lang: "ar",
    dir: "rtl"
  });
}

export function topPageHtml({ title, description, body, prefix = "./", extraScripts = [] }) {
  return htmlShell({ title, description, body, prefix, extraScripts });
}
