# Research: shared-state & identity options for a static-hosted "friends wall"

**Issue:** [#34](https://github.com/mwatt123/daily-music/issues/34) (parent map: #33, blocks #38)
**Branch:** `research/friends-shared-state`
**Date:** 2026-07-20

## Question

Broken Record is a **static GitHub Pages site** with a **solo maintainer** and
**no backend**. Today's album is derived **client-side and deterministically**
from an anonymous, local-only, resettable visitor id:
`selectDailyAlbum(visitorId, localDate, albums)` in `src/dailyAlbum.ts` —
`albums[ fnv1a(`${visitorId}-${date}`) % albums.length ]`. We want a lean
"friends wall": each visitor sees, for today, the album each of their friends
received. That needs two things the app has never had: **shared state** (one
browser reading another browser's data) and **identity/auth** (a durable "me"
that survives a visitor-id reset and is claimable across devices).

Survey the realistic backends, with **current (2026) free-tier limits and small-
scale cost**, ops burden for one person, GitHub Pages coexistence, and risks.

---

## TL;DR

- **Two different problems hide inside "friends wall": a *pick model* and a
  *transport*.** The pick can be **reported** (each client writes today's album
  to shared storage; friends read it) or **computed** (friends store only each
  other's *seed* and recompute the album locally from the public `albums.ts` +
  the pure `selectDailyAlbum`). Broken Record is almost uniquely suited to the
  computed model because the derivation is already deterministic, pure, and
  dependency-free, and the album list is already public in the static bundle.

- **The near-backendless computed path is the standout for this app's scale and
  maintainer.** A friend's entire wall is reconstructable from a set of
  `{name, seed}` pairs. That set can live in a **shareable link / QR** (zero
  backend, zero identity infra, pure GitHub Pages) or, for a nicer UX, in one
  **tiny KV/row per friend-list**. Reads and writes are per *friendship
  change*, not per *day* — so even Cloudflare KV's stingy **1,000 writes/day**
  free cap is untouchable at dozens–hundreds of users. **The cost is a real
  privacy regression** (see §4) that must be designed around, and it does not
  generalize if the pick model ever stops being deterministic.

- **If you want a "reported"/real backend anyway** (future-proof against
  non-deterministic picks, richer social features, server-truth timestamps),
  the ranking for a solo dev on a static host is: **Cloudflare Workers + D1**
  (best free ceiling, no cold-pause, one platform, `$5/mo` if you ever exceed
  free) ≳ **Supabase** (most batteries-included: Postgres + Auth + RLS, but
  free projects **auto-pause after 7 days idle** and 500 MB cap) > **Firebase**
  (generous MAU/read caps, but Google lock-in and a client SDK you bundle) >
  **PocketBase self-host** (cheapest *marginal* cost but the only option that
  makes a solo dev a sysadmin) > **Vercel/Netlify functions + Neon/Turso**
  (fine, but that's two vendors to wire and Vercel Hobby forbids commercial
  use). **PlanetScale has no free tier anymore** (min `$5/mo`).

- **Identity is the quiet hard part, not storage.** The app deliberately uses an
  anonymous, *resettable* visitor id and stores nothing server-side. A "durable
  me" that a friend can point at means introducing real auth (OAuth/email) or
  accepting a bearer-secret "seed = identity" model. The computed path's seed
  *is* the identity, which is exactly why it leaks a timeline.

---

## 0. What "friends wall" actually requires (framing)

Two orthogonal axes decide everything below.

**Axis A — pick model:**

- **Reported.** Each client, each day, publishes its resolved album
  (`{friendId, date, albumKey}`) to shared storage. Friends read the rows for
  today. Works for *any* pick logic, including future non-deterministic or
  server-curated picks. Write volume scales with **users × active-days**.
- **Computed.** Shared storage holds only a **directory of seeds**
  (`{friendId, name, seed}`). Each client recomputes every friend's album
  locally via the already-pure `selectDailyAlbum(seed, today, albums)`. Write
  volume scales with **friendship changes only** (near-zero steady state);
  reads can even be cached forever. Only works while the pick stays a pure
  `derive(seed, date)` over a public album list — which is exactly today's design.

**Axis B — identity:**

- The current `visitorId` is `crypto.randomUUID()` in a cookie /
  `chrome.storage.local`, **anonymous and resettable by design** (resetting is a
  feature — the Crate is deliberately kept independent of it, per `CONTEXT.md`).
- A friends wall needs a "me" that (a) another browser can *name/point at* and
  (b) ideally survives a reset and roams across devices. That is a genuine new
  concept, not a storage detail. The seed-sharing path collapses identity and
  data into one bearer token (the seed); the BaaS paths give you real accounts.

The current derivation, for reference (`src/dailyAlbum.ts`):

```ts
const seed = `${visitorId}-${date}`;
const index = fnv1a(seed) % albums.length;
return albums[index];
```

`albums.ts` ships in the static bundle, and `selectDailyAlbum` is pure and
already unit-tested — so **any browser can reproduce any other browser's album
for any date given only that browser's `visitorId`.** That fact is the whole
basis of the computed path *and* its privacy problem.

---

## 1. Managed BaaS

### Supabase (Postgres + Auth + Row-Level Security)

- **Identity/auth:** Full first-class auth — email/password, magic link, OAuth
  (Google/GitHub/Apple/…), anonymous sign-in, all wired to Postgres
  **Row-Level Security** so "a friend can read my today-pick but not edit it" is
  expressible declaratively. This is the strongest *out-of-the-box* answer to the
  identity problem.
- **Free tier (2026):** 500 MB database, 1 GB file storage, 5 GB egress,
  **50,000 monthly active users**, 500K edge-function invocations, 200 concurrent
  realtime connections, up to 2 projects. Plenty of *capacity* for dozens–
  hundreds of users.
- **The catch:** **free projects auto-pause after ~7 days of no database
  activity** and must be manually restored (data is retained 90 days). For a
  low-traffic hobby app this *will* fire; the standard fix is a cron/GitHub
  Action pinging the DB, or the `$25/mo` Pro plan (never pauses). No daily
  backups, no SLA on free.
- **Cost at small scale:** `$0` while inside free limits; realistically `$0`
  for dozens–hundreds of users if you keep it warm. Next step is `$25/mo` Pro —
  a real jump for a hobby project.
- **Ops burden:** Low-moderate. Managed Postgres, but you own the schema, RLS
  policies, and the keep-warm hack. RLS is powerful but easy to misconfigure
  (a bad policy = data leak).
- **GitHub Pages fit:** Excellent. Browser talks directly to Supabase via
  `supabase-js` + the anon public key; Supabase sends permissive CORS. No server
  to run — the static site just calls the API. This is the canonical "static
  frontend + BaaS" shape.
- **Headline risks:** free-tier pause surprising a low-traffic app; leaking the
  service-role key (must ship only the anon key + rely on RLS); RLS
  misconfiguration; the `$0 → $25` cliff.

### Firebase (Firestore + Authentication)

- **Identity/auth:** Firebase Authentication — email, OAuth providers, anonymous
  auth — free for **50,000 MAU** (phone auth is the one paid exception). Mature,
  well-documented, strong client SDKs.
- **Free tier (Spark, 2026):** Firestore **50K reads / 20K writes / 20K deletes
  per day**, 1 GiB stored; 2M Cloud Functions invocations/month; 10 GB hosting.
  On Spark the app is **blocked (not billed)** when a daily quota is hit — safe
  for cost, bad for availability if you're near a cap.
- **Cost at small scale:** `$0` on Spark for this workload. Blaze (pay-as-you-go)
  overage is cheap (`$0.06 / 100K reads`, `$0.18 / 100K writes`) but Blaze
  removes the hard cap, so a bug/loop can run up a bill.
- **Ops burden:** Low. Fully managed; security via Firestore Security Rules
  (analogous to RLS, similar footgun potential).
- **GitHub Pages fit:** Excellent — pure client SDK, no server, permissive CORS.
- **Headline risks:** Google lock-in (proprietary Firestore data model + query
  language); Security Rules misconfiguration; larger client SDK bundle;
  Blaze-plan runaway-cost risk if you leave Spark's hard caps.

**Verdict for BaaS:** Both are excellent GitHub-Pages citizens and both *solve
identity properly*. Supabase wins on standards (Postgres/SQL, portable data,
declarative RLS) but carries the idle-pause papercut; Firebase wins on "never
think about ops" but locks you in. Either supports **reported** picks natively
and can also just store seeds for the **computed** model.

---

## 2. Serverless functions + hosted DB / edge KV

### Cloudflare Workers + D1 / KV / Durable Objects — best-in-class free ceiling

- **Identity/auth:** **None built in.** You implement auth yourself (issue your
  own tokens, or integrate an OAuth provider / Cloudflare Access). This is the
  main gap vs. a BaaS — you're building the "durable me" by hand.
- **Free tier (2026, verified against official pricing docs):**
  - **Workers:** 100,000 requests/day, 10 ms CPU/invocation.
  - **KV:** 100,000 reads/day, **1,000 writes/day**, 1,000 deletes/day, 1 GB.
  - **D1** (SQLite): **5,000,000 rows read/day**, 100,000 rows written/day, 5 GB.
  - **Durable Objects:** 100,000 requests/day (SQLite-backed only on free;
    storage billing began Jan 2026).
- **Cost at small scale:** `$0` on free; the paid plan is a flat **`$5/mo`
  minimum** that raises every limit — a far gentler upgrade cliff than
  Supabase's `$25`. No idle-pause.
- **Which primitive:** For a friends wall, **D1** is the natural fit (relational
  `friends` / `picks` tables, and its read ceiling is enormous). **KV**'s
  1,000-writes/day cap makes it a poor fit for a *reported* model (writes scale
  with users×days) but a *fine* fit for a *computed* seed-directory (writes only
  on friendship changes). **Durable Objects** are overkill unless you want live
  presence.
- **Ops burden:** Low-moderate. One platform, one CLI (`wrangler`), no servers.
  You write the Worker (the API layer) and its auth — more code than a BaaS, but
  all serverless and all in one vendor.
- **GitHub Pages fit:** Excellent, with one wrinkle: the Worker is a *different
  origin* from `*.github.io`, so **you set the CORS headers in your Worker**
  (trivial — `Access-Control-Allow-Origin`). No server to run; Workers are the
  server.
- **Headline risks:** you build auth yourself (biggest cost); KV write cap if
  misapplied to reported picks; `10 ms` CPU limit on free (fine for CRUD).

### Vercel / Netlify functions + hosted DB (Neon / Turso / PlanetScale)

- **Identity/auth:** none from the function layer; you add a DB and build/borrow
  auth (or bolt on Auth0/Clerk/Neon Auth). More moving parts than Cloudflare.
- **Function free tiers (2026):** Vercel Hobby — 1M function invocations/mo, 100
  GB transfer, **but Hobby's ToS forbids commercial use**. Netlify Starter — 300
  credits/mo (~300 invocations or 3 GB), commercial use allowed.
- **DB free tiers (2026):** **Neon** — 0.5 GB storage, 100 compute-hours/mo, up
  to 100 projects, includes **Neon Auth (60K MAU)** (a nice identity add-on);
  serverless Postgres. **Turso** — 5 GB storage, 500M row-reads/mo, edge SQLite.
  **PlanetScale** — **no free tier since 2024** (min `$5/mo`); rule it out for a
  free hobby build.
- **Cost at small scale:** `$0` achievable (Netlify + Neon or Turso). But you're
  now composing **two vendors** (host + DB) and their two dashboards/limits.
- **Ops burden:** Moderate — the most wiring of the managed options; two
  services to keep inside free tiers, plus your own auth unless you adopt Neon
  Auth.
- **GitHub Pages fit:** Workable but awkward. If you keep the site on GitHub
  Pages and only host *functions* on Vercel/Netlify, you're cross-origin (CORS
  again) and splitting hosting across vendors. If you're willing to host functions
  elsewhere, you'd usually just move the whole static site there too — at which
  point "coexists with GitHub Pages" stops being the question.
- **Headline risks:** Vercel Hobby's non-commercial clause; two-vendor sprawl;
  gluing auth together; Neon compute-hours/idle behavior on the smallest tier.

---

## 3. Self-hosted lightweight (PocketBase)

- **Identity/auth:** Excellent for a single binary — PocketBase bundles
  email/password + OAuth2 (Google/GitHub/…), a realtime SQLite DB, file storage,
  and an admin UI, all in one ~15 MB Go binary. Feature-wise it's a self-hosted
  Supabase-lite and *does* solve identity.
- **Cost at small scale:** the **binary is free**; you pay for a box. A `$4–5/mo`
  Hetzner/Vultr/DigitalOcean VPS or a `$5–10/mo` Railway/Fly instance runs it
  comfortably (it idles under ~20 MB RAM and serves thousands of connections on
  a `$4` VPS).
- **Ops burden — the deciding factor:** **This is the only option that makes a
  solo dev a sysadmin.** You own the OS, TLS certs, the server process
  (restart-on-crash/reboot, e.g. systemd), OS and PocketBase upgrades, backups
  of the SQLite file, uptime monitoring, and DDoS/abuse exposure on a public
  port. For a maintainer whose entire app is currently "push static files to
  GitHub Pages and walk away," this is a categorical increase in standing burden
  — a server that can go down at 3am, versus a CDN that can't.
- **GitHub Pages fit:** Fine as an API (static site calls `https://pb.yourdomain`
  cross-origin; PocketBase can send CORS headers), but philosophically it breaks
  the "no server to run" property that makes GitHub Pages attractive here.
- **Headline risks:** it's a pet server — availability, security patching, and
  backups are now *your* pager; single-box SPOF; abuse on an open port.

**Verdict:** lowest marginal *dollar* cost, highest *human* cost. Rational only
if you specifically want to own your data/stack and enjoy running a box. For a
solo maintainer optimizing for walk-away-ability, it's the weakest fit despite
the tiny bill.

---

## 4. The computed / seed-sharing near-backendless path

This is the option the app's own design invites, and the most interesting one.

**The mechanism.** Because `selectDailyAlbum(seed, date, albums)` is pure,
deterministic, dependency-free, and `albums.ts` is public in the bundle, a
friend's wall for *any* day is fully reconstructable from just their **seed**
(today: their `visitorId`). So the entire shared state a friends wall needs is a
**directory of `{name, seed}` pairs** — no per-day writes, no server-side
compute, no timestamps. Each client recomputes all friends locally.

**How minimal can the shared state be? Three rungs, increasing in UX / infra:**

1. **Nothing but shareable links (fully backendless, pure GitHub Pages).** "Add
   me" = a URL/QR encoding `{name, seed}` (e.g. in the hash fragment). Alice
   opens Bob's link; her browser stores Bob's seed in *her own* `localStorage`
   friend list and recomputes his album daily forever. **Zero backend, zero
   accounts, zero cost, zero ops** — it rides entirely on the existing static
   site. Limitation: no discovery, no mutual-consent handshake, and each side's
   list is local-only (no cross-device sync of *your* friend list).

2. **A tiny read-mostly directory (one row/blob per person).** To get roaming +
   simple discovery, store each user's public `{handle, seed, displayName}` in
   one KV entry or DB row, keyed by a handle they pick. Friending = save a
   handle. **Writes happen only when someone joins or rotates a seed** — so this
   fits inside *any* free tier trivially, including Cloudflare **KV's
   1,000-writes/day** cap, since steady-state writes are ~zero. This is
   "nearly backendless": a single tiny key-value table and no server logic
   beyond get/put.

3. **A minimal owned endpoint** only if you want mutual-consent friend requests
   or private walls — at which point you've basically re-entered §2 (a Worker +
   D1) but with a *much* smaller schema (seeds, not per-day picks).

**Reported vs. computed suitability.** The computed model is *only* available
here because the pick is deterministic. Its payoff is dramatic: shared state
shrinks from `O(users × days)` reported rows to `O(users)` seed entries, and it
can degenerate all the way to **no backend at all** (rung 1). If the pick logic
ever becomes non-deterministic, personalized server-side, or dependent on
non-public data, the computed path evaporates and you must fall back to a
reported model on a real backend (§1/§2).

**The privacy implication — this is the load-bearing caveat.** A seed is not a
"today" token; it is a **master key to a person's entire past *and future*
timeline.** Anyone holding the seed can compute what album that person got on any
date, forward and backward, forever, offline, with no audit trail — because
`selectDailyAlbum` takes an *arbitrary* date. Sharing a seed is therefore
qualitatively different from "showing a friend today's pick": it is handing over
a permanent, un-revocable-by-them window (revocable only by the owner *rotating*
the seed, which breaks all existing friendships at once).

This also **collides with an existing, deliberate product value:** `CONTEXT.md`
and the visitor-id design treat the id as **anonymous and resettable** — the
Crate is intentionally decoupled from it so a reset is consequence-free. The
seed-sharing model inverts that: the id becomes a *published, durable, socially-
shared identity*, and "reset" becomes "silently un-friend everyone." Mitigations
exist but must be explicit design decisions, not afterthoughts:

- **Derive a separate "friend seed"** distinct from `visitorId` (e.g. a second
  UUID minted only when you opt into the wall), so joining the wall never
  publishes your primary id and resetting `visitorId` doesn't nuke friendships.
- **Rotatable handles/seeds** with a clear "this reveals your whole timeline"
  consent moment at share time.
- Accept that even so, past+future disclosure is inherent to *any* deterministic
  seed-sharing scheme — you can scope *which* seed you share, not *what* a shared
  seed reveals.

**Headline risks:** timeline disclosure (above); no consent/revocation on rung 1
(a leaked link is forever); no discovery/roaming without rung 2; and the whole
approach is **brittle to any future change in the pick model.**

---

## Comparison

| Option | Identity/auth | Free tier (2026) | Small-scale cost | Ops burden (solo) | GitHub Pages fit | Best pick model | Headline risk |
|---|---|---|---|---|---|---|---|
| **Seed links (rung 1)** | Seed *is* identity (bearer) | n/a — no backend | **$0** | **~none** (static only) | **Native** | Computed | Timeline leak; no revocation/roaming |
| **Tiny seed KV (rung 2)** | Handle + seed | fits any KV/DB free tier | **$0** | Very low | Excellent | Computed | Timeline leak; weak consent |
| **Cloudflare Workers + D1** | DIY (you build it) | 100K req/day; D1 5M reads / 100K writes/day, 5 GB | **$0**, then flat **$5/mo** | Low–moderate | Excellent (set CORS in Worker) | Reported or computed | You build auth; KV write cap if misused |
| **Supabase** | **Full (Auth + RLS)** | 500 MB DB, 50K MAU, 5 GB egress | **$0**, then **$25/mo** | Low–moderate | Excellent | Reported or computed | **Idle auto-pause (7d)**; RLS footguns; $25 cliff |
| **Firebase** | **Full (Auth)** | 50K reads/20K writes per day, 50K MAU | **$0** (Spark) | Low | Excellent | Reported or computed | Google lock-in; Blaze cost runaway |
| **Vercel/Netlify fn + Neon/Turso** | DIY / Neon Auth | Neon 0.5 GB + 60K MAU; Turso 5 GB/500M reads; Netlify 300 credits | **$0** (Netlify+Neon) | Moderate (two vendors) | Awkward (cross-origin, split hosting) | Reported | Vercel Hobby non-commercial; vendor sprawl |
| **PlanetScale** | DIY | **none (killed 2024)** | **≥$5/mo** | — | — | — | No free tier — rule out |
| **PocketBase (self-host)** | **Full (built-in)** | free binary | **$4–10/mo VPS** | **High (you're the sysadmin)** | Fine as API; breaks "no server" | Reported or computed | Pet server: uptime/patching/backups are yours |

---

## Recommendation

There is no single mandate; the right pick depends on what you weight.

- **If you weight staying true to the app's backendless, walk-away ethos and
  minimizing cost/ops above all → build the computed seed-sharing path, starting
  at rung 1 (shareable links) and graduating to rung 2 (a tiny seed KV) only when
  you want roaming/discovery.** It exploits the fact that `selectDailyAlbum` is
  already pure and `albums.ts` is already public, needs `$0` and no server, and
  keeps Broken Record a static site. **Non-negotiable pre-work:** design a
  *separate, rotatable friend-seed* (not the primary `visitorId`) with an
  explicit "this reveals your entire timeline" consent moment — otherwise you
  quietly destroy the anonymous/resettable id that `CONTEXT.md` treats as a
  feature. This is my default recommendation for *this app as it exists today.*

- **If you weight future-proofing and real accounts (picks might become
  non-deterministic; you want mutual-consent friending, private walls, or
  server-truth) → Supabase.** It's the only option that hands you identity + RLS
  + a portable SQL database with the least code, and it's a first-class
  static-site backend. Budget for the idle-pause keep-warm ping and the eventual
  `$25/mo` Pro step.

- **If you weight a generous free ceiling, one vendor, no idle-pause, and a soft
  `$5/mo` upgrade — and you're comfortable writing your own thin auth →
  Cloudflare Workers + D1.** Best raw limits of the "real backend" options and
  the gentlest cost curve; the cost is that identity is yours to build. Use D1
  (not KV) for a reported model; KV is fine only for a computed seed directory.

- **Avoid for this project:** PlanetScale (no free tier), Vercel/Netlify+DB
  (two-vendor sprawl and, for Vercel Hobby, a non-commercial clause) unless you're
  already leaving GitHub Pages, and PocketBase self-hosting (cheapest dollars,
  but it converts a zero-ops static site into a server you have to babysit).

**Bottom line:** the app's determinism is a gift — lean into the computed path
for a lean friends wall now, with the seed-privacy design done deliberately; reach
for Supabase (batteries) or Cloudflare Workers+D1 (headroom, DIY auth) the moment
you need real identity or a non-deterministic/reported pick model.

## Sources

- Supabase pricing / free tier — https://supabase.com/pricing and https://uibakery.io/blog/supabase-pricing
- Supabase free-project pausing (7-day idle) — https://supabase.com/docs/guides/platform/free-project-pausing
- Firebase pricing (Spark quotas) — https://firebase.google.com/pricing and https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firestore usage & limits — https://firebase.google.com/docs/firestore/quotas
- Cloudflare Workers pricing (Workers/KV/D1/DO free limits, verified) — https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare KV pricing — https://developers.cloudflare.com/kv/platform/pricing/
- Cloudflare D1 limits — https://developers.cloudflare.com/d1/platform/limits/
- Vercel limits / pricing (Hobby, non-commercial) — https://vercel.com/docs/limits and https://vercel.com/pricing
- Netlify pricing (Starter credits) — https://comparetiers.com/tools/netlify
- Neon free tier (storage, compute-hours, Neon Auth) — https://agentdeals.dev/vendor/neon and https://checkthat.ai/brands/neon/pricing
- Turso free tier — https://devtoolpicks.com/blog/turso-vs-neon-vs-supabase-indie-hackers-2026
- PlanetScale free-tier removal — https://www.codu.co/niall/no-more-free-tier-on-planetscale-here-are-free-alternatives-q4wzqcu9
- PocketBase (single binary, features) — https://pocketbase.io/faq/
- PocketBase hosting costs (Railway/Hetzner/Fly) — https://railway.com/deploy/pocketbase and https://github.com/pocketbase/pocketbase/discussions/537
