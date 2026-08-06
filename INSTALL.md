# Futures Academy v4.0 — Visual Evolution

This is a complete drag-and-drop bundle built on top of the full v3 Academy RPG
release and the v2.2 Premium Command Center.

You only need this ZIP.

## Install

1. Extract the ZIP.
2. Drag all folders into the root of your existing project.
3. Allow Windows to merge folders and replace matching files.
4. Commit and push to GitHub.

Recommended commit:

`Launch v4 Visual Evolution`

## Files added

- components/icons/AcademyIcon.tsx
- components/ui/NeonUI.tsx
- STYLE_GUIDE.md

## Files updated

- components/FuturesAcademy.tsx
- app/globals.css

## No database migration

This release is visual and interface-focused. No Supabase SQL is required.

## Immediate desktop test

1. Open Command Center.
2. Confirm the v2.2 premium dashboard still loads.
3. Confirm the header displays the new rank emblem.
4. Confirm the sidebar uses custom SVG neon icons.
5. Open Academy Path, Career, Marketplace, Profile, and Admin.
6. Confirm cards use the shared neon visual language.
7. Confirm Marketplace rarities have distinct visual treatment.
8. Confirm equipped cosmetics still appear.

## Immediate mobile test

1. Open the website on a phone or narrow the browser below 820 px.
2. Confirm the labeled bottom dock appears.
3. Confirm every dock icon is a custom SVG icon.
4. Tap More.
5. Confirm each destination has:
   - custom icon
   - name
   - explanation
   - eligibility state
6. Confirm the header status row scrolls horizontally if needed.
7. Confirm the bottom dock does not cover page controls.

## Important

This release preserves the existing application logic. It does not reset
Supabase profiles, evaluations, marketplace ownership, owner permissions,
Career progress, or authentication.
