# Futures Academy v2.1.2 — New User Zero Defaults

## Code

Extract this patch into your project root and allow it to replace:

- components/FuturesAcademy.tsx

It adds:

- supabase/new_user_zero_defaults_v212.sql

## Database

Run `supabase/new_user_zero_defaults_v212.sql` once in Supabase SQL Editor.

This affects future registrations only. It does not reset the Owner or any
existing member.

## Expected new-user values

- Level 1
- XP: 0
- Academy Points/Credits: 0
- Reputation: 0
- Streak: 0
- Role: user
- Premium: false
