# Handover contract

A handover transfers confirmed state, not conversational history.

## Validate before handoff

1. Read `deck-state.md` and resolve every artifact path.
2. Confirm current fingerprints match approval records.
3. Mark missing or changed artifacts invalidated before recommending a next skill.
4. Identify the earliest valid next stage.
5. Detect the current runtime only; let the target runtime detect its own build engine.

## Handover output

Produce a compact block containing:

- absolute project root;
- project ID and current valid stage;
- confirmed intent and narrative digest, each no more than five bullets;
- current artifact paths and fingerprints;
- open blocking items and invalidated artifacts;
- exact next skill and a one-sentence invocation prompt;
- source and material pointers the next stage must read;
- current runtime and build capability, labeled as current-environment facts.

Do not copy full artifacts into the handover message. Do not decide content, repair artifacts, or advance state. If the target cannot access the same filesystem, package the project directory only when the user explicitly requests a transferable archive.
