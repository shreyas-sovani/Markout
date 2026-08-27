# AGENTS.md — Root Instructions

This file is the canonical source of instructions for any AI coding agent working in this repository (Cursor, Codex, Claude Code, or any other tool that reads AGENTS.md natively or via import). If you are an agent reading this: read this file fully before doing anything else, then read the AGENTS.md in every directory you are about to touch.

---

## 0. Project Context

*Read PRD in docs/prd/markout.md*

### Things actively in flux right now

- Code stable: `forge test` 43/43 (engine unit+fuzz, integration+attack, invariant fuzz, canonical-Sepolia fork). Canonical-PM deployment live and Etherscan-verified (2026-08-27: hook `0x027C6cfD540f0446641846cd004b41561EEd70cC`, router `0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF`, faucet tokens `0x7B0B…`/`0xf3df…`; proof pack = 1:1 next-block reversion refunded AT SETTLE + donate/flush). All prior deployments are stale.
- Product polish pass done (2026-08-27): README/demo.md rewritten in product voice (LP-first, `No partner integrations`, honest limits, numbers out of the headline); frontend redesigned as a hydrographic chart-recorder around "The 24-second memory" instrument — same wiring, `next build` green, SSR click-path elements verified.
- Remaining human work: demo video (hole left in README + UI), hosted URL (hole left), final submission. Uncommitted polish work awaits review.

---

## 1. The Directory Documentation Protocol (mandatory, every task)

This is the core operating rule. It is not optional and does not depend on task size.

### 1.1 Trigger

Before you report a task as complete, for **every directory where you created, modified, or deleted files during this task**, you must create or update that directory's `AGENTS.md`. This happens before you hand control back, not as a follow-up the user has to ask for.

If a directory you touched does not yet have an `AGENTS.md`, create one using the template in Section 1.3. Do not skip directories because the change felt small; a one-line fix still changes "latest changes" and may still change "why."

### 1.2 What "detailed enough" means

The bar is: **a different agent, with zero prior context, starting a fresh session, reads only this directory's AGENTS.md (plus the root file) and can correctly continue the work without re-deriving anything by reading the whole diff history.**

That means every subdirectory AGENTS.md must answer, concretely, not generically:

- **Ownership**: who or what owns this code conceptually (which subsystem, which responsibility boundary). Not a person's name unless the project genuinely tracks that; think "this belongs to the billing subsystem" not "Shreyas wrote this."
- **Purpose**: what this directory does, in concrete terms, not "utility functions" but "rate-limiting middleware for the public API gateway."
- **What it controls**: what breaks, changes behavior, or becomes inconsistent if this directory's code is wrong or removed. Name the actual downstream effect.
- **Connections**: what this directory imports/depends on, and what depends on it. Name actual paths/modules, not "various parts of the app."
- **Latest changes**: what changed most recently, in this task, with enough specificity that "what changed" is unambiguous (function/file level, not "improved logic").
- **Why this approach, why not the alternative**: the actual decision and the actual rejected alternative(s), with the real reason. "Chose X because Y constraint ruled out Z" is useful. "Chose X because it's better" is not and should not be written.
- **Known gotchas / things not to touch casually**: anything non-obvious that has already burned time once, so it doesn't burn time twice.

If you cannot fill a section with something concrete, write "Not yet determined" rather than inventing filler. Filler is worse than an honest gap because a future agent will trust it.

### 1.3 Subdirectory AGENTS.md Template

Copy this structure exactly when creating a new subdirectory AGENTS.md. Keep section headers stable so agents can scan for them predictably across the whole repo.

```markdown
# AGENTS.md — [directory path]

## Ownership
[Which subsystem/responsibility this belongs to.]

## Purpose
[What this directory does, concretely.]

## What This Controls
[What breaks or changes behavior downstream if this is wrong/removed/changed.]

## Connections
- Depends on: [actual modules/files/services this imports or calls]
- Depended on by: [actual modules/files/services that import or call this]
- External systems touched: [DBs, APIs, queues, etc., if any]

## Current State
[Working / partially implemented / known broken in X way / deliberately stubbed, etc.]

## Decision Log
[Reverse chronological. Each entry: date, what changed, why this approach, why not the alternative(s) considered, who/what task made the call.]

### [YYYY-MM-DD] — [short title]
- **Change**: [what actually changed, file/function level]
- **Reasoning**: [why this approach]
- **Rejected alternative(s)**: [what else was considered and why it was ruled out]
- **Task/session**: [brief pointer to what prompted this, e.g. "fixing race condition in webhook retry"]

## Known Gotchas
[Non-obvious traps, past mistakes, things that look wrong but are intentional, or vice versa.]
```

### 1.4 Updating vs. rewriting

When a directory's AGENTS.md already exists:

- Append a new entry to **Decision Log** rather than deleting old entries. History is the point.
- Overwrite **Ownership**, **Purpose**, **What This Controls**, **Connections**, and **Current State** in place if they are now inaccurate. These should always reflect the present, not the past.
- Never let **Decision Log** grow unbounded without limit if it starts hurting readability. Once it passes roughly 15–20 entries, collapse the oldest ones into a one-paragraph summary block at the bottom titled "Earlier history (condensed)" and keep the recent ones in full.

---

## 2. Cross-Tool Notes

- **Codex**: resolves the nearest AGENTS.md to the file being edited. In a monorepo, this means the most specific subdirectory file wins for local conventions; this root file still applies for global rules like Section 1.
- **Cursor**: reads `.cursor/rules/*.mdc`. That file should point back to this AGENTS.md rather than duplicating it, so there is one source of truth. If `.cursor/rules/` content and this file ever disagree, this file wins; fix the drift.
- **Claude Code**: reads `CLAUDE.md`, which imports this file via `@AGENTS.md`. See root `CLAUDE.md` for anything Claude Code–specific.

Do not fork instructions per tool. If a tool needs something extra, add a small tool-specific file that imports/references this one; never copy-paste and let copies diverge.

---

## 3. Session Handoff Protocol

Used when a human is about to run out of context window on the current agent session and is starting a fresh one.

1. Finish the current unit of work to a clean, working state. Do not leave code half-edited mid-function.
2. Run the Section 1 protocol: update every AGENTS.md for every directory touched in this session, even if the session covered multiple unrelated tasks.
3. In the root AGENTS.md's **Section 0 → "Things actively in flux right now"**, update this list to reflect what's genuinely mid-flight so the next agent doesn't assume something is finished when it isn't.
4. Commit. The documentation update must be part of the same commit as the code change it describes, not a separate "docs" commit later, so git history and doc history never diverge.
5. When starting the next session, the human will point the new agent at the root AGENTS.md plus the specific subdirectory AGENTS.md files relevant to the next task. The new agent should read those before writing any code.

---

## 4. Global Conventions
Build: Use forge build to compile the Solidity smart contracts.  Test: Use forge test to run the Foundry suite, asserting observable outcomes through module interfaces (e.g. organicQuiet_refundsBond, exactOut_chargesInputBondAndFillsOutput, and swapTooSmall_reverts).  Lint/format: Use forge fmt for standard Solidity formatting.Branch/commit conventions: All commits must be made to a public GitHub repository on the correct branch to satisfy the binary qualifications for judging.  Disclosures detailing that the mean-reversion oracle is entirely hook-local (pool's own prices + hook accumulator, no external oracle partner) must stay in the README.
---

## 5. What Never Goes in These Files

No secrets, API keys, credentials, tokens, internal URLs meant to stay private, or customer data in any AGENTS.md or CLAUDE.md, anywhere in the tree. These files are committed to git. Use environment variables and a secrets manager for anything sensitive, and reference their existence generically ("reads DB credentials from env") without values.