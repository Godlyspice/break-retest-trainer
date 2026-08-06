# Futures Academy v4.4.1 — Combined Fixed Bundle

This package includes:

- v4.2 expanded trader classes and animated icons
- v4.3 editable profile names
- v4.4 name selection during Guest, Demo, and account onboarding
- The compile fix changing `currentClass.perk` to `currentClass.perks`

## Install

1. Extract this ZIP.
2. Drag every included folder into the root of your project.
3. Choose Merge and Replace.
4. Commit and push:

`Install v4.4.1 combined fixed bundle`

## Supabase

Run these SQL files in order if you have not already run them:

1. `supabase/editable_profile_names_v430.sql`
2. `supabase/name_onboarding_v440.sql`

If you already ran either file successfully, you do not need to run it again.

## Verify

- The project compiles without the `Property 'perk' does not exist` error.
- Guest and Demo ask for a profile name.
- New account signup asks for a preferred profile name.
- Existing users can change their name from Profile.
- Academy Path shows all expanded classes and multiple perks.
