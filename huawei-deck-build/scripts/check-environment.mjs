#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.dirname(scriptDir);
const require = createRequire(import.meta.url);

function roots() {
  return [
    process.cwd(),
    skillDir,
    process.env.RUNTIME_NODE_MODULES,
    process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,
    process.env.NODE_PATH,
  ].filter(Boolean);
}

function resolvePackage(name) {
  for (const root of roots()) {
    try {
      return require.resolve(name, { paths: [root] });
    } catch {}
  }
  return null;
}

function executable(names) {
  for (const name of names) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  return null;
}

function artifactToolPath() {
  const resolved = resolvePackage("@oai/artifact-tool");
  if (resolved) return resolved;
  for (const root of roots()) {
    const candidate = path.join(root, "@oai", "artifact-tool", "dist", "artifact_tool.mjs");
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function packageVersion(resolved) {
  if (!resolved) return null;
  let current = path.dirname(resolved);
  while (current !== path.dirname(current)) {
    const candidate = path.join(current, "package.json");
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, "utf8")).version || null;
      } catch {}
    }
    current = path.dirname(current);
  }
  return null;
}

const artifactTool = artifactToolPath();
const pptxgenjs = resolvePackage("pptxgenjs");
const jszip = resolvePackage("jszip");
const pptxgenjsVersion = packageVersion(pptxgenjs);
const jszipVersion = packageVersion(jszip);
const pptxgenjsLocked = pptxgenjsVersion === "4.0.1";
const jszipLocked = jszipVersion === "3.10.1";
const libreoffice = executable(["soffice", "libreoffice"]);
const fontFiles = [
  "NotoSansCJKsc-Regular.otf",
  "NotoSansCJKsc-Bold.otf",
].map((name) => path.join(skillDir, "assets", "fonts", "otf", name));
const fontsPresent = fontFiles.every((file) => fs.existsSync(file));

let selectedEngine = "none";
let capability = "unavailable";
if (artifactTool && jszipLocked) {
  selectedEngine = "artifact-tool";
  capability = "L1";
} else if (pptxgenjsLocked && jszipLocked) {
  selectedEngine = "pptxgenjs";
  capability = libreoffice ? "L1" : "L2";
}

const result = {
  runtime: artifactTool ? "openai-cloud" : "local-portable",
  selectedEngine,
  capability,
  node: process.execPath,
  nodeVersion: process.version,
  artifactTool,
  pptxgenjs,
  pptxgenjsVersion,
  pptxgenjsLocked,
  jszip,
  jszipVersion,
  jszipLocked,
  libreoffice,
  fontsPresent,
  fontFiles,
  ready: selectedEngine !== "none" && fontsPresent,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  for (const [key, value] of Object.entries(result)) {
    process.stdout.write(`${key}: ${Array.isArray(value) ? value.join(", ") : value ?? "not found"}\n`);
  }
}

if (!result.ready) process.exitCode = 2;
