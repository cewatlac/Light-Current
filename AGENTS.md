# Light Current Static Course Instructions

## Project Purpose
This repository is a fully static educational website for the Light Current course. It is generated from the source spreadsheet and is designed for GitHub Pages or any normal static host.

## Non-Negotiable Rules
- Static only: use HTML, CSS, JavaScript, JSON, local assets, and optional Node.js generation scripts.
- Do not use React, Next.js, Vue, Angular, backend servers, databases, or heavy frameworks.
- Every non-empty spreadsheet row must have exactly one dedicated HTML page.
- Do not skip, merge, hide, or replace rows with placeholder-only pages.
- Generated visible pages must never contain TODO, FIXME, lorem ipsum, placeholder content, or "as an AI".

## CSV And Data Rules
- Inspect the real CSV structure before changing parsing logic.
- The current source file has four hierarchy columns and no header row.
- Treat trimmed non-empty cells as the topic path.
- Preserve source row index and source row hash for regeneration.
- Slugs must be deterministic, lowercase, hyphenated, ASCII-safe, unique, and path-aware when titles collide.
- Generated data files must include `topics.json`, `tree.json`, `search-index.json`, `glossary.json`, `internal-link-dictionary.json`, and `page-map.json`.

## Page Rules
- Each page must include title, actual breadcrumb, parent link, children links, previous/next links, related links, search metadata, at least one check-your-understanding block, and footer credits.
- Major pages should include richer explanations, diagrams, practical examples, an interactive section, and a quiz.
- Medium pages should include a complete compact lesson, examples, related pages, and a mini quiz.
- Small pages should still be useful: definition, where it appears, why it matters, examples, parent/related links, and three quick checks.
- The reusable layout must not hardcode `A. Foundations` or `A1. Electrical Basics`; every page must use its own spreadsheet path.

## Language And Terminology
- Support Arabic, English, and bilingual display where content exists.
- Arabic should be organized, professional, and understandable, with common technical English terms used naturally.
- Avoid awkward meta sentences and repeated "ELV engineers" phrasing.
- English should be direct, technical, and free of filler.
- Formula sections must explain the concept, every symbol, every unit, sign conventions, and a simple example.

## Theme And Design
- Use the Electric Charge reference page as the visual quality guide.
- Default to dark mode; support light mode.
- Use a smart-technology palette: teal, cyan, blue, and limited orange accents.
- Use shared CSS and JS files. Do not duplicate huge style/script blocks across generated pages.
- Visuals must teach the topic; avoid random decoration.
- Logo in the top navbar must link to `https://anzmatech.com/` and include an accessible label.

## Videos, Simulations, And Quizzes
- Do not use YouTube search result links or "search YouTube for" cards.
- Simulations belong in an `Interactive Simulation` section, never inside videos.
- External simulations must be directly relevant, attributed, and include a fallback open button.
- If no external simulation is suitable, use a local calculator, scenario explorer, diagram toggle, matching activity, or quick check.
- Quizzes must provide progress, score, retry, detailed feedback, and work in theme/language modes.

## Internal Linking
- Every generated topic is a linkable concept.
- Build a global dictionary from titles, safe aliases, acronyms, and normalized variants.
- Prefer specific matches and current-path context.
- Avoid self-links, broken links, ambiguous forced links, repeated over-linking, links inside formulas/code/URLs, and links inside existing anchors.
- Report ambiguous and skipped terms.

## Accessibility And Validation
- Use semantic HTML, proper heading order, alt text, aria labels, keyboard-accessible controls, visible focus states, good contrast, responsive layout, and reduced-motion support.
- Validation must fail if rows are missing pages, data indexes are incomplete, slugs duplicate, links break, required footer/logo is missing, banned visible phrases appear, or generated pages are empty.
- Reports must be generated for page generation, internal links, broken links, content quality, accessibility, and manual review.

## Footer Credits
Every visible page must include:

- Eng Mohamed El-Sisi
- Ashraf
- © Anzma Tech Academy. All rights reserved.

## Commit Guidance
Use clear staged commits when Git is available. Complete a logical group, validate, then commit. Do not claim a commit was created if Git is unavailable.
