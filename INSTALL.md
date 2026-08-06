# Futures Academy v2.1.4 — Live Header Progress Sync

The Owner Dashboard already updated Supabase, but the top header retained the
profile values loaded at sign-in.

This patch adds a profile-refresh event:

- Changing your own XP updates the level/XP display.
- Changing your own Credits updates the coin display.
- Changing your own Reputation updates the star display.
- Changing your own Premium or role refreshes membership badges.

Extract into the project root and replace:

- components/FuturesAcademy.tsx
- components/admin/OwnerDashboard.tsx

No Supabase migration is required.
