# Local portable adapter

Use for generic local Agent environments with Node.js. The default engine is exactly `pptxgenjs@4.0.1`; do not silently use a different version.

## Setup

1. Run `node scripts/check-environment.mjs --json`.
2. Resolve dependencies from the task workspace or a caller-provided `RUNTIME_NODE_MODULES` / `NODE_PATH`. If unavailable, direct the user to install from this skill's lock file; do not install packages without authorization.
3. Run `scripts/setup-fonts.sh --verify` when the host supports it.

## Build

```bash
node scripts/validate-slide-plan.mjs /absolute/project/slide-plan.json
node scripts/render-local.mjs --plan /absolute/project/slide-plan.json --output /absolute/project/intermediate.pptx --groups /absolute/project/semantic-groups.json
node scripts/patch-pptx-grouping.mjs --input /absolute/project/intermediate.pptx --output /absolute/project/final.pptx --groups /absolute/project/semantic-groups.json
```

`render-local.mjs` converts design pixels to inches at 96 px/in and uses points directly for text. It creates native text, shapes, tables, charts, connectors, images, and notes. It writes group membership separately because PptxGenJS does not provide the required semantic group contract.

## QA

- With LibreOffice: render every final slide, run structural tests, and inspect every page; capability can reach L1.
- Without LibreOffice: run structural tests, XML group/lock checks, source-note checks, font declarations, text extraction comparisons, and bounds checks; capability is L2.
- If a schema feature cannot be rendered natively, stop at L3 and obtain explicit acceptance. Do not rasterize the module as a shortcut.
