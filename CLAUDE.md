# CLAUDE.md — Root

@AGENTS.md

Everything in AGENTS.md applies to you in full, including Section 1 (the mandatory per-directory documentation protocol) and Section 3 (session handoff protocol). Do not treat this file as a lighter version of those rules.

## Claude Code–Specific Notes

- **Auto-memory is not a substitute for AGENTS.md updates.** Claude Code's built-in auto-memory (`~/.claude/projects/.../memory/`) is machine-local and not committed to git. It may help you personally within a session, but it does not count toward the Section 1 protocol. The subdirectory `AGENTS.md` files are the only durable, shareable record; write to those, not just to auto-memory.
- **Hierarchical loading**: you will load this file plus any `CLAUDE.md`/`AGENTS.md` from the working directory up to repo root automatically. Before starting work in a subdirectory, also explicitly open that subdirectory's `AGENTS.md` yourself if it wasn't auto-loaded, rather than assuming context is complete.
- **`/context` and `/memory`**: if you are unsure whether a directory's AGENTS.md actually loaded into this session, check rather than assume. Do not skip the Section 1 update because you assume you already "know" the directory from a prior session; the file must reflect the current state regardless of what's in your context.
- **End of task checklist, in order**:
  1. Confirm the code change is in a working, non-broken state.
  2. Update every touched directory's `AGENTS.md` per Section 1.
  3. If this session is ending (context near-exhausted or task boundary), run Section 3's handoff protocol before stopping.
  4. Only then report completion to the user.

## Local Overrides

If a subdirectory needs a Claude Code–only instruction that shouldn't apply to Codex or Cursor (rare — most instructions belong in AGENTS.md), use `CLAUDE.local.md` in that directory. This is gitignored by convention; do not put anything there that another agent or teammate needs to see, since it will not travel with the repo.