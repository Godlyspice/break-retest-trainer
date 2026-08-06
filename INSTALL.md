# Futures Academy v2.1.8 — Career Live Progress Sync

Career now queries the current Supabase profile whenever the Career tab opens.
Admin-granted XP and Reputation no longer require a simulator trade.

## Install

Replace:

- components/FuturesAcademy.tsx

Then append the contents of:

- app/career-live-sync.css

to the bottom of your existing:

- app/globals.css

Do not replace globals.css with career-live-sync.css.

No Supabase migration is required.
