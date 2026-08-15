# needs-triage: Markout

**Triage label:** `needs-triage`  
**Type:** PRD  
**Product:** Markout (UHI10 Fair Flow / MEV protection + Reactive Network)  
**Canonical PRD:** [docs/prd/markout.md](../docs/prd/markout.md)

## Summary

Uniswap v4 hook that fills immediately at 3 bps, escrows a capped refundable toxicity bond, and true-ups after TWAP markout over T via a Reactive Cron1 callback. Organic flow is refunded; toxic continuation is donated to in-range LPs. Demo on Ethereum Sepolia + Lasna (official Reactive origin/destination). Unichain Sepolia is not a Reactive destination.

## Publish note

Local backlog stub only. No Linear/GitHub/matt-pocock backlog backend was configured in this workspace. Run `/setup-matt-pocock-skills` (or configure backlog tooling), then re-publish with triage label `needs-triage`.

## Confirm with user

1. Proposed modules list in the PRD “Major modules” / “Modules checklist”
2. Proposed modules for tests in the same checklist
3. Chain lock: Ethereum Sepolia + Lasna for dual-track (not Unichain Sepolia)
