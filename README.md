# Futures Academy

A deploy-ready, mobile-friendly futures education app with:

- Tradovate-inspired synthetic candlestick trainer
- Break, retest, fakeout, and chop scenarios
- Non-overlapping chart explanation labels
- Account sign-up and sign-in
- Private owner/admin statistics
- Premium user controls
- Owner-assigned roles: user, moderator, admin, owner
- Daily challenges and streaks
- XP levels and weekly leaderboard
- AI futures education tutor
- Responsive phone, tablet, and desktop UI

## Important

The included interface works in demo mode immediately. Real accounts, cross-device progress,
private admin statistics, and the AI tutor require environment variables.

## 1. Create Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication settings, configure your site URL and email confirmation preference.
5. Copy the project URL and anon key.

## 2. Create OpenAI API access

Create an API key and keep it server-side. Never place it in a variable beginning with
`NEXT_PUBLIC_`.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` for local development:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

The service-role key is reserved for future server-only admin routes. Do not expose it to the browser.

## 4. Run locally

```
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5. Deploy to a URL with Vercel

1. Upload this project to a GitHub repository.
2. Import the repository into Vercel.
3. Add the environment variables in Vercel Project Settings.
4. Deploy.
5. Vercel will create a public URL.
6. Update the Supabase Authentication site URL to your new Vercel URL.

## 6. Make yourself the owner

Create your account through the site, then run:

```
update public.profiles
set role='owner', premium=true
where email='YOUR_EMAIL';
```

## Security notes

- Supabase Row Level Security is included.
- Ordinary users cannot query everyone’s private profile or attempts.
- Admin/owner visibility is controlled by database policies, not just hidden buttons.
- The public leaderboard view does not include email addresses.
- Before charging users, add payment processing, terms, privacy policy, rate limiting,
  abuse protection, backups, email verification, and production security review.

## Current MVP limitations

- Charts are realistic synthetic training patterns, not licensed historical CME data.
- Admin changes in the visible demo table are local UI examples. Connect those controls to
  server-side admin routes before production.
- Daily challenge generation should be moved to a database or scheduled server job for a
  globally identical challenge.
- AI usage should have per-user limits to control cost.


## Break-and-retest game features added

- Five-stage academy progression focused only on breaks and retests
- Automatic mistake replay library
- Achievement and badge system
- Correct/incorrect sound feedback with mute controls
- Reduced-motion accessibility option
- XP celebration animation
- Accuracy and mistake statistics
- Improved annotation layout with dedicated right-side lanes
- Mobile-responsive mistake review and achievements screens

The current build intentionally stays focused on break-and-retest recognition rather than adding unrelated trading strategies.


## Unified main trainer update

The primary experience is now one mixed mode, matching the original trainer:

- Valid bullish break-and-retests
- Valid bearish break-and-retests
- Failed breakouts
- Failed breakdowns
- Choppy and no-trade situations

Users are not told what setup is coming, so they must read the chart rather than recognize the lesson category.

Focused practice remains optional through a small Practice Mode selector:
- Practice Weakness
- Clean Retests
- Fakeouts
- No-Trade

There are no required separate stages or locked lesson sections.
