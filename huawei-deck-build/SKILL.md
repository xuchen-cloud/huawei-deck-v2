---
name: huawei-deck-build
description: Convert an approved Huawei deck page script into an engine-neutral slide plan, render a native editable PPTX in OpenAI cloud or a portable local Node environment, and complete visual, structural, content, and source QA.
---

# Huawei deck build

Build only from a confirmed page script. Treat content decisions as immutable. Route semantic problems upstream; resolve font, color, spacing, alignment, and other implementation details locally.

## Load

Read completely before building:

- `../_shared/references/project-state.md`
- `../_shared/references/stage-contracts.md`
- `references/visual-system.md`
- `references/template-pages.md`
- `references/slide-plan-schema.md`
- `references/engine-routing.md`
- `references/pptx-build-and-qa.md`
- `references/asset-catalog.md` when a page needs a supplied visual asset, the page script specifies a key relationship component such as an arrow, stage band, ring, or architecture boundary, or the user asks to follow Huawei visual references

## Preconditions

Require current confirmed intent, outline, page-intent, and page-script fingerprints. If any is absent or stale, stop and route to the earliest affected skill.

## Workflow

1. Run `scripts/check-environment.mjs --json`. Select exactly one engine for the build and record its capability level.
2. Convert the approved script into `slide-plan.json`. Apply the visual system and page-type catalog; use exact 16:9 geometry, design tokens, native object semantics, source notes, and semantic group declarations. For each key relationship component named in the visual axis, inspect the relevant approved Huawei reference or catalog asset before designing it. Reuse a suitable native component when available; otherwise redraw it with native shapes using the reference's color, weight, and geometry language, and record the absence of a reusable source component plus the resulting implementation in the deviation log. The slide plan is the cross-engine source of visual truth.
3. Validate the plan with `scripts/validate-slide-plan.mjs`. Capacity failure routes to a more efficient carrier, appendix, or upstream-approved split; never shrink below token floors.
4. Render through the selected adapter:
   - `openai-cloud`: load and follow the installed **Presentations** skill, use `@oai/artifact-tool`, and read `references/adapters/openai-cloud.md`.
   - `local-portable`: use locked PptxGenJS dependencies and `references/adapters/local-portable.md`.
5. When subagents are available, use at most three for independent asset preparation, data normalization, or QA. One main builder owns `slide-plan.json`, the final source module, and final PPTX assembly.
6. Apply semantic grouping with the engine's native group API or `scripts/patch-pptx-grouping.mjs` from an explicit member manifest. Never infer groups from geometric proximity.
7. Execute every required QA pass. Run `scripts/inspect-pptx.mjs` against the final PPTX and plan. Render and inspect every slide for L1. For L2, complete structural QA and clearly record the missing render verification. L3 requires explicit user acceptance before generation.
8. Write `qa-report.md`, update `sources.md`, set the delivered artifact and capability in `deck-state.md`, and record `current_stage: delivered`, `status: confirmed`, `next_skill: none` only after all applicable gates pass.
9. Deliver the final PPTX, sources ledger, stage artifacts, and concise QA result. Keep scratch builders, renders, and intermediates in the temporary build directory.

## Performance budget

For a typical approved 15-slide script with sources and assets already resolved, target a reviewable L1 draft within 10–15 minutes of automatic build time. Spend that budget on plan synthesis, native rendering, and full-slide QA—not on reopening confirmed decisions or loading unused template bundles. Parallelize only bounded asset preparation, data normalization, and QA; keep one assembler. If a blocked asset, renderer, or structural defect makes the target unlikely, report the specific cause and continue toward correctness rather than silently skipping QA.

## Completion criterion

Finish only when the final PPTX opens cleanly; contains native editable text, shapes, tables, and charts where required; matches the approved script; has traceable notes and sources; passes every applicable QA item; and records every cross-engine deviation. A screenshot-per-slide PPTX never satisfies this criterion.
