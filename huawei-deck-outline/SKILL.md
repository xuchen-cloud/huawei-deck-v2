---
name: huawei-deck-outline
description: Create and confirm the narrative, page sequence, page tasks, and research plan for a Huawei-style presentation from an approved intent brief. Use only after the huawei-deck intent gate is confirmed.
---

# Huawei deck outline

Complete only the outline stage. Stop after approval and point to `$huawei-deck-script`; do not perform full research, write final page copy, choose exact geometry, or build a PPTX.

## Load

Read completely:

- `../_shared/references/project-state.md`
- `../_shared/references/stage-contracts.md`
- `../_shared/references/content-logic.md`
- `../_shared/references/language-and-confirmation.md`

## Preconditions

Require an absolute project root and a current `intent.md` whose fingerprint matches an `intent` confirmation in `deck-state.md`. If the gate is absent or stale, stop and route to `$huawei-deck`.

## Workflow

1. Read the confirmed intent and `materials-index.md`. Deep-read only materials needed to design the story or test evidence availability.
2. Write the one-sentence argument: question → evidence order → desired judgment or action.
3. Select the narrative structure from the communication job, not from a template category.
4. Draft `outline.md` using the outline contract. Give every page exactly one narrative task and one planned primary proof object. Keep titles provisional when evidence is not yet verified.
5. Perform only evidence-availability preflight. When the runtime supports subagents, use up to three bounded checks for high-risk evidence questions; return only availability, likely primary sources, conflicts, and fallback paths.
6. Check that the title sequence forms a complete argument, all promised questions are answered, recommendations map to evidence, and body/appendix/exclusion boundaries are explicit.
7. Fingerprint the review draft, register it in `deck-state.md`, and set `current_stage: outline`, `status: pending`, `next_skill: huawei-deck-outline`. Present the page sequence, research boundary, internal-material needs, and page count. Request explicit approval. Revision feedback updates the pending fingerprint and keeps the gate pending.
8. After approval, fingerprint the final `outline.md`, record the confirmation, set `current_stage: outline`, `status: confirmed`, and `next_skill: huawei-deck-script`.
9. Return the approved outline summary and exact next action: use `$huawei-deck-script` with the absolute project root.

## Completion criterion

Finish only when every page has a distinct role, required proof, research question, transition, and decision relationship; the title sequence reads coherently by itself; the current outline fingerprint is approved; and no final page copy or PPTX exists.
