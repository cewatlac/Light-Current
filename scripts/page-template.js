import { escapeAttr, escapeHtml, FOOTER_COPYRIGHT, rootRelativeUrl, stripLeadingCode } from "./lib.js";
import { educationalFigure, makeVisualPlanEntry, strategyForTopic } from "./visual-system.js";

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
  const path = topic.full_path.join(" / ");
  const base = [
    {
      type: "choice",
      q_ar: `ما أفضل وصف لدور ${topic.title} داخل المسار التعليمي؟`,
      q_en: `What is the best description of ${topic.title} in this course path?`,
      choices_ar: ["مفهوم مرتبط بالسياق العملي للمسار", "عنوان عشوائي خارج المنهج", "ملف خارجي غير مرتبط", "زر في الواجهة فقط"],
      choices_en: ["A concept connected to the practical course path", "A random title outside the course", "An unrelated external file", "Only a user interface button"],
      answer: 0,
      feedback_ar: `${topic.title} مرتبط بمسار ${path} ويجب فهمه ضمن parent وchildren والموضوعات القريبة.`,
      feedback_en: `${topic.title} belongs to ${path} and should be understood through its parent, children, and related topics.`
    },
    {
      type: "choice",
      q_ar: "عند قراءة صفحة فنية، ما أهم شيء قبل استخدام أي formula أو رقم؟",
      q_en: "Before using a formula or number on a technical page, what matters most?",
      choices_ar: ["فهم الرموز والوحدات والسياق", "نسخ الرقم فقط", "تجاهل الإشارات", "استخدام أي قيمة بدون مراجعة"],
      choices_en: ["Understand symbols, units, and context", "Copy the number only", "Ignore signs", "Use any value without checking"],
      answer: 0,
      feedback_ar: "الفهم الصحيح للرموز والوحدات يمنع أخطاء التصميم والتنفيذ وcommissioning.",
      feedback_en: "Correct symbols and units prevent design, installation, and commissioning mistakes."
    },
    {
      type: "choice",
      q_ar: `أين يجب مراجعة ${topic.title} عند وجود لبس؟`,
      q_en: `Where should ${topic.title} be checked when there is uncertainty?`,
      choices_ar: ["في parent topic والرسومات والمواصفات", "في العنوان فقط", "في اللون المستخدم في الصفحة", "في الذاكرة بدون مرجع"],
      choices_en: ["In the parent topic, drawings, and specifications", "Only in the title", "In the page color", "From memory without references"],
      answer: 0,
      feedback_ar: "السياق الفني يأتي من المسار الكامل والرسومات والمواصفات وليس من الاسم وحده.",
      feedback_en: "Technical context comes from the full path, drawings, and specifications, not the name alone."
    },
    {
      type: "choice",
      q_ar: "ما السلوك الصحيح عند ظهور مصطلح قريب في صفحة أخرى؟",
      q_en: "What is the right behavior when a related term appears on another page?",
      choices_ar: ["ربطه داخليًا إذا كان واضحًا وغير ملتبس", "ربطه بأي صفحة عشوائية", "تجاهله دائمًا", "تحويله إلى رابط خارجي"],
      choices_en: ["Link it internally when the match is clear and unambiguous", "Link it to a random page", "Always ignore it", "Turn it into an external link"],
      answer: 0,
      feedback_ar: "الربط الداخلي الصحيح يساعد المتعلم بدون إنشاء روابط مضللة.",
      feedback_en: "Correct internal linking helps learners without creating misleading links."
    },
    {
      type: "choice",
      q_ar: "لماذا نربط المفهوم بأمثلة عملية؟",
      q_en: "Why connect the concept to practical examples?",
      choices_ar: ["لتحويل التعريف إلى قرار تصميم أو تنفيذ", "لزيادة النص فقط", "لإخفاء نقص المحتوى", "لإلغاء الحاجة للفهم"],
      choices_en: ["To turn a definition into a design or site decision", "Only to increase text length", "To hide missing content", "To remove the need for understanding"],
      answer: 0,
      feedback_ar: "الأمثلة العملية تربط المعرفة بالتصميم والتنفيذ والاختبار.",
      feedback_en: "Practical examples connect knowledge to design, installation, and testing."
    },
    {
      type: "choice",
      q_ar: "أي عنصر يساعد في التعلم الذاتي داخل الصفحة؟",
      q_en: "Which element helps self-learning on the page?",
      choices_ar: ["quick check مع feedback", "رابط مكسور", "نص غير واضح", "صورة للزينة فقط"],
      choices_en: ["A quick check with feedback", "A broken link", "Unclear text", "A decorative-only image"],
      answer: 0,
      feedback_ar: "الاختبارات القصيرة تعطي feedback سريع وتكشف نقاط الضعف.",
      feedback_en: "Quick checks give immediate feedback and reveal weak spots."
    },
    {
      type: "choice",
      q_ar: "ما العلاقة بين الموضوعات المتجاورة؟",
      q_en: "How are neighboring topics related?",
      choices_ar: ["غالبًا تكمل نفس الجزء من النظام أو المستند", "ليست لها أي علاقة دائمًا", "كلها أسماء لنفس الصفحة", "لا تظهر في البحث"],
      choices_en: ["They often complete the same system area or document set", "They are always unrelated", "They are all names for the same page", "They never appear in search"],
      answer: 0,
      feedback_ar: "siblings والموضوعات القريبة تساعد في تكوين الصورة الكاملة.",
      feedback_en: "Siblings and nearby topics help build the complete picture."
    },
    {
      type: "choice",
      q_ar: "ما أفضل طريقة لاستخدام هذه الصفحة في مشروع؟",
      q_en: "What is the best way to use this page on a project?",
      choices_ar: ["كمراجعة سريعة ثم ربطها بالرسومات والمواصفات", "كبديل كامل عن كل المستندات", "كمصدر لأرقام غير مؤكدة", "كمحتوى غير مرتبط بالموقع"],
      choices_en: ["As a quick review, then connect it to drawings and specifications", "As a complete replacement for all documents", "As a source of unchecked numbers", "As content unrelated to site work"],
      answer: 0,
      feedback_ar: "الصفحة التعليمية تساعدك، لكن القرار النهائي يحتاج مستندات المشروع.",
      feedback_en: "The lesson helps, but final decisions still need project documents."
    }
  ];
  return base.slice(0, count);
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
  const title = escapeHtml(topic.title);
  const category = escapeHtml(topic.category || topic.unit || "this course area");
  const majorExtra = topic.importance_type === "major"
    ? `<section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">SYSTEM</span>
        <h2>System Architecture</h2>
        <p class="ar-block" data-linkable>في مستوى system، ${title} يحتاج قراءة من ثلاث زوايا: components، signal أو data flow، وinterface مع الأنظمة القريبة. ابدأ بتحديد مصدر المعلومة أو الطاقة، ثم نقطة المعالجة، ثم المخرج أو action المطلوب.</p>
        <p class="en-block en" data-linkable>At system level, ${title} should be read through components, signal or data flow, and interfaces with nearby systems. Identify the source, processing point, and expected output or action.</p>
      </article>
      <article class="card">
        <span class="chapter-num">FLOW</span>
        <h2>Signal, Data, Or Power Flow</h2>
        <p class="ar-block" data-linkable>راجع اتجاه flow: هل هو current، network packet، alarm event، control command، audio signal، video stream، أو commissioning evidence؟ فهم الاتجاه يمنع توصيلات عكسية وقرارات design غير واضحة.</p>
        <p class="en-block en" data-linkable>Check the direction of flow: current, network packet, alarm event, control command, audio signal, video stream, or commissioning evidence. Direction prevents wiring and design mistakes.</p>
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
        <p class="ar-block" data-linkable>قبل اعتماد ${title} في التصميم، اربطه بالscope، drawings، specifications، codes، وinterfaces. اسأل: ما القيمة أو الوظيفة المطلوبة؟ أين تظهر في layout أو schematic؟ وما dependencies مع ${category}؟</p>
        <p class="en-block en" data-linkable>Before using ${title} in design, connect it to scope, drawings, specifications, codes, and interfaces. Ask what function is required, where it appears, and what depends on it.</p>
      </article>
      <article class="card">
        <span class="chapter-num">SITE</span>
        <h2>Installation Considerations</h2>
        <p class="ar-block" data-linkable>في الموقع، راجع labeling، cable route، mounting، termination، polarity أو addressing إن وجدت، ثم قارن التنفيذ مع approved shop drawings. أي اختلاف صغير قد يظهر لاحقًا كfault أو failed test.</p>
        <p class="en-block en" data-linkable>On site, check labeling, cable route, mounting, termination, polarity or addressing when relevant, then compare the installation with approved shop drawings.</p>
      </article>
      <article class="card">
        <span class="chapter-num">TEST</span>
        <h2>Testing And Commissioning</h2>
        <p class="ar-block" data-linkable>أثناء testing، حدد expected result قبل القياس. سجّل evidence واضح: reading، screenshot، test sheet، أو functional result. اربط النتيجة بالparent topic حتى يكون handover traceable.</p>
        <p class="en-block en" data-linkable>During testing, define the expected result before measuring. Record traceable evidence such as readings, screenshots, test sheets, or functional outcomes.</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">MISTAKES</span>
        <h2>Common Mistakes</h2>
        <ul>
          <li data-linkable>Reading ${title} as an isolated term without checking parent and sibling topics.</li>
          <li data-linkable>Using a drawing symbol, device label, protocol name, or document title without confirming the project context.</li>
          <li data-linkable>Skipping test evidence, which makes troubleshooting and handover weaker.</li>
        </ul>
      </article>
      <article class="card">
        <span class="chapter-num">TROUBLESHOOT</span>
        <h2>Troubleshooting Scenario</h2>
        <p class="ar-block" data-linkable>لو حدث fault مرتبط بـ ${title}، ابدأ من source، ثم cable أو network path، ثم controller أو panel، ثم output أو document evidence. لا تقفز للجزء الأخير قبل تأكيد الأساسيات.</p>
        <p class="en-block en" data-linkable>If a fault is related to ${title}, start at the source, then cable or network path, then controller or panel, then output or document evidence. Do not jump to the last step first.</p>
      </article>
    </div>
  </section>`;
}

function interactiveBlock(topic) {
  return `<section class="section" id="interactive">
  <div class="wrap grid-2">
    <div>
      <span class="chapter-num">INTERACTIVE</span>
      <h2>Interactive Simulation</h2>
      <p class="ar-block" data-linkable>استخدم هذا scenario explorer لتفكر في ${escapeHtml(topic.title)} داخل المسار العملي. غيّر المرحلة ولاحظ كيف يتغير التركيز بين design وinstallation وtesting وmaintenance.</p>
      <p class="en-block en" data-linkable>Use this scenario explorer to place ${escapeHtml(topic.title)} in context. Change the stage and notice how the focus moves between design, installation, testing, and maintenance.</p>
    </div>
    <div class="sim-card" data-scenario>
      <div class="segmented" role="tablist" aria-label="Scenario stage">
        <button type="button" class="active" data-scenario-btn="design">Design</button>
        <button type="button" data-scenario-btn="site">Site</button>
        <button type="button" data-scenario-btn="test">Testing</button>
      </div>
      <div class="scenario-output" data-scenario-output>
        <strong>Design focus</strong>
        <p>Confirm scope, parent system, interfaces, symbols, units, and coordination notes before issuing drawings.</p>
      </div>
    </div>
  </div>
</section>`;
}

function referencesBlock(topic) {
  return `<section class="section" id="refs">
  <div class="wrap">
    <div class="card">
      <span class="chapter-num">REFERENCES</span>
      <h2>Learning References</h2>
      <p class="ar-block">راجع رسومات المشروع، specifications، standards المعتمدة، وmanuals الخاصة بالمورد عند استخدام ${escapeHtml(topic.title)} في قرار تصميم أو تنفيذ.</p>
      <p class="en-block en">Use project drawings, specifications, applicable standards, and vendor manuals before applying ${escapeHtml(topic.title)} to a design or installation decision.</p>
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
  const path = topic.full_path.join(" / ");
  const childList = topicList(topic, topics, topic.children_ids, "This page is a leaf topic in the spreadsheet tree.", 20, context);
  const relatedList = topicList(topic, topics, topic.related_topic_ids, "Related topics will appear as the course grows.", 10, context);
  const quizCount = topic.importance_type === "major" ? 8 : topic.importance_type === "medium" ? 5 : 3;
  const includeInteractive = topic.importance_type !== "small";

  return `<body class="lang-both topic-page" data-topic-id="${escapeAttr(topic.id)}" data-topic-url="${escapeAttr(topic.url)}">
${siteHeader({ prefix: "../../", breadcrumbHtml: breadcrumbForTopic(topic, topics, context), sectionLabel: topic.importance_type })}
<main>
  <section class="hero topic-hero">
    <div class="wrap hero-grid">
      <div class="reveal">
        <div class="pill"><span class="pulse-dot"></span>${escapeHtml(topic.unit)} · Level ${topic.level}</div>
        <h1><span class="gradient">${escapeHtml(topic.title)}</span></h1>
        <p class="lead ar-block" data-linkable>${escapeHtml(topic.title)} هو موضوع داخل مسار ${escapeHtml(path)}. الهدف هنا أن تفهم التعريف، مكان ظهوره في systems أو documents، وكيف تربطه بالموضوعات القريبة بدون حفظ منفصل عن السياق.</p>
        <p class="lead en-block en" data-linkable>${escapeHtml(topic.title)} sits inside ${escapeHtml(path)}. This page explains the definition, where it appears in systems or documents, and how it connects to nearby topics.</p>
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
        <p class="ar-block" data-linkable>تعريف ${escapeHtml(cleanTitle)} يعتمد على مكانه في الhierarchy: parent topic يحدد المجال، والchildren أو siblings يوضحوا التفاصيل القريبة. اقرأه كجزء من ${escapeHtml(topic.category)} وليس كمصطلح منفصل.</p>
        <p class="en-block en" data-linkable>${escapeHtml(cleanTitle)} should be read through its hierarchy: the parent sets the domain, while children and siblings define the nearby details.</p>
      </article>
      <article class="card">
        <span class="chapter-num">02</span>
        <h2>Why It Matters</h2>
        <p class="ar-block" data-linkable>في التطبيق العملي، هذا الموضوع يساعد في قراءة drawings، مراجعة specifications، تجهيز checklists، وربط design مع installation وcommissioning.</p>
        <p class="en-block en" data-linkable>In practice, this topic supports drawing review, specification checks, checklist preparation, and coordination between design, installation, and commissioning.</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="wrap grid-2">
      <article class="card">
        <span class="chapter-num">03</span>
        <h2>Where It Appears</h2>
        <p class="ar-block" data-linkable>ستقابله غالبًا ضمن documents مثل method statement، material submittal، shop drawings، test sheets، أو handover records حسب نوع النظام.</p>
        <p class="en-block en" data-linkable>You will usually meet it in documents such as method statements, material submittals, shop drawings, test sheets, or handover records depending on the system.</p>
        <ul>${childList}</ul>
      </article>
      <article class="card">
        <span class="chapter-num">04</span>
        <h2>Practical Examples</h2>
        <ul>
          <li data-linkable>Use the parent topic to decide which drawing, panel, cable, sensor, controller, protocol, or report is relevant.</li>
          <li data-linkable>Compare ${escapeHtml(topic.title)} with related topics before choosing a symbol, device, quantity, or checklist item.</li>
          <li data-linkable>During testing, confirm the expected result and record evidence in the correct project document.</li>
        </ul>
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
        <p class="ar-block" data-linkable>ابدأ من parent، ثم راجع siblings والchildren القريبة لتفهم الصورة الكاملة حول ${escapeHtml(topic.title)}.</p>
        <p class="en-block en" data-linkable>Start with the parent, then review siblings and children to understand the full context around ${escapeHtml(topic.title)}.</p>
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
        <p class="lead ar-block" data-linkable>الشحنة الكهربائية هي البداية الطبيعية قبل current وvoltage وelectric field وgrounding. من غير فهم charge، يصبح تفسير حركة الإلكترونات، الإشارات، والحماية الكهربائية ناقصًا.</p>
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
