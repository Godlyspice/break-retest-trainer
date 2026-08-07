# Futures Academy v4.7.3 — Mobile Chart Placement

This cumulative release is based on v4.7.2 Dual Mode Simulator.

## What changed

Advanced Mode on screens 820px wide or smaller now includes a mobile chart
placement tray directly underneath the chart.

### New mobile workflow

1. Choose Buy or Sell.
2. The chart placement tray opens automatically.
3. Entry is selected automatically.
4. Tap the chart to place Entry.
5. The tray automatically advances to Stop.
6. Tap the chart to place Stop.
7. It automatically advances to Target.
8. Tap the chart to place Target.
9. Review the displayed bracket and risk/reward.
10. Tap Review & submit to jump directly to the order ticket.

The tray also includes:
- Entry / Stop / Target values
- Active marker highlighting
- ±1 tick adjustments
- Reset bracket
- Placement progress indicator
- Bracket-complete state
- R:R preview

Desktop Advanced Mode is unchanged.
Beginner Mode is unchanged.

## Install

1. Back up the current project folder.
2. Extract this ZIP.
3. Copy everything inside the extracted folder.
4. Paste into your existing project root.
5. Choose Merge and Replace.
6. Commit:
   `Improve mobile chart order placement`
7. Push to GitHub and let Vercel deploy.

No Supabase SQL is required.
