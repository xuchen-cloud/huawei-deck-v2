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
    if (!key?.startsWith("--") || !value) throw new Error("Expected --plan, --output, and --groups");
    args[key.slice(2)] = value;
  }
  for (const key of ["plan", "output", "groups"]) if (!args[key]) throw new Error(`Missing --${key}`);
  return args;
}

function moduleRoots() {
  return [process.cwd(), process.env.RUNTIME_NODE_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, process.env.NODE_PATH].filter(Boolean);
}

function loadPackage(name) {
  for (const root of moduleRoots()) {
    try {
      const resolved = require.resolve(name, { paths: [root] });
      return require(resolved);
    } catch {}
  }
  throw new Error(`Cannot resolve ${name}. Install this skill's locked dependencies or set RUNTIME_NODE_MODULES.`);
}

function color(value, fallback = "000000") {
  if (!value || value === "none") return fallback;
  return String(value).replace(/^#/, "").toUpperCase();
}

function inch(value) {
  return Number(value) / 96;
}

function position(element) {
  return { x: inch(element.position.x), y: inch(element.position.y), w: inch(element.position.w), h: inch(element.position.h) };
}

function textMargin(value) {
  if (Array.isArray(value)) return value;
  return Number.isFinite(value) ? value : 0;
}

function shapeType(pptx, geometry) {
  const value = pptx.ShapeType?.[geometry];
  if (value) return value;
  const aliases = { rectangle: "rect", roundedRectangle: "roundRect", oval: "ellipse" };
  return pptx.ShapeType?.[aliases[geometry]] || geometry || pptx.ShapeType.rect;
}

function chartType(pptx, value) {
  if (value === "column") return pptx.ChartType.bar;
  return pptx.ChartType[value] || pptx.ChartType.bar;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(args.plan);
  const projectRoot = path.dirname(planPath);
  const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
  const module = loadPackage("pptxgenjs");
  const PptxGenJS = module.default || module;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Huawei Deck Skill";
  pptx.company = "Huawei";
  pptx.subject = plan.title || plan.projectId;
  pptx.title = plan.title || plan.projectId;
  pptx.lang = plan.language || "zh-CN";
  pptx.theme = {
    headFontFace: plan.theme?.fonts?.sans || "Noto Sans CJK SC",
    bodyFontFace: plan.theme?.fonts?.sans || "Noto Sans CJK SC",
    lang: plan.language || "zh-CN",
  };

  const groupConfig = { slides: [] };
  for (const [slideIndex, planSlide] of plan.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: color(planSlide.background, "FFFFFF") };
    const connectors = planSlide.elements.filter((element) => element.type === "connector");
    const others = planSlide.elements.filter((element) => element.type !== "connector");
    for (const element of [...connectors, ...others]) {
      const pos = position(element);
      const style = element.style || {};
      if (element.type === "connector") {
        slide.addShape(pptx.ShapeType.line, {
          ...pos,
          objectName: element.id,
          line: { color: color(style.line, "76767C"), pt: style.linePt || 1, beginArrowType: style.beginArrow || "none", endArrowType: style.endArrow || "none", dash: style.dash || "solid" },
        });
      } else if (element.type === "shape") {
        slide.addShape(shapeType(pptx, element.geometry), {
          ...pos,
          objectName: element.id,
          rotate: element.position.rotation || 0,
          fill: style.fill === "none" ? { color: "FFFFFF", transparency: 100 } : { color: color(style.fill, "FFFFFF"), transparency: style.fillTransparency || 0 },
          line: style.line === "none" ? { color: "FFFFFF", transparency: 100, pt: 0 } : { color: color(style.line, "E7E7E7"), pt: style.linePt ?? 1, dash: style.dash || "solid" },
          radius: style.radiusPx ? inch(style.radiusPx) : undefined,
        });
      } else if (element.type === "text") {
        slide.addText(element.text ?? element.paragraphs?.map((item) => item.text || item).join("\n") ?? "", {
          ...pos,
          objectName: element.id,
          fontFace: style.fontFace || plan.theme?.fonts?.sans || "Noto Sans CJK SC",
          fontSize: style.fontPt,
          bold: Boolean(style.bold),
          color: color(style.color, "1A1A1C"),
          align: style.align || "left",
          valign: style.valign || "top",
          margin: textMargin(style.marginPt),
          breakLine: false,
          paraSpaceAfterPt: style.paraSpaceAfterPt || 0,
          lineSpacingMultiple: style.lineSpacing || 1,
          isTextBox: true,
        });
      } else if (element.type === "image") {
        const sourcePath = path.isAbsolute(element.source.path) ? element.source.path : path.resolve(projectRoot, element.source.path);
        if (element.fit === "cover" && element.source.preparedForFrame !== true) {
          throw new Error(`${planSlide.id}/${element.id}: cover image is not declared preparedForFrame`);
        }
        slide.addImage({
          path: sourcePath,
          ...pos,
          objectName: element.id,
          altText: element.alt || element.id,
          sizing: { type: element.fit === "cover" ? "cover" : "contain", w: pos.w, h: pos.h },
        });
      } else if (element.type === "table") {
        const tableStyle = element.style || {};
        const rows = element.rows.map((row, rowIndex) => row.map((value) => ({
          text: String(value ?? ""),
          options: {
            bold: rowIndex === 0,
            color: color(rowIndex === 0 ? tableStyle.headerColor : tableStyle.bodyColor, "1A1A1C"),
            fill: { color: color(rowIndex === 0 ? tableStyle.headerFill : tableStyle.bodyFill, rowIndex === 0 ? "F3F4F6" : "FFFFFF") },
            fontFace: tableStyle.fontFace || plan.theme?.fonts?.sans || "Noto Sans CJK SC",
            fontSize: rowIndex === 0 ? tableStyle.headerFontPt || 11 : tableStyle.fontPt || 10.5,
            margin: tableStyle.marginPt ?? 4,
            valign: "middle",
            border: { type: "solid", color: color(tableStyle.line, "E7E7E7"), pt: tableStyle.linePt || 1 },
          },
        })));
        slide.addTable(rows, {
          ...pos,
          objectName: element.id,
          colW: (element.columns || []).map((ratio) => pos.w * ratio),
          border: { type: "solid", color: color(tableStyle.line, "E7E7E7"), pt: tableStyle.linePt || 1 },
          autoPage: false,
        });
      } else if (element.type === "chart") {
        const chartStyle = element.style || {};
        const data = element.series.map((series) => ({ name: series.name, labels: element.categories, values: series.values }));
        slide.addChart(chartType(pptx, element.chartType), data, {
          ...pos,
          objectName: element.id,
          showLegend: Boolean(chartStyle.showLegend),
          showTitle: false,
          chartColors: element.series.map((series, index) => color(series.color, index === 0 ? "C7000B" : "A7A7A7")),
          barDir: element.chartType === "bar" ? "bar" : "col",
          catAxisLabelFontFace: plan.theme?.fonts?.sans || "Noto Sans CJK SC",
          valAxisLabelFontFace: plan.theme?.fonts?.sans || "Noto Sans CJK SC",
          catAxisLabelFontSize: chartStyle.axisFontPt || 10,
          valAxisLabelFontSize: chartStyle.axisFontPt || 10,
          valAxisLabelFormatCode: chartStyle.numberFormat || "General",
          showCatName: false,
          showSerName: false,
          showPercent: element.chartType === "pie" || element.chartType === "doughnut",
          showLeaderLines: true,
          showValue: Boolean(chartStyle.showValue),
          showCatAxisTitle: false,
          showValAxisTitle: false,
          showCatAxis: true,
          showValAxis: !["pie", "doughnut"].includes(element.chartType),
          showValGridLine: !["pie", "doughnut"].includes(element.chartType),
          legendPos: chartStyle.legendPosition || "b",
        });
      }
    }
    if (planSlide.notes) slide.addNotes(planSlide.notes);
    groupConfig.slides.push({ slide: slideIndex + 1, groups: planSlide.groups || [] });
  }

  const outputPath = path.resolve(args.output);
  const groupsPath = path.resolve(args.groups);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.dirname(groupsPath), { recursive: true });
  await pptx.writeFile({ fileName: outputPath, compression: true });
  await fs.writeFile(groupsPath, `${JSON.stringify(groupConfig, null, 2)}\n`);
  process.stdout.write(`${outputPath}\n${groupsPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
