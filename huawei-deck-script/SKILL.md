---
name: huawei-deck-script
description: Research evidence, resolve page-level decisions through grilling, and create an explicitly approved information-axis plus visual-axis page script for a Huawei-style presentation. Use only after the outline gate is confirmed.
---

# Huawei deck page script

Complete research, scoped page-intent confirmation, and the full page script. Stop after explicit script approval and point to `$huawei-deck-build`; do not generate a PPTX.

## Load

Read completely:

- `../_shared/references/grilling-protocol.md`
- `../_shared/references/project-state.md`
- `../_shared/references/stage-contracts.md`
- `../_shared/references/content-logic.md`
- `../_shared/references/language-and-confirmation.md`
- `references/research-and-sources.md`
- `references/page-script-examples.md`

## Preconditions

Require a current confirmed `intent.md` and `outline.md`. If either fingerprint is stale, route to the earliest affected skill.

## Workflow

1. Turn outline research questions into bounded work packets. Use supplied materials first, then high-trust primary sources. Browse whenever claims are current, external, uncertain, or citation-sensitive.
2. When subagents are available, dispatch at most three in parallel by research question or coherent chapter. Require compact evidence cards; never merge raw search transcripts into the main context.
3. Write `evidence-cards.md`. Distinguish fact, inference, recommendation, conflict, and executable internal placeholder.
4. Run the page-level scope of the grilling protocol across every unresolved decision whose prerequisites are settled. Group common choices. Present recommended answers grounded in the evidence cards.
5. When the page-level frontier is empty, summarize the intended claim, proof object, carrier, and unresolved material for every affected page; request explicit approval. Record `page-intent` confirmation before drafting final copy.
6. Write the complete `page-script.md` using the page-script contract and the dual-axis examples. Keep on-slide copy self-sufficient; place explanation, transitions, and full source links in notes. Use stable evidence and placeholder IDs.
7. Run the content-logic checks: argument continuity, claim-to-evidence support, fact boundaries, action mapping, capacity plausibility, and consistency with confirmed intent.
8. Fingerprint the review draft and evidence cards, register them in `deck-state.md`, and set `current_stage: script`, `status: pending`, `next_skill: huawei-deck-script`. Present the whole script for explicit approval. Revision feedback updates the pending fingerprints and keeps the gate pending.
9. After approval, fingerprint `page-script.md` and `evidence-cards.md`, record the confirmation, set `current_stage: script`, `status: confirmed`, and `next_skill: huawei-deck-build`.
10. Return the approved script summary, blocking placeholders, source coverage, and exact next action: use `$huawei-deck-build` with the absolute project root.

## Completion criterion

Finish only when every page has a supported title, complete visible copy/data, exactly one primary proof object, a buildable visual axis, traceable evidence or an executable placeholder, concise notes, and an approved current fingerprint. Do not create `slide-plan.json` or a PPTX.
