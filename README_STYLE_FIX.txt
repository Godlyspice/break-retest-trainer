Futures Academy Global Style Restore

The v2 package accidentally overwrote app/globals.css with an empty file.

Extract this patch into the root of your project and allow it to replace:

app/globals.css

Keep all your current v2 components and Supabase migrations.
No database changes are needed.
