#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error("Expected --pptx, --plan, and --json");
    args[key.slice(2)] = value;
  }
  for (const key of ["pptx", "plan", "json"]) if (!args[key]) throw new Error(`Missing --${key}`);
  return args;
}

function moduleRoots() {
  return [process.cwd(), process.env.RUNTIME_NODE_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, process.env.NODE_PATH].filter(Boolean);
}

function loadPackage(name) {
  for (const root of moduleRoots()) {
    try {
      return require(require.resolve(name, { paths: [root] }));
    } catch {}
  }
  throw new Error(`Cannot resolve ${name}. Install this skill's locked dependencies or set RUNTIME_NODE_MODULES.`);
}

function count(xml, expression) {
  return (xml.match(expression) || []).length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pptxPath = path.resolve(args.pptx);
  const plan = JSON.parse(await fs.readFile(path.resolve(args.plan), "utf8"));
  const JSZip = loadPackage("jszip");
  const zip = await JSZip.loadAsync(await fs.readFile(pptxPath));
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const errors = [];
  const warnings = [];
  const details = [];
  if (slideNames.length !== plan.slides.length) errors.push(`slide count ${slideNames.length} != plan ${plan.slides.length}`);

  for (const [index, slideName] of slideNames.entries()) {
    const xml = await zip.file(slideName).async("string");
    const planSlide = plan.slides[index];
    const expectedTables = planSlide.elements.filter((item) => item.type === "table").length;
    const expectedCharts = planSlide.elements.filter((item) => item.type === "chart").length;
    const expectedGroups = (planSlide.groups || []).length;
    const actualTables = count(xml, /<a:tbl(?:\s|>)/g);
    const actualCharts = count(xml, /<c:chart(?:\s|>)/g);
    const actualGroups = count(xml, /<p:grpSp(?:\s|>)/g);
    const locks = count(xml, /(?:noGrp|noUngrp)="1"/g);
    if (actualTables < expectedTables) errors.push(`${planSlide.id}: native table count ${actualTables} < ${expectedTables}`);
    if (actualCharts < expectedCharts) errors.push(`${planSlide.id}: native chart count ${actualCharts} < ${expectedCharts}`);
    if (actualGroups !== expectedGroups) errors.push(`${planSlide.id}: group count ${actualGroups} != ${expectedGroups}`);
    if (locks > 0) errors.push(`${planSlide.id}: ${locks} grouping lock(s) remain`);

    const notesName = `ppt/notesSlides/notesSlide${index + 1}.xml`;
    const notesFile = zip.file(notesName);
    const needsSources = (planSlide.sourceIds || []).length > 0;
    let hasSources = false;
    if (notesFile) {
      const notesXml = await notesFile.async("string");
      hasSources = notesXml.includes("[Sources]");
    }
    if (needsSources && !notesFile) errors.push(`${planSlide.id}: notes part is missing`);
    if (needsSources && !hasSources) errors.push(`${planSlide.id}: notes lack [Sources]`);
    if (!needsSources && planSlide.notes && !notesFile) warnings.push(`${planSlide.id}: planned notes were not exported`);

    const nativeText = count(xml, /<a:t(?:\s|>)/g);
    const images = count(xml, /<p:pic(?:\s|>)/g);
    if (nativeText === 0 && images > 0) errors.push(`${planSlide.id}: slide has images but no native text; possible flattened slide`);
    details.push({ slide: planSlide.id, nativeText, images, tables: actualTables, charts: actualCharts, groups: actualGroups, locks, hasSources });
  }

  const report = { pptx: pptxPath, plan: path.resolve(args.plan), slideCount: slideNames.length, errors, warnings, slides: details };
  const jsonPath = path.resolve(args.json);
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
