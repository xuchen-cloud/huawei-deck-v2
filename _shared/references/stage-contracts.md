# Stage artifact contracts

## Materials index

`materials-index.md` inventories supplied files without loading every file in full. For each item record absolute path, format, provenance, authority, relevant topics, must-preserve content, sensitivities, extraction status, and which stage should read it deeply.

## Intent brief

`intent.md` records only confirmed project decisions:

- purpose, audience, occasion, duration, expected page range;
- reader state before and after reading;
- one-sentence thesis and desired decision or action;
- must cover, explicit exclusions, appendix boundary;
- stance, objections, sensitivities, terminology;
- evidence standard, source priority, internal material needs;
- density, language, editability, delivery requirements;
- measurable acceptance criteria;
- unresolved candidates clearly separated from confirmed intent.

## Outline

`outline.md` contains the narrative, page count, page tasks, research plan, and appendix boundary. Each page includes:

- page number and narrative role;
- provisional conclusion title;
- required information and proof object;
- research question and source priority;
- internal material or executable placeholder;
- transition from previous and into next page;
- supported decision, recommendation, or action when applicable.

The title sequence must read as a coherent argument. An outline is not page copy or visual implementation.

An executable placeholder has a stable ID, owner or owner role, requested material, minimum acceptable format and fields, intended page or claim, blocking level, fallback treatment, and the action to take when the material arrives. Use exactly `blocking` when the title, evidence, or build cannot be finalized without it, and `non-blocking` when an explicit fallback is already approved. Never write a bare “TBD” or “screenshot pending.”

## Evidence cards

`evidence-cards.md` stores compact findings, not search transcripts. Each card has a stable ID, supported page/claim, fact summary, primary URL or supplied-file locator, date/version, evidence strength, boundary, conflicts, verification date, and proposed use. Separate fact, inference, recommendation, and internal placeholder.

## Page script

`page-script.md` is the approved information and visual contract. Each page contains:

```markdown
## P03 <final supported title>

### Narrative role
- task / previous-page response / next-page setup

### Information axis
- core claim
- information relationship
- complete on-slide copy
- table or chart data and labels
- evidence IDs and source locators
- inference or recommendation
- internal placeholders with stable ID, owner, format, blocking level, and replacement action
- concise speaker notes or full talk track when requested

### Visual axis
- exactly one primary proof object
- page type and carrier
- layout regions and reading order
- focus and emphasis
- native editability and semantic groups
- capacity budget and overflow response

### Blocking decisions
- only items that prevent the title, evidence, or build
```

The deck must remain understandable without speaker notes. Notes explain, transition, and preserve source detail; they do not carry missing reasoning.

## Slide plan

`slide-plan.json` is an engine-neutral scene plan generated only from a confirmed page script. Its schema lives in `$huawei-deck-build/references/slide-plan-schema.md`. It contains exact geometry, tokens, native object semantics, data, notes, source blocks, and semantic groups. Engine adapters render it; they do not redesign it.
