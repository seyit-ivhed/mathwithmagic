# Staging and Production Setup Guide

This guide walks through setting up the staging and production environments from
scratch. Follow every section in order on a fresh repository before your first
deployment.

---

## Prerequisites

Before you start, make sure you have accounts and CLI tools ready:

| Tool | Purpose | Install |
|---|---|---|
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Push migrations, deploy edge functions | `brew install supabase/tap/supabase` |
| [Vercel CLI](https://vercel.com/docs/cli) (optional) | Pull environment variables locally | `npm i -g vercel` |
| [Stripe CLI](https://stripe.com/docs/stripe-cli) (optional) | Forward webhooks locally for testing 

| `brew install stripe/stripe-cli/stripe` |
| Node.js ≥ 20 | Build and test | [nodejs.org](https://nodejs.org) |
| [Deno](https://deno.land/) | Edge function tests | `curl -fsSL https://deno.land/install.sh | sh` |

You also need accounts on:

- [Supabase](https://supabase.com) — two projects (staging + production)
- [Vercel](https://vercel.com) — one project with two environments
- [Stripe](https://stripe.com) — one account with test and live mode keys
- GitHub — repository already set up

---

## 1. GitHub Settings

Everything else depends on the repository and branch structure, so set this up
first.

### 1.1 Create the `production` branch

```bash
git checkout main
git checkout -b production
git push -u origin production
```

All production deployments are triggered by merging `main` into `production`
through a pull request.

### 1.2 Add repository secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**
and add:

| Secret name | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Your personal access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `STAGING_PROJECT_REF` | Reference ID of the staging Supabase project (from Step 3.1) |
| `PROD_PROJECT_REF` | Reference ID of the production Supabase project (from Step 3.1) |

The `SUPABASE_ACCESS_TOKEN` is the same token for both projects — it is your
personal CLI token that authorizes the `supabase` CLI to act on your behalf.

> You can create the `SUPABASE_ACCESS_TOKEN` secret now. The two project ref
> secrets can be added after completing Supabase setup in Step 3.

### 1.3 Add a GitHub environment with a required reviewer

Adding a required reviewer to the `production` environment means the database
migration workflow will pause and wait for explicit approval before running
against the live database.

1. Go to **Settings → Environments → New environment**
2. Name it `production` (must match the `environment:` key in
   `.github/workflows/production.yml`)
3. Under **Deployment protection rules**, enable **Required reviewers** and add
   yourself (or a trusted team member)

This creates a manual gate: after a PR is merged to `production`, GitHub Actions
will pause before running the migration and prompt the reviewer to approve.

### 1.4 Verify the GitHub Actions workflows

Three workflow files are committed to the repository:

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | Every PR to `main` or `production` | Lint, build, unit tests, E2E tests |
| `.github/workflows/staging.yml` | Push to `main` | Same checks + run DB migrations and deploy edge functions on staging |
| `.github/workflows/production.yml` | Push to `production` | Run DB migrations and deploy edge functions on production (gated by reviewer) |

Vercel deploys the frontend automatically. Database migrations and edge
function deployments are handled by the workflows.

---

## 2. Vercel Setup

Vercel can serve the frontend independently of Supabase, so set it up next.

### 2.1 Create a Vercel project and connect the GitHub repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Set the **Framework Preset** to **Vite**
4. Leave the build and output settings at their defaults:
   - Build command: `npm run build`
   - Output directory: `dist`

### 2.2 Configure branch → environment mapping

In the Vercel project go to **Settings → Environments**:

- **Production** — set the branch to `production`
- **Preview** — no changes needed. Preview automatically deploys every branch
  that is not the production branch. Since `main` is the primary branch we merge
  to, its latest Preview deployment acts as the stable staging URL. Feature
  branch PRs also get their own Preview URLs, which is useful for testing before
  merging.

This means every merge to `main` produces an updated staging preview, and every
merge to `production` updates the live domain.

### 2.3 Set environment variables

In **Settings → Environment Variables**, add the following. Use the **Environment**
toggle to scope each value correctly.

#### Production environment

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Production Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe live publishable key (`pk_live_...`) |

#### Preview environment (staging)

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Staging Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Staging Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key (`pk_test_...`) |

> These variables are prefixed with `VITE_` so Vite exposes them to the
> browser bundle. Never put secret keys (Stripe secret key, Supabase service role
> key) in Vercel environment variables — those belong in Supabase edge function
> secrets only.
>
> The Supabase values come from Step 3.4 and the Stripe key from Step 4.1. You
> can create the project now and fill in the values after those steps.

### 2.4 (Optional) Add a custom domain

In the project dashboard, go to the **Domains** tab (top-level navigation), add
your production domain, and follow the DNS instructions Vercel provides.

---

## 3. Supabase Setup

The game can be played and served without Stripe, so set up Supabase before
configuring payments.

### 3.1 Create two Supabase projects

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create **two
separate projects**:

| Project | Suggested name | Notes |
|---|---|---|
| Staging | `mathwithmagic-staging` | Used by the `main` branch |
| Production | `mathwithmagic-prod` | Used by the `production` branch only |

Save the **Project Reference ID** for each project (found under
**Settings → General → Reference ID**). You will need these later.

If you have not done so already, go back and add `STAGING_PROJECT_REF` and
`PROD_PROJECT_REF` as GitHub repository secrets (Step 1.2).

### 3.2 Apply migrations

Link the Supabase CLI to each project and push the migration history.

**Staging:**

```bash
supabase link --project-ref <STAGING_PROJECT_REF>
supabase db push
```

**Production:**

```bash
supabase link --project-ref <PROD_PROJECT_REF>
supabase db push
```

This applies all files under `supabase/migrations/` in timestamp order. Verify
the tables exist in **Table Editor** in each project's dashboard before
continuing.

### 3.3 Deploy edge functions

Deploy the edge functions for **each** project for the initial setup. After this,
the CI/CD workflows automatically redeploy all functions on every push to `main`
or `production`. Stripe secrets are not required yet — the `delete-account`
function works without them, and the payment functions will start working once
you complete Step 4.

```bash
supabase functions deploy create-payment-intent --project-ref <PROJECT_REF>
supabase functions deploy stripe-webhook --project-ref <PROJECT_REF>
supabase functions deploy delete-account --project-ref <PROJECT_REF>
```

### 3.4 Get the API keys for each project

In each project's dashboard go to **Settings → API** and copy:

- **Project URL** (`https://<ref>.supabase.co`)
- **anon / public key** (safe for the browser)

Go back to Vercel and fill in the environment variables from Step 2.3.

### 3.5 Configure Auth settings

In each project's dashboard go to **Authentication → URL Configuration**:

| Setting | Staging value | Production value |
|---|---|---|
| Site URL | `https://<staging-url>.vercel.app` | `https://yourdomain.com` |
| Additional redirect URLs | `https://<staging-url>.vercel.app/**` | `https://yourdomain.com/**` |

Set **"Anonymous sign-ins"** to **disabled** (already reflected in
`supabase/config.toml` for local dev; apply the same in the dashboard).

---

## 4. Stripe Setup

Stripe powers in-app purchases. The game is fully playable without it, so this
is the last piece to wire up.

### 4.1 Get publishable keys

In the [Stripe Dashboard](https://dashboard.stripe.com):

- **Test mode** publishable key (`pk_test_...`) → for staging
- **Live mode** publishable key (`pk_live_...`) → for production

The secret keys (`sk_test_...` / `sk_live_...`) go into Supabase edge function
secrets (Step 4.3 below) and **never** into frontend environment variables.

If you have not done so already, go back and add
`VITE_STRIPE_PUBLISHABLE_KEY` to the Vercel environment variables (Step 2.3).

### 4.2 Configure the Stripe webhook

You need one webhook endpoint per Supabase project so Stripe can notify the edge
function when a payment completes.

**In the Stripe Dashboard → Developers → Webhooks → Add endpoint:**

| Field | Staging value | Production value |
|---|---|---|
| Endpoint URL | `https://<staging-ref>.supabase.co/functions/v1/stripe-webhook` | `https://<prod-ref>.supabase.co/functions/v1/stripe-webhook` |
| Events to listen | `payment_intent.succeeded`, `payment_intent.payment_failed` | same |

After saving, click **Reveal** on the **Signing secret** (`whsec_...`) — you
will need it in the next step.

### 4.3 Set Supabase edge function secrets

Set the required Stripe secrets for **each** Supabase project:

```bash
# Link to the target project first
supabase link --project-ref <PROJECT_REF>

# Staging uses Stripe test keys; production uses Stripe live keys
supabase secrets set STRIPE_SECRET_KEY=<sk_test_... or sk_live_...>
supabase secrets set STRIPE_WEBHOOK_SECRET=<whsec_...>
```

---

## 5. First Deployment Walkthrough

Follow these steps in order for the very first deployment.

### 5.1 Deploy staging

```bash
# Make sure you are on main and up to date
git checkout main
git pull origin main

# Push a commit (or just re-push) to trigger the staging workflow
git push origin main
```

1. Watch the **Actions** tab in GitHub — `staging.yml` runs lint, build, tests,
   then pushes migrations to the staging Supabase project
2. Once the workflow passes, Vercel deploys the frontend automatically
3. Open the Vercel **Preview** URL and play through the critical paths:
   - Start a new journey and complete the first encounter
   - Sign up with a test email and purchase a content pack using Stripe test card
     `4242 4242 4242 4242`
   - Sign in again and verify game state is preserved

> **Staging smoke tests (future):** `cicd-and-deployment.md` documents a second
> real-environment test suite in `e2e/staging/` that runs against the live staging
> URL using a real Supabase database and Stripe test mode. This suite does not
> exist yet. When you add it, also add `playwright.staging.config.ts` (see the
> [Playwright config for staging](cicd-and-deployment.md#playwright-config-for-staging)
> section) and extend `staging.yml` with a post-deploy step to run it.

### 5.2 Promote to production

When staging looks good, open a pull request from `main` → `production`:

```bash
# Create the PR via GitHub UI or CLI:
gh pr create --base production --head main --title "Release: <brief description>"
```

Use the checklist in the PR description to confirm readiness:

```markdown
## Production Deploy Checklist
- [ ] Verified on staging (played through all affected flows)
- [ ] No destructive or non-reversible migrations
- [ ] Stripe/payment flows tested if changed
- [ ] Player data is safe if a rollback is needed
- [ ] A snapshot of the production database is saved
```

**Saving a database snapshot** before promoting (recommended):

In the Supabase dashboard go to **Database → Backups** and trigger a manual
backup, or use the CLI:

```bash
supabase db dump --project-ref <PROD_PROJECT_REF> -f backup-$(date +%Y%m%d).sql
```

After merging the PR:

1. The `production.yml` workflow starts and **pauses** at the required-reviewer
   gate
2. Go to **Actions → Deploy to production → Review pending deployments** and
   approve
3. The migration runs against the production Supabase project
4. Vercel deploys the frontend to the production domain automatically
5. Verify the production URL

---

## 6. Environment Variables Reference

### Frontend (Vercel)

These are set per Vercel environment (see Step 2.3):

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project REST URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for the Supabase client | `eyJ...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for browser) | `pk_live_...` / `pk_test_...` |

### Supabase Edge Functions

These are set via `supabase secrets set` per project (see Step 4.3):

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (never exposed to browser) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the Supabase edge runtime — you do not need to set them manually.

### Local Development

Copy the templates from the repository root:

```bash
cp .env.example .env                                  # Supabase + Stripe keys for Vite
cp .env.local.example .env.local                      # Local Supabase instance keys
cp supabase/functions/.env.example supabase/functions/.env  # Edge function secrets
```

Fill in the values from `supabase status` (for local keys) and the Supabase
and Stripe dashboards. These files are listed in `.gitignore` and must never be
committed.

---

## 7. Ongoing Workflow

After initial setup, the day-to-day flow is:

```
1. Create a feature branch from main
2. Write code, run tests locally (npm run test, npm run test:e2e)
3. Open a PR → ci.yml runs (lint, build, unit tests, E2E)
4. Merge to main → staging.yml runs migrations + Vercel deploys (~5 min)
5. Play-test on the staging Vercel preview URL
6. Open a PR from main → production with the deploy checklist
7. Merge → production.yml pauses for reviewer approval
8. Approve → migration runs + Vercel deploys production (~5 min)
9. Verify on the production domain
```

See [cicd-and-deployment.md](cicd-and-deployment.md) for the full branching
model, database migration safety rules, and the two-phase migration pattern for
destructive schema changes.
