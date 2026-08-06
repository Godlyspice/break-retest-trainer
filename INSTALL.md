# Futures Academy v2.1.6 — Full Progress Header Sync

The owner refresh event was working, which is why XP/Level changed, but the
authenticated profile query did not include Credits or Reputation.

This patch loads and synchronizes:

- XP
- Streak
- Credits / Academy Points
- Reputation

Extract into the project root and replace:

- components/FuturesAcademy.tsx

No Supabase migration is required.

After deployment, adjust your own Credits or Reputation in Admin. The header
and evaluation unlocks should update immediately.
