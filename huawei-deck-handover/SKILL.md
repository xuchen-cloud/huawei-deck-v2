---
name: huawei-deck-handover
description: Validate and hand off a staged Huawei presentation project across tasks, agents, or OpenAI-cloud and local environments, or resume an interrupted project without reopening settled decisions.
---

# Huawei deck handover

Transfer state only. Do not research, decide content, repair artifacts, advance a gate, or build a presentation.

## Load

Read completely:

- `../_shared/references/project-state.md`
- `../_shared/references/handover-contract.md`
- `../_shared/references/stage-contracts.md`

## Workflow

1. Require an absolute project root and read `deck-state.md`.
2. Resolve every artifact path and verify fingerprints against confirmation records.
3. Mark missing or changed artifacts invalidated and identify the earliest valid next stage. Do not edit stage artifacts.
4. Detect and record only the current runtime. Do not assume the target runtime has the same engine or capability.
5. Produce the compact handover block defined in the contract, including the exact next skill and invocation prompt.
6. If the user explicitly requests transfer to a filesystem that cannot access the project root, create a portable archive containing project artifacts but excluding temporary renders, dependency directories, and secrets.

## Completion criterion

Finish when another Agent can continue from the named absolute project root or requested archive using only the handover block and current artifacts, without relying on hidden conversation context.
