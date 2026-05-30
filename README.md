# Light Current Static Course

This repository builds a complete static educational website from the Light Current course CSV. Every non-empty row in the spreadsheet becomes one dedicated HTML page, with shared navigation, search, glossary, tree exploration, internal links, quizzes, and validation reports.

## Source Files

Default source locations:

- `C:\Users\cewat\Downloads\Light Current Course - v2.csv`
- `C:\Users\cewat\Downloads\Temp.html`

The parser copies these into `content/manual/` during the build so the project remains easier to regenerate later.

## Build

PowerShell on this machine blocks `npm.ps1`, so use `npm.cmd`:

```powershell
npm.cmd run build
```

Useful commands:

```powershell
npm.cmd run parse
npm.cmd run classify
npm.cmd run generate
npm.cmd run link
npm.cmd run validate
npm.cmd run report
npm.cmd run test
npm.cmd run dev
```

## Static Pages

- `index.html` is the course homepage.
- `tree.html` is the full interactive course tree.
- `search.html` is the client-side search interface.
- `glossary.html` is the generated glossary.
- `pages/generated/*.html` contains one generated page per CSV topic row.

## Data Pipeline

The CSV has four hierarchy columns and no header row. The scripts trim each row, infer the topic path, create parent/child/sibling relationships, classify page depth, generate stable slugs, and write:

- `data/topics.json`
- `data/tree.json`
- `data/search-index.json`
- `data/glossary.json`
- `data/internal-link-dictionary.json`
- `data/page-map.json`

## Internal Linking

The linking pipeline builds aliases for every topic, prefers path-aware related terms, avoids self-links, and writes link counts plus ambiguity notes to reports.

## Validation

Validation checks that every topic has a page, every required data file includes every topic, links resolve, required footer/logo content exists, banned phrases are absent, and visible pages are not empty or placeholder-only.

Reports are written to `reports/`.

## Deployment

The output is fully static. Push the repository to GitHub and enable GitHub Pages from the repository root, or upload the root folder to any static host.

## Credits

Eng Mohamed El-Sisi  
Ashraf  
© Anzma Tech Academy. All rights reserved.
