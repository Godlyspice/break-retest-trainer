# Futures Academy v4.7.2 — Dual Mode Trading Simulator

This release is cumulative and is based on v4.7.1 Progressive Vault Emblems.

## Main changes

### Beginner Mode
- Default simulator interface.
- Focuses on only Buy / Sell / Wait.
- Simple three-step learning flow.
- Uses 1 MES contract automatically.
- Uses a market-order demonstration automatically.
- Builds a simple educational 2:1 entry / stop / target plan.
- Hides the dense order-ticket mechanics.
- Replaces detailed grading with beginner-friendly feedback.

### Advanced Mode
- Keeps the full simulator workflow.
- Contract quantity.
- Market / Limit / Stop orders.
- Manual Entry / Stop / Take-profit.
- Tick adjustment.
- Chart placement.
- Risk/reward brackets.
- Estimated P/L.
- Full grading breakdown.

### Scenario randomization
Main Simulator and Weakness Hunt now target approximately:
- 37.5% Buy
- 37.5% Sell
- 25% Wait

After a Wait scenario, the next mixed scenario has only about a 10% chance
of being another Wait.

Focused Fakeout Arena and Patience Protocol intentionally remain Wait-heavy
because that is the purpose of those training modes.

## Install

1. Back up the current project.
2. Extract this ZIP.
3. Copy everything inside the extracted folder.
4. Paste into the existing project root.
5. Choose Merge and Replace.
6. Commit:
   `Add beginner and advanced simulator modes`
7. Push to GitHub and let Vercel deploy.

No Supabase SQL is required.
