# Futures Academy v2.0 Foundation — Installation

This ZIP is a drop-in upgrade for your existing Next.js project.

## 1. Extract into your project

Extract the ZIP and copy the included folders into the root of your
`break-retest-trainer` project.

Allow Windows to merge folders and replace:

- `components/FuturesAcademy.tsx`

The package also adds:

- `components/evaluations/`
- `components/leaderboards/`
- `hooks/useEvaluation.ts`
- `lib/evaluations.ts`
- `supabase/evaluation_engine_v200.sql`

## 2. Commit and push

Use this GitHub Desktop summary:

`Start Futures Academy v2 evaluation foundation`

Push to GitHub and wait for Vercel to reach Ready.

## 3. Run the database migration

Open:

`supabase/evaluation_engine_v200.sql`

Copy the entire file into a new Supabase SQL snippet and run it once.

The warning about destructive operations is expected because the script creates
database types, tables, policies, and functions. It does not delete users.

## 4. Test

- Open Command Center.
- Click `Start with $10K`.
- Confirm the evaluation modal.
- Confirm the top balance changes.
- Refresh the page.
- Check Starter, Growth, Pro, Elite, and Funded locks.
- Open Career and confirm the longer progression.
- Open both leaderboards and confirm they are empty.

## Included in this foundation

- Professional evaluation cards
- Start with $10K / $25K / $50K / $100K / $150K
- Profit targets
- Trailing drawdown
- Daily loss limits
- Consistency rules
- Contract caps
- Reputation locks
- Evaluation confirmation modal
- Supabase-backed active evaluations
- Local fallback for guests
- Empty real-user leaderboards
- Long-term XP and reputation progression

The next build will connect completed simulator trades to the evaluation rule
engine and automatically pass or fail accounts.


# v2.1 Live Evaluation + Pattern Recognition

After deploying this update, run:

`supabase/evaluation_engine_v210.sql`

in Supabase SQL Editor.

Then test:

1. Start a Starter Evaluation.
2. Complete a correct simulator trade.
3. Confirm the Evaluation HUD balance increases.
4. Submit an incorrect trade and confirm balance/drawdown update.
5. Open Handbook and scroll to Pattern Recognition.
6. Click a pattern's Practice button and confirm it opens the matching mode.
