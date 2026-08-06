# Futures Academy v2.1.3 — Restore Real Owner Console

The v2.1/v2.1.2 component packages were based on the older Foundation component,
which restored a static demo Admin table.

Extract this patch into the project root and replace:

- components/FuturesAcademy.tsx

It also restores:

- components/admin/OwnerDashboard.tsx

If `supabase/admin_dashboard_v120.sql` has already run successfully, do not run
it again. Your existing owner role and user data are not changed.
