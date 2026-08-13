#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadJsZip() {
  try {
    return require("jszip");
  } catch (localError) {
    const roots = [
      process.cwd(),
      process.env.RUNTIME_NODE_MODULES,
      process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,
      process.env.NODE_PATH,
    ].filter(Boolean);
    for (const root of roots) {
      try {
        return require(require.resolve("jszip", { paths: [root] }));
      } catch {}
    }
    throw new Error(
      "Cannot load jszip. Install this skill's locked dependencies or set RUNTIME_NODE_MODULES.",
      { cause: localError },
    );
  }
}

const JSZip = loadJsZip();

function usage() {
  return [
    "Usage:",
    "  node patch-pptx-grouping.mjs --input input.pptx --output output.pptx --groups groups.json",
    "",
    "groups.json:",
    '  {"slides":[{"slide":1,"groups":[{"name":"Module A","members":["BG","TITLE"]}]}]}',
  ].join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  for (const required of ["input", "output", "groups"]) {
    if (!args[required]) throw new Error(`Missing --${required}\n\n${usage()}`);
  }
  return args;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function removeGroupingLocks(xml) {
  return xml.replace(/\s(?:noGrp|noUngrp)="(?:1|true)"/g, "");
}

function objectNodes(xml) {
  const pattern = /<p:(sp|pic|cxnSp|graphicFrame)\b[\s\S]*?<\/p:\1>/g;
  return [...xml.matchAll(pattern)].map((match) => ({
    xml: match[0],
    start: match.index,
  }));
}

function namedObject(xml, name) {
  const marker = `name="${escapeXml(name)}"`;
  const matches = objectNodes(xml).filter((node) => node.xml.includes(marker));
  if (matches.length !== 1) {
    const available = [
      ...xml.matchAll(/<p:cNvPr\b[^>]*\bname="([^"]*)"/g),
    ].map((match) => match[1]);
    throw new Error(
      `Expected one object named ${name}, found ${matches.length}. Available: ${available.join(", ")}`,
    );
  }
  return matches[0];
}

function boundsOf(nodeXml, name) {
  const transform = nodeXml.match(
    /<(?:a|p):xfrm\b[^>]*>[\s\S]*?<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"[^>]*\/>[\s\S]*?<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"[^>]*\/>/,
  );
  if (!transform) throw new Error(`Cannot derive bounds for ${name}`);
  const [x, y, cx, cy] = transform.slice(1).map(Number);
  return { x, y, cx, cy };
}

function unionBounds(nodes, names) {
  const bounds = nodes.map((node, index) => boundsOf(node.xml, names[index]));
  const x = Math.min(...bounds.map((item) => item.x));
  const y = Math.min(...bounds.map((item) => item.y));
  const right = Math.max(...bounds.map((item) => item.x + item.cx));
  const bottom = Math.max(...bounds.map((item) => item.y + item.cy));
  const cx = right - x;
  const cy = bottom - y;
  if (cx <= 0 || cy <= 0) throw new Error("A group must have positive width and height");
  return { x, y, cx, cy };
}

function nextObjectId(xml) {
  const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map((match) => Number(match[1]));
  return Math.max(1, ...ids) + 1;
}

function groupXml({ id, name, bounds, members }) {
  const { x, y, cx, cy } = bounds;
  return [
    '<p:grpSp xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">',
    "<p:nvGrpSpPr>",
    `<p:cNvPr id="${id}" name="${escapeXml(name)}"/>`,
    "<p:cNvGrpSpPr/>",
    "<p:nvPr/>",
    "</p:nvGrpSpPr>",
    "<p:grpSpPr>",
    "<a:xfrm>",
    `<a:off x="${x}" y="${y}"/>`,
    `<a:ext cx="${cx}" cy="${cy}"/>`,
    `<a:chOff x="${x}" y="${y}"/>`,
    `<a:chExt cx="${cx}" cy="${cy}"/>`,
    "</a:xfrm>",
    "</p:grpSpPr>",
    ...members.map((member) => member.xml),
    "</p:grpSp>",
  ].join("");
}

function wrapNamedObjects(xml, group) {
  if (!group?.name || !Array.isArray(group.members) || group.members.length < 2) {
    throw new Error("Each group needs a name and at least two member names");
  }
  if (new Set(group.members).size !== group.members.length) {
    throw new Error(`Group ${group.name} contains duplicate member names`);
  }

  const members = group.members.map((name) => namedObject(xml, name));
  const bounds = unionBounds(members, group.members);
  const id = nextObjectId(xml);
  const anchor = members.reduce((earliest, member) => (member.start < earliest.start ? member : earliest));
  const placeholder = `__PPTX_NATIVE_GROUP_${Date.now()}_${Math.random().toString(16).slice(2)}__`;

  let nextXml = xml.replace(anchor.xml, placeholder);
  for (const member of members) {
    if (member !== anchor) nextXml = nextXml.replace(member.xml, "");
  }

  const nativeGroup = groupXml({
    id,
    name: group.name,
    bounds,
    members,
  });
  return nextXml.replace(placeholder, nativeGroup);
}

function validateConfig(config) {
  if (!config || !Array.isArray(config.slides)) {
    throw new Error('Group configuration must contain a "slides" array');
  }
  const seenSlides = new Set();
  for (const entry of config.slides) {
    if (!Number.isInteger(entry.slide) || entry.slide < 1) {
      throw new Error(`Invalid slide number: ${entry.slide}`);
    }
    if (seenSlides.has(entry.slide)) throw new Error(`Duplicate slide entry: ${entry.slide}`);
    seenSlides.add(entry.slide);
    if (!Array.isArray(entry.groups)) throw new Error(`Slide ${entry.slide} needs a groups array`);
    const seenMembers = new Set();
    for (const group of entry.groups) {
      if (!Array.isArray(group.members)) continue;
      for (const member of group.members) {
        if (seenMembers.has(member)) {
          throw new Error(`Slide ${entry.slide} reuses group member: ${member}`);
        }
        seenMembers.add(member);
      }
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const config = JSON.parse(await fs.readFile(path.resolve(args.groups), "utf8"));
  validateConfig(config);

  const zip = await JSZip.loadAsync(await fs.readFile(inputPath));
  const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  let removedLocks = 0;

  for (const slidePath of slideFiles) {
    const original = await zip.file(slidePath).async("string");
    const unlocked = removeGroupingLocks(original);
    removedLocks += (original.match(/\s(?:noGrp|noUngrp)="(?:1|true)"/g) || []).length;
    zip.file(slidePath, unlocked);
  }

  let createdGroups = 0;
  for (const slideConfig of config.slides) {
    const slidePath = `ppt/slides/slide${slideConfig.slide}.xml`;
    const slideFile = zip.file(slidePath);
    if (!slideFile) throw new Error(`Presentation has no slide ${slideConfig.slide}`);
    let xml = await slideFile.async("string");
    for (const group of slideConfig.groups) {
      xml = wrapNamedObjects(xml, group);
      createdGroups += 1;
    }
    zip.file(slidePath, xml);
  }

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath).async("string");
    if (/\s(?:noGrp|noUngrp)="(?:1|true)"/.test(xml)) {
      throw new Error(`Grouping lock remains in ${slidePath}`);
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  await fs.writeFile(outputPath, bytes);
  process.stdout.write(
    `${outputPath}\nCreated native groups: ${createdGroups}\nRemoved grouping locks: ${removedLocks}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
