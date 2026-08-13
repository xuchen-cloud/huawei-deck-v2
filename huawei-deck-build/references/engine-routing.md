# Build engine routing

Detect once at the start of `$huawei-deck-build`. A build uses one engine from plan validation through final export.

## Routes

| Route | Required capability | Adapter |
|---|---|---|
| `openai-cloud` | installed Presentations skill and resolvable `@oai/artifact-tool` | `adapters/openai-cloud.md` |
| `local-portable` | Node.js and locked `pptxgenjs@4.0.1` | `adapters/local-portable.md` |

Run `node scripts/check-environment.mjs --json`. Prefer `openai-cloud` when artifact-tool is present and the locked structural dependency is available. Otherwise use `local-portable` only when the exact locked PptxGenJS and JSZip versions are resolvable. A different installed version is unavailable, not “close enough”; install from `package-lock.json` or stop. Do not invent a new adapter during a deck build.

## Capability levels

- **L1**: native editable output, speaker notes and sources, structural validation, full-slide rendering, and every-slide visual inspection.
- **L2**: native editable output, notes and sources, structural validation, but no reliable full-slide render. State this prominently in the QA report.
- **L3**: a required native feature, source note, font, or structural guarantee is unavailable. Explain the exact deviation and obtain explicit user acceptance before generating.

An image-per-slide deck is below L3 and is never a valid result.

## Rendering

- OpenAI cloud: use the Presentations skill rendering and layout-export helpers.
- Local: prefer LibreOffice headless conversion to PDF or slide images, then inspect every page. If unavailable, structural checks may reach only L2.
- Use the supplied Noto CJK fonts for declared typography. If the renderer cannot resolve them, use an installed verified CJK font for rendering and record the difference; keep the PPTX declaration consistent or route to L3 when layout changes materially.

## Engine switching

Switching engines reuses confirmed intent, outline, evidence, page script, and slide plan. Re-render from the same plan and write a separate QA result. Never change narrative or page geometry to hide an adapter limitation.
