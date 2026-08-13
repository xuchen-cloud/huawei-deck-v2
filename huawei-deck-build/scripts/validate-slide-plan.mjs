#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const planPath = process.argv[2];
if (!planPath) {
  process.stderr.write("Usage: node validate-slide-plan.mjs /absolute/path/slide-plan.json\n");
  process.exit(2);
}

const roleFloors = new Map([
  ["cover-title", 32],
  ["cover-subtitle", 14],
  ["slide-title", 24],
  ["intro", 12],
  ["module-title", 16],
  ["body", 10],
  ["emphasis", 10.5],
  ["supporting", 9.5],
  ["table-header", 10],
  ["table-body", 9.5],
  ["chart-label", 9],
  ["kpi", 32],
  ["kpi-unit", 10],
  ["label", 9],
  ["source", 8],
  ["page-number", 8],
]);

const allowedTypes = new Set(["text", "shape", "connector", "image", "table", "chart"]);
const errors = [];
const warnings = [];

function error(where, message) {
  errors.push(`${where}: ${message}`);
}

function warning(where, message) {
  warnings.push(`${where}: ${message}`);
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

const absolute = path.resolve(planPath);
let plan;
try {
  plan = JSON.parse(await fs.readFile(absolute, "utf8"));
} catch (caught) {
  process.stderr.write(`Cannot parse ${absolute}: ${caught.message}\n`);
  process.exit(2);
}

if (plan.schemaVersion !== "1.0") error("root", "schemaVersion must be 1.0");
if (!plan.projectId) error("root", "projectId is required");
if (!plan.canvas || !finiteNumber(plan.canvas.width) || !finiteNumber(plan.canvas.height)) {
  error("root", "canvas width and height are required numbers");
}
if (!Array.isArray(plan.slides) || plan.slides.length === 0) error("root", "slides must be a non-empty array");

const canvas = plan.canvas || { width: 1280, height: 720 };
const slideIds = new Set();
for (const [slideIndex, slide] of (plan.slides || []).entries()) {
  const where = `slide ${slideIndex + 1}`;
  if (!slide.id) error(where, "id is required");
  if (slideIds.has(slide.id)) error(where, `duplicate slide id ${slide.id}`);
  slideIds.add(slide.id);
  if (!slide.pageType) error(where, "pageType is required");
  if (!Array.isArray(slide.elements)) error(where, "elements must be an array");
  const elementIds = new Set();
  const elementMap = new Map();
  for (const [elementIndex, element] of (slide.elements || []).entries()) {
    const elementWhere = `${where} element ${elementIndex + 1}`;
    if (!element.id) error(elementWhere, "id is required");
    if (elementIds.has(element.id)) error(elementWhere, `duplicate element id ${element.id}`);
    elementIds.add(element.id);
    elementMap.set(element.id, element);
    if (!allowedTypes.has(element.type)) error(elementWhere, `unsupported type ${element.type}`);
    if (!element.role) error(elementWhere, "role is required");
    const p = element.position;
    if (!p || ![p.x, p.y, p.w, p.h].every(finiteNumber)) {
      error(elementWhere, "position x, y, w, h must be finite numbers");
      continue;
    }
    if (p.w < 0 || p.h < 0) error(elementWhere, "position width and height cannot be negative");
    if (!element.allowBleed && (p.x < 0 || p.y < 0 || p.x + p.w > canvas.width || p.y + p.h > canvas.height)) {
      error(elementWhere, "element extends beyond the canvas without allowBleed");
    }
    if (element.type === "text") {
      if (typeof element.text !== "string" && !Array.isArray(element.paragraphs)) error(elementWhere, "text or paragraphs is required");
      const floor = roleFloors.get(element.role);
      const fontPt = element.style?.fontPt;
      if (floor && (!finiteNumber(fontPt) || fontPt < floor)) error(elementWhere, `${element.role} requires fontPt >= ${floor}`);
      if (element.style?.maxLines === 1 && typeof element.text === "string" && element.text.includes("\n")) error(elementWhere, "single-line text contains a newline");
    }
    if (element.type === "table") {
      if (!Array.isArray(element.rows) || element.rows.length === 0) error(elementWhere, "table rows are required");
      const width = element.rows?.[0]?.length;
      if (!width || element.rows.some((row) => !Array.isArray(row) || row.length !== width)) error(elementWhere, "table rows must be rectangular");
      if (Array.isArray(element.columns) && width && element.columns.length !== width) error(elementWhere, "columns length must match table width");
    }
    if (element.type === "chart") {
      if (!Array.isArray(element.categories) || !Array.isArray(element.series)) error(elementWhere, "chart categories and series are required");
      for (const series of element.series || []) {
        if (!Array.isArray(series.values) || series.values.length !== (element.categories || []).length) error(elementWhere, `series ${series.name || "unnamed"} length must match categories`);
      }
    }
    if (element.type === "image") {
      if (!element.source?.path) error(elementWhere, "image source.path is required");
      if (!["contain", "cover"].includes(element.fit || "contain")) error(elementWhere, "image fit must be contain or cover");
      if (element.fit === "cover" && element.source?.preparedForFrame !== true) {
        error(elementWhere, "cover requires source.preparedForFrame: true; pre-crop to the target frame ratio for cross-engine consistency");
      }
    }
  }
  if (!slide.primaryProofObject || !elementMap.has(slide.primaryProofObject)) error(where, "primaryProofObject must name an existing element");
  const seenGroupMembers = new Set();
  for (const group of slide.groups || []) {
    if (!group.name || !Array.isArray(group.members) || group.members.length < 2) error(where, "each group needs a name and at least two members");
    for (const member of group.members || []) {
      if (!elementMap.has(member)) error(where, `group member ${member} does not exist`);
      if (seenGroupMembers.has(member)) error(where, `group member ${member} is reused`);
      seenGroupMembers.add(member);
    }
  }
  if ((slide.sourceIds || []).length > 0 && !String(slide.notes || "").includes("[Sources]")) error(where, "sourceIds require a [Sources] block in notes");
  if ((slide.elements || []).filter((element) => element.role === "primary-proof").length > 1) warning(where, "more than one element is marked primary-proof; confirm only one is visually dominant");
}

for (const item of warnings) process.stderr.write(`WARN ${item}\n`);
if (errors.length > 0) {
  for (const item of errors) process.stderr.write(`ERROR ${item}\n`);
  process.stderr.write(`Validation failed: ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  process.exit(1);
}
process.stdout.write(`Valid slide plan: ${absolute}\nSlides: ${plan.slides.length}\nWarnings: ${warnings.length}\n`);
