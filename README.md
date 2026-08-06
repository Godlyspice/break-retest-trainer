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


## Trade planning update

The main mixed trainer now requires a complete trade plan for Buy and Sell decisions:

- Entry price
- Stop-loss price
- Take-profit price
- Automatic validation of stop/target direction
- Reward-to-risk feedback
- Entry, stop, and target lines drawn directly on the chart

Wait decisions do not require trade levels.


## Simulator v0.2

Added:

- Replay mode with Play, Pause, one-candle advance, reset, and speed controls
- Hidden future candles
- Optional chart placement for entry, stop, and target
- Draggable trade lines
- Mobile-friendly side entry fields remain available
- Tick adjustment buttons for precise phone input
- Crosshair price reading
- Mouse-wheel zoom
- Volume bars
- Market, limit, and stop order-type controls
- Contract quantity input
- Live risk, reward, reward-to-risk, estimated MES profit, and estimated MES loss
- Expanded scoring for direction, entry, stop, target, and risk management


## Game Hub v0.3

This release changes the app from a plain trainer into a return-focused training game:

- New Trading Command Center home screen
- Daily mission card with progress and reward
- Career rank system and visual career path
- Combo meter and best-combo tracking
- Large training-program cards instead of a subtle dropdown
- Every training program has a distinct color atmosphere, banner, icon, difficulty, reward, and message
- Main Simulator, Weakness Hunt, Confirmation Lab, Fakeout Arena, and Patience Protocol
- Quick access to Mistake Replay and daily missions
- Mobile-responsive game hub
- Simulator and precise side-panel trade controls remain intact

This is still an educational simulator using synthetic scenarios. Rank names are game progression labels, not claims of real trading ability.


## Usability fix v0.3.1

- Added interactive question-mark explanations to the main simulator controls
- Explained market, limit, stop, buy, sell, wait, contracts, entry, stop-loss, take-profit, risk, reward, R:R, estimated profit/loss, replay controls, and submit
- Capped candlestick and volume-bar width so changing modes cannot create oversized candles
- Rebuilt line dragging to use an in-canvas preview and save the new price on release
- Reset replay candle count consistently when switching programs


## Risk/reward visualization v0.3.2

- Added translucent green take-profit zone between entry and target
- Added translucent red stop-loss zone between entry and stop
- Added right-side risk and reward brackets
- Added point and approximate MES dollar labels
- Added live reward-to-risk label inside the reward bracket
- Order lines and price tags remain draggable and are rendered above the colored zones


## Polish pass v0.3.3

- Fixed question-mark icon alignment so it remains centered beside each control
- Help popovers close when clicking outside or pressing Escape
- Opening a new help popover closes the previous one
- Normalized horizontal candle spacing across all training modes
- Kept candle width capped while preserving a stable Tradovate-like density
- Added semantic color styling to Buy, Sell, Wait, Entry, Stop, and Target controls
- Added a more visual live trade summary
- Added scenario fade transitions
- Added line-placement glow feedback
- Added incorrect-answer panel shake
- Added tactile button press feedback


## Layout correction v0.3.4

- Left-aligned candle series so new scenarios begin from the chart's left edge
- Made Buy, Sell, and Wait equal-width and proportional
- Moved help icons inside Market, Limit, Stop, Buy, Sell, and Wait controls
- Fixed help icon alignment so icons no longer sit behind or below buttons
- Added minus and plus contract buttons while retaining direct number input


## Control structure fix v0.3.5

- Removed invalid nested button markup from order types and decisions
- Fixed Market, Limit, and Stop help icons by placing them beside—not inside—the buttons
- Forced Buy, Sell, and Wait to identical heights and widths
- Rebuilt Contracts as a proper non-label control with working minus and plus buttons
- Replaced number input with a numeric text input so browser spinner arrows no longer appear
- Prevented the Contracts container from activating its help popup
- Added a working help popup to Live trade summary
- Removed tooltip clipping from risk cards and summary panels


## Layout cleanup v0.3.6

- Fixed the broken Instrument and Contracts card layout
- Stopped nested contract controls from inheriting quote-card styling
- Kept the contracts stepper inside a single compact card
- Raised the active tooltip above every other help icon
- Temporarily hides background help icons while a tooltip is open
- Improved tooltip opacity and prevented visual overlap in the risk/reward section


## Visual theme v0.3.7

- Added icon-enhanced navigation
- Replaced abstract mode glyphs with more recognizable training icons
- Added subtle trading-themed background art and chart-watermark decoration
- Added motivational hero messaging
- Added illustrated mission cards and HUD accents
- Added mode-specific decorative candlestick artwork
- Kept backgrounds low-opacity so charts and controls remain readable
- Added gentle motion that respects reduced-motion preferences


## Economy and paper account system v0.4.0

- Added selectable Starter, Growth, and Pro paper accounts
- Added simulated account balance, peak balance, and trailing drawdown
- Correct simulator decisions award Academy points and simulated paper profits
- Incorrect decisions reduce the paper balance
- Hitting trailing drawdown marks the paper account as failed
- Account resets cost Academy points
- Added balance leaderboard alongside streak leaderboard
- Added Academy points shop
- Added account icons, profile badges, animated-profile rewards, and profile backgrounds
- Added smarter entry/stop/target placeholders based on the key level without inserting real values
- Added point balance to the top HUD


# Futures Academy 1.0 Foundation

This release begins the V1 architecture rewrite.

## New foundation

- Permanent Academy sidebar and professional top status bar
- Command Center
- Trading Floor
- Daily Mission
- Career
- Promotion Exam Center
- Account Vault
- Replay Theater
- Research Lab / AI Coach
- Trophy Room
- Marketplace
- Community leaderboards
- Statistics
- Profile and settings

## Harder progression

- Career ranks now require both XP and Reputation
- Career XP thresholds extend to 350,000 XP
- Top rank requires 45,000 Reputation
- Correct-answer rewards are much lower and vary by training difficulty
- Incorrect answers remove Reputation
- Reputation cannot be purchased

## Paper accounts

- Starter: 0 Reputation
- Growth: 500 Reputation
- Pro: 2,500 Reputation
- Elite: 8,000 Reputation
- Funded Challenge: 20,000 Reputation

## Important

This is the V1 foundation, not the final 1.0 public release. The purpose of this build is to establish a scalable academy structure while preserving the working simulator.


# Futures Academy V1.1 — Guest and Onboarding

- New welcome screen
- Continue as Guest
- Quick Demo
- Create Account / Sign In path
- Guest progress saved locally on the current device
- Guest accounts restricted to Starter paper account
- Guests excluded from Marketplace and future leaderboard submissions
- First-time guided tour
- Academy Handbook with searchable beginner explanations
- AI Coach removed from the current navigation
- Sticky paper-account HUD on desktop so balance and trailing drawdown stay visible
- Guest conversion prompts for locked features


# Futures Academy v1.1.1 — Authentication Sync

- Authenticated Supabase sessions now override guest/demo identity everywhere
- Profile card uses the real display name and dynamic initials
- Owner accounts show an Academy Founder / Owner badge
- Premium status comes from the Supabase profile
- Login form is replaced with signed-in account details after authentication
- Added a real Sign Out button
- Guest local storage can no longer override an authenticated account
- Added guest-progress import or discard prompt after signing in
- Profile XP and streak load from Supabase
- Email verification and membership status are shown clearly


## v1.1.1 hotfix

- Corrected the exact current profile-page component
- Signed-in users now see account details instead of the email/password form
- Owner and premium state now synchronize with the existing admin permission system
