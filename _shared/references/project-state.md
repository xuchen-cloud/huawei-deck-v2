# Project state contract

Every project is initialized with one small control file, `deck-state.md`, before the first interview. A new file starts at `current_stage: intent`, `status: pending`, `next_skill: huawei-deck`, with no confirmation record. Stage artifacts are separate files; the state file points to them and records approvals and invalidation.

## Canonical project layout

```text
<project>/
├── deck-state.md
├── materials-index.md
├── intent.md
├── outline.md
├── evidence-cards.md
├── page-script.md
├── slide-plan.json
├── sources.md
├── qa-report.md
└── <project>.pptx
```

Only create an artifact when its stage reaches the corresponding output step. Keep intermediate build files in a temporary subdirectory.

## `deck-state.md` schema

```markdown
# Deck state

- project_id: <stable-kebab-id>
- project_root: <absolute-path>
- current_stage: intent | outline | page-intent | script | build | delivered
- status: pending | confirmed | invalidated | blocked
- next_skill: huawei-deck | huawei-deck-outline | huawei-deck-script | huawei-deck-build | none
- updated_at: <ISO-8601 with timezone>

## Environment
- runtime: openai-cloud | local-portable | unknown
- build_capability: untested | L1 | L2 | L3
- selected_engine: unselected | artifact-tool | pptxgenjs

## Artifacts
| artifact | path | state | fingerprint |
|---|---|---|---|
| materials | <absolute path> | current | <sha256 or unavailable> |
| intent | ... | pending/confirmed/invalidated | ... |

## Confirmations
| gate | artifact fingerprint | confirmed by | confirmed at | note |
|---|---|---|---|---|

## Open items
| id | owner | need | blocking level | affects | next action |
|---|---|---|---|---|---|

## Change log
| time | change | earliest affected stage | invalidated artifacts |
|---|---|---|---|
```

Use SHA-256 when the environment can compute it cheaply. Otherwise record `unavailable` and use the file path plus modification time. Never claim an artifact is confirmed if its current fingerprint differs from its confirmation record.

## State transitions

```text
intent pending -> intent confirmed
intent confirmed -> outline pending -> outline confirmed
outline confirmed -> page-intent pending -> page-intent confirmed
page-intent confirmed -> script pending -> script confirmed
script confirmed -> build pending -> delivered
```

Only an explicit user approval or an unambiguous equivalent changes `pending` to `confirmed`. Revision feedback keeps the gate pending.

## Pending drafts

As soon as a stage writes its reviewable draft, register that artifact and its current fingerprint, then set `current_stage` to that stage, `status: pending`, and `next_skill` to the same stage skill. Do not add a confirmation row. On revision, replace the pending fingerprint and append a change-log row. Only after explicit approval set `status: confirmed`, add the confirmation record, and advance `next_skill`.

## Invalidation

Route a semantic change to the earliest affected stage:

| Change | Earliest stage | Invalidate |
|---|---|---|
| audience, goal, scope, stance, success criterion | intent | outline through delivery |
| story order, page task, page count, research boundary | outline | page intent through delivery |
| claim, evidence, on-slide copy, visual carrier | script | slide plan through delivery |
| font, color, spacing, alignment, punctuation | build | current build only |

Record invalidation before editing. Preserve old files for traceability, but mark them invalidated and never use them as current inputs.
