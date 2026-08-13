#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error("Expected --plan, --output, --render-dir, and --groups");
    args[key.slice(2)] = value;
  }
  for (const key of ["plan", "output", "render-dir", "groups"]) if (!args[key]) throw new Error(`Missing --${key}`);
  return args;
}

function moduleRoots() {
  return [process.cwd(), process.env.RUNTIME_NODE_MODULES, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, process.env.NODE_PATH].filter(Boolean);
}

async function loadArtifactTool() {
  try {
    return await import("@oai/artifact-tool");
  } catch {}
  for (const root of moduleRoots()) {
    try {
      const resolved = require.resolve("@oai/artifact-tool", { paths: [root] });
      return await import(pathToFileURL(resolved).href);
    } catch {}
  }
  throw new Error("Cannot resolve @oai/artifact-tool. Run inside the OpenAI Presentations runtime and set RUNTIME_NODE_MODULES.");
}

function hex(value, fallback = "000000") {
  if (!value || value === "none") return fallback;
  return String(value).replace(/^#/, "").toUpperCase();
}

function fill(value, fallback = "000000") {
  return value === "none" ? "none" : `#${hex(value, fallback)}`;
}

function pxFromPt(value) {
  return Number(value || 0) * 96 / 72;
}

function pos(element) {
  return { left: element.position.x, top: element.position.y, width: element.position.w, height: element.position.h, rotation: element.position.rotation || 0 };
}

function contentType(file) {
  const extension = path.extname(file).toLowerCase();
  return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" })[extension] || "application/octet-stream";
}

async function writeBlob(target, blob) {
  await fs.writeFile(target, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(args.plan);
  const projectRoot = path.dirname(planPath);
  const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
  const { Presentation, PresentationFile } = await loadArtifactTool();
  const presentation = Presentation.create({ slideSize: plan.canvas || { width: 1280, height: 720 } });
  const groupConfig = { slides: [] };

  for (const [slideIndex, planSlide] of plan.slides.entries()) {
    const slide = presentation.slides.add();
    slide.background.fill = fill(planSlide.background, "FFFFFF");
    const connectors = planSlide.elements.filter((element) => element.type === "connector");
    const others = planSlide.elements.filter((element) => element.type !== "connector");
    for (const element of [...connectors, ...others]) {
      const style = element.style || {};
      if (element.type === "connector") {
        slide.shapes.add({
          geometry: "line",
          name: element.id,
          position: pos(element),
          fill: "none",
          line: { style: style.dash || "solid", fill: fill(style.line, "76767C"), width: pxFromPt(style.linePt || 1) },
        });
      } else if (element.type === "shape") {
        slide.shapes.add({
          geometry: element.geometry || "rect",
          name: element.id,
          position: pos(element),
          fill: fill(style.fill, "FFFFFF"),
          line: style.line === "none" ? { style: "solid", fill: "none", width: 0 } : { style: style.dash || "solid", fill: fill(style.line, "E7E7E7"), width: pxFromPt(style.linePt ?? 1) },
          borderRadius: style.radiusPx || undefined,
        });
      } else if (element.type === "text") {
        const shape = slide.shapes.add({
          geometry: "textbox",
          name: element.id,
          position: pos(element),
          fill: "none",
          line: { style: "solid", fill: "none", width: 0 },
        });
        shape.text = element.text ?? element.paragraphs?.map((item) => item.text || item).join("\n") ?? "";
        shape.text.style = {
          fontSize: pxFromPt(style.fontPt),
          typeface: style.fontFace || plan.theme?.fonts?.sans || "Noto Sans CJK SC",
          bold: Boolean(style.bold),
          color: fill(style.color, "1A1A1C"),
          alignment: style.align || "left",
          verticalAlignment: style.valign || "top",
          insets: { top: pxFromPt(style.marginPt || 0), right: pxFromPt(style.marginPt || 0), bottom: pxFromPt(style.marginPt || 0), left: pxFromPt(style.marginPt || 0) },
          autoFit: "none",
        };
      } else if (element.type === "image") {
        const sourcePath = path.isAbsolute(element.source.path) ? element.source.path : path.resolve(projectRoot, element.source.path);
        if (element.fit === "cover" && element.source.preparedForFrame !== true) {
          throw new Error(`${planSlide.id}/${element.id}: cover image is not declared preparedForFrame`);
        }
        const bytes = await fs.readFile(sourcePath);
        const blob = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        slide.images.add({
          blob,
          contentType: contentType(sourcePath),
          alt: element.alt || element.id,
          fit: element.fit === "cover" ? "cover" : "contain",
          name: element.id,
          position: pos(element),
        });
      } else if (element.type === "table") {
        const tableStyle = element.style || {};
        const table = slide.tables.add({
          rows: element.rows.length,
          columns: element.rows[0].length,
          left: element.position.x,
          top: element.position.y,
          width: element.position.w,
          height: element.position.h,
          columnTracks: (element.columns || element.rows[0].map(() => 1)).map((value) => ({ mode: "fr", value })),
          values: element.rows,
        });
        table.name = element.id;
        table.borders.assign({ style: "solid", fill: fill(tableStyle.line, "E7E7E7"), width: pxFromPt(tableStyle.linePt || 1) });
        for (let row = 0; row < element.rows.length; row += 1) {
          for (let column = 0; column < element.rows[row].length; column += 1) {
            const cell = table.getCell(row, column);
            cell.fill = fill(row === 0 ? tableStyle.headerFill : tableStyle.bodyFill, row === 0 ? "F3F4F6" : "FFFFFF");
            cell.text.style = {
              fontSize: pxFromPt(row === 0 ? tableStyle.headerFontPt || 11 : tableStyle.fontPt || 10.5),
              typeface: tableStyle.fontFace || plan.theme?.fonts?.sans || "Noto Sans CJK SC",
              bold: row === 0,
              color: fill(row === 0 ? tableStyle.headerColor : tableStyle.bodyColor, "1A1A1C"),
              verticalAlignment: "middle",
              alignment: "left",
            };
          }
        }
      } else if (element.type === "chart") {
        const chartStyle = element.style || {};
        const type = element.chartType === "column" ? "bar" : element.chartType;
        slide.charts.add(type, {
          position: pos(element),
          categories: element.categories,
          series: element.series.map((series, index) => ({ name: series.name, values: series.values, fill: fill(series.color, index === 0 ? "C7000B" : "A7A7A7"), line: { style: "solid", fill: fill(series.color, index === 0 ? "C7000B" : "A7A7A7"), width: 2 } })),
          hasLegend: Boolean(chartStyle.showLegend),
          legend: { position: chartStyle.legendPosition || "bottom", textStyle: { fontSize: pxFromPt(chartStyle.axisFontPt || 10), fill: fill("585860") } },
          barOptions: { direction: element.chartType === "bar" ? "bar" : "column", grouping: "clustered", gapWidth: 48 },
          dataLabels: { showValue: Boolean(chartStyle.showValue), showPercent: ["pie", "doughnut"].includes(type), position: "outEnd", textStyle: { fontSize: pxFromPt(chartStyle.axisFontPt || 10), fill: fill("585860") } },
          xAxis: { textStyle: { fontSize: pxFromPt(chartStyle.axisFontPt || 10), fill: fill("585860") }, majorGridlines: null },
          yAxis: { numberFormatCode: chartStyle.numberFormat || "General", textStyle: { fontSize: pxFromPt(chartStyle.axisFontPt || 10), fill: fill("585860") }, majorGridlines: { style: "solid", fill: fill("E7E7E7"), width: 1 } },
          chartFill: "none",
          plotAreaFill: "none",
          hasTitle: false,
        });
      }
    }
    if (planSlide.notes) {
      slide.speakerNotes.textFrame.setText(planSlide.notes);
      slide.speakerNotes.setVisible(true);
    }
    groupConfig.slides.push({ slide: slideIndex + 1, groups: planSlide.groups || [] });
  }

  const outputPath = path.resolve(args.output);
  const renderDir = path.resolve(args["render-dir"]);
  const groupsPath = path.resolve(args.groups);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(renderDir, { recursive: true });
  await fs.mkdir(path.dirname(groupsPath), { recursive: true });
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(renderDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(renderDir, `${stem}.layout.json`), await layout.text());
  }
  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(renderDir, "montage.webp"), montage);
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outputPath);
  await fs.writeFile(groupsPath, `${JSON.stringify(groupConfig, null, 2)}\n`);
  process.stdout.write(`${outputPath}\n${renderDir}\n${groupsPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
