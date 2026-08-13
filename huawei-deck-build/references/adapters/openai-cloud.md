# OpenAI cloud adapter

Use when the Presentations skill and `@oai/artifact-tool` are available.

1. Load and follow the installed Presentations skill completely. Its hard implementation, runtime, rendering, citation, and delivery requirements apply.
2. Treat Huawei styling as an explicit custom visual direction. Do not use Codex Grid or another default theme.
3. Use a temporary writable build directory. Make the runtime's Node packages resolvable exactly as directed by the Presentations skill.
4. Render `slide-plan.json` with `scripts/render-openai.mjs` or an equivalent generated `.mjs` that preserves the schema mappings. Geometry remains in design pixels. Convert `fontPt` to CSS pixels with `pt × 96 / 72`.
5. Use native shape, table, chart, image, connector, and speaker-note APIs. Preserve stable element names.
6. Export a PNG and layout JSON for every slide, inspect every slide at full size, then export PPTX.
7. Use native group APIs when available; otherwise apply `patch-pptx-grouping.mjs` from the plan's explicit group membership.

If the installed Presentations skill contradicts a Huawei aesthetic default, keep the Huawei design. If it imposes a hard technical requirement, follow it and record any visible deviation in the migration or QA report.
