# Grilling protocol

Use this protocol only inside the scope declared by the calling stage. A settled upstream decision is a prerequisite, not a question to reopen.

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask now without guessing at answers you have not heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format every question as:

```text
❓ **Q1** - **<question title>**: <question body, choices, and impact>

➡️ <recommended answer and why>
```

Each answer reshapes the tree. Recompute the frontier after every round. A question whose answer depends on another open question belongs to a later round.

Finding facts is the Agent's job, never the user's. Read supplied material and inspect the environment before asking. When a frontier question needs independent research and the runtime supports subagents, dispatch a bounded subagent and continue with the rest of the frontier. Ask the user only for decisions, private facts that are not present, or inaccessible internal material.

The session ends only when the frontier is empty: every decision in the calling stage has been visited and nothing remains silently assumed. Summarize the shared understanding and request explicit confirmation. Do not start the next stage until the user confirms.

## Scope discipline

- In `$huawei-deck`, grill project intent: audience, occasion, reader-state change, core claim, objections, scope, evidence, sensitivities, success criteria, delivery, and material priority.
- In `$huawei-deck-script`, grill only unresolved page-level choices within the confirmed outline: claim boundary, evidence choice, sensitive wording, visual carrier, internal material, and fallback treatment.
- Treat confirmed upstream artifacts as fixed. If new evidence invalidates one, stop and route back to the earliest affected stage.
- Combine decisions that share prerequisites. Never ask one question per slide mechanically.
