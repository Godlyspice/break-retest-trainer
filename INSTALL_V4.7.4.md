# Futures Academy v4.7.4 — Manual Beginner Placement & Mobile Zoom

This is a cumulative release based on the fixed v4.7.3 build.

## Beginner Mode changes

Beginner Mode no longer automatically chooses Entry, Stop-loss, or
Take-profit.

After selecting Buy or Sell:
1. A compact manual placement menu opens.
2. Select Entry.
3. Tap the chart to place it.
4. Select Stop-loss and place it.
5. Select Take-profit and place it.
6. Fine-tune the active level with +/- one tick.
7. Submit only after all three levels are placed.

Selecting Wait opens a simple no-trade explanation instead because a
Wait decision has no Entry, Stop, or Take-profit.

Beginner Mode still automatically uses one MES contract so new traders
can concentrate on chart reading and level placement.

## Mobile chart changes

- Added Zoom Out / Fit / Zoom In controls.
- Zoom range: 70% to 140%.
- Placed Entry, Stop, and Target are now included in chart price scaling,
  preventing markers from being drawn outside the visible chart.
- Added more mobile chart height.
- Mobile chart placement tray now works in Beginner and Advanced modes.
- Entry -> Stop -> Target auto-advance remains available in the chart tray.

## Help icon fix

Question-mark hint buttons now force a true 20x20 circle, including
min-height overrides so global button styles cannot stretch them into ovals.

## Install

1. Back up your current project.
2. Extract this ZIP.
3. Copy everything inside the extracted folder.
4. Paste into your existing project root.
5. Choose Merge and Replace.
6. Commit:
   `Add manual beginner placement and mobile chart zoom`
7. Push to GitHub and let Vercel deploy.

No Supabase SQL is required.
