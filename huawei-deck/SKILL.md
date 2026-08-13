---
name: huawei-deck
description: Start a Huawei-style presentation project by inventorying supplied material, running a relentless intent interview, and recording an explicitly confirmed intent brief. Use only for the first stage of a new deck or a semantic reset of an existing deck.
---

# Huawei deck intent

Complete only the intent stage. Stop after explicit approval and point to `$huawei-deck-outline`; do not draft an outline, research the topic, write slide copy, or build a presentation.

## Load

Read these files completely before interviewing:

- `../_shared/references/grilling-protocol.md`
- `../_shared/references/project-state.md`
- `../_shared/references/stage-contracts.md`
- `../_shared/references/language-and-confirmation.md`

## Workflow

1. Resolve or create a project directory. Reuse an existing `deck-state.md` only after validating its project ID and artifact paths. For a new project, immediately create `deck-state.md` with `current_stage: intent`, `status: pending`, `next_skill: huawei-deck`, and no confirmation record.
2. Inventory every supplied file in `materials-index.md`. Extract titles, structure, provenance, must-preserve facts, sensitivities, and likely stage relevance. Use the appropriate document, spreadsheet, PDF, or presentation reader when available. Read deeply only where needed to understand intent.
3. Separate current-request facts from history, defaults, and inference. Treat the latter only as recommended candidates.
4. Run the project-level scope of the grilling protocol. Investigate accessible facts yourself. Do not conduct full industry, competitor, or evidence research; allow only feasibility checks that affect a user decision.
5. When the frontier is empty, present the complete proposed intent brief and request explicit approval. Revision feedback keeps the gate pending.
6. After approval, write `intent.md` using the intent contract. Update `deck-state.md`, fingerprint the approved artifact, record the confirmation, set `current_stage: intent`, `status: confirmed`, and `next_skill: huawei-deck-outline`.
7. Return the approved intent summary, artifact paths, open internal-material needs, and this exact next action: use `$huawei-deck-outline` with the absolute project root.

## Completion criterion

Finish only when every project-level decision branch is either confirmed, explicitly excluded, or recorded as a non-blocking candidate; the current `intent.md` fingerprint has an approval record; and no outline content has been created.
