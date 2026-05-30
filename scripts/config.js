import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_SOURCE_CSV =
  "C:\\Users\\cewat\\Downloads\\Light Current Course - v2.csv";
export const DEFAULT_TEMPLATE_HTML = "C:\\Users\\cewat\\Downloads\\Temp.html";

export const DIRS = {
  assets: path.join(ROOT_DIR, "assets"),
  content: path.join(ROOT_DIR, "content"),
  contentManual: path.join(ROOT_DIR, "content", "manual"),
  contentGenerated: path.join(ROOT_DIR, "content", "generated"),
  data: path.join(ROOT_DIR, "data"),
  pages: path.join(ROOT_DIR, "pages"),
  generatedPages: path.join(ROOT_DIR, "pages", "generated"),
  reports: path.join(ROOT_DIR, "reports"),
  scripts: path.join(ROOT_DIR, "scripts"),
  styles: path.join(ROOT_DIR, "styles"),
  js: path.join(ROOT_DIR, "js"),
  docs: path.join(ROOT_DIR, "docs"),
  tests: path.join(ROOT_DIR, "tests")
};

export const FILES = {
  sourceCsvCopy: path.join(DIRS.contentManual, "Light Current Course - v2.csv"),
  templateCopy: path.join(DIRS.contentManual, "electric_charge_template_clean_v7_logo_link.html"),
  topics: path.join(DIRS.data, "topics.json"),
  tree: path.join(DIRS.data, "tree.json"),
  searchIndex: path.join(DIRS.data, "search-index.json"),
  glossary: path.join(DIRS.data, "glossary.json"),
  internalLinkDictionary: path.join(DIRS.data, "internal-link-dictionary.json"),
  visualPlan: path.join(DIRS.data, "visual-plan.json"),
  visualLibrary: path.join(DIRS.data, "visual-library.json"),
  imageAttributions: path.join(DIRS.data, "image-attributions.json"),
  pageMap: path.join(DIRS.data, "page-map.json"),
  linkStats: path.join(DIRS.reports, "internal-link-stats.json"),
  validationStats: path.join(DIRS.reports, "validation-stats.json"),
  linkCheckStats: path.join(DIRS.reports, "link-check-stats.json"),
  contentRuleStats: path.join(DIRS.reports, "content-rule-stats.json"),
  visualValidationStats: path.join(DIRS.reports, "visual-validation-stats.json"),
  visualAuditStats: path.join(DIRS.reports, "visual-audit-stats.json"),
  buildSummary: path.join(DIRS.reports, "build-summary.json")
};

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function ensureProjectDirs() {
  Object.values(DIRS).forEach(ensureDir);
}

export function sourceCsvPath() {
  if (process.env.COURSE_CSV) return process.env.COURSE_CSV;
  if (fs.existsSync(FILES.sourceCsvCopy)) return FILES.sourceCsvCopy;
  return DEFAULT_SOURCE_CSV;
}

export function templateHtmlPath() {
  if (process.env.COURSE_TEMPLATE) return process.env.COURSE_TEMPLATE;
  if (fs.existsSync(FILES.templateCopy)) return FILES.templateCopy;
  return DEFAULT_TEMPLATE_HTML;
}

export function readText(file) {
  return fs.readFileSync(file, "utf8");
}

export function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, "utf8");
}

export function readJson(file) {
  return JSON.parse(readText(file));
}

export function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function copyIfPresent(from, to) {
  if (!fs.existsSync(from)) return false;
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  return true;
}

export function relativeFromRoot(file) {
  return path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
}
