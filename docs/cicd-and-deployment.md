# CI/CD and Deployment Strategy

## Overview

This document describes the CI/CD pipeline and deployment methodology for
Math with Magic. The goal is to deploy to live production multiple times
per day with confidence, while protecting player data from accidental changes.

---

## Core Principles

1. **Staging is always ahead of production** — `main` deploys to staging automatically; production is promoted intentionally.
2. **Production is a deliberate act** — you must explicitly promote staging to production; it never happens by accident.
3. **Migrations are backward-compatible** — the running app code must stay functional before and after a migration, so app rollbacks never corrupt data.
4. **CI is the safety net** — lint, type-check, unit tests, and E2E tests all run before staging deploys. You only see staging if everything passes.

---

## Branch Model

```
feature/xxx  →  main  →  [staging environment]
                               ↓  (intentional promotion)
                          production  →  [production environment]
```

| Branch | Environment | Deployment trigger |
|---|---|---|
| `main` | Staging | Automatic on merge |
| `production` | Production | on PR to production branch |

---

## Environments

### Frontend (Vercel)

Two environments configured in the Vercel project settings:

- **Production branch:** `production` → serves the live domain
- **Preview branch:** `main` → serves a stable staging URL

### Backend (Supabase)

Two separate Supabase projects:

- **`mathwithmagic-staging`** — linked to `main` branch deployments
- **`mathwithmagic-prod`** — linked to `production` branch deployments only

Environment variables are scoped per Vercel environment so staging always
points to the staging Supabase project and production always points to the
production Supabase project.

---

## Promoting to Production

Open a pull request from `main` → `production`. Use a checklist to confirm
readiness before merging:

```markdown
## Production Deploy Checklist
- [ ] Verified on staging (played through all affected flows)
- [ ] No destructive or non-reversible migrations
- [ ] Stripe/payment flows tested if changed
- [ ] Player data is safe if a rollback is needed
- [ ] A snapshot of player database is saved
```

Every merge to `production` becomes a permanent record of what shipped and why.

---

## GitHub Actions Workflows

### `staging.yml` — runs on push to `main`

```yaml
on:
  push:
    branches: [main]
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:coverage
      - run: supabase db push --project-ref ${{ secrets.STAGING_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      # Vercel deploys automatically via its GitHub integration
```

### `production.yml` — runs on push to `production`

```yaml
on:
  push:
    branches: [production]
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production   # optional: add required reviewers in GitHub settings
    steps:
      - uses: actions/checkout@v4
      - run: supabase db push --project-ref ${{ secrets.PROD_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      # Vercel deploys automatically via its GitHub integration
```

The `environment: production` declaration in the production workflow allows
adding a **required reviewer** gate in GitHub settings — even just yourself —
so migrations cannot run until you explicitly approve the deployment in the
GitHub Actions UI.

---

## Database Migrations (Player Data Safety)

Migrations that affect player data must be **backward-compatible** at every
step. The running app code must work correctly both before and after the
migration runs.

Before each production deployment we should save a production database snapshot in case we need to recover.

### Two-phase migration pattern

For any destructive change (renaming a column, changing a type, removing a
field), split it into two separate deployments:

**Phase 1 — add without removing (deploy to staging, soak for at least one session):**
```sql
-- Add the new structure alongside the old
ALTER TABLE players ADD COLUMN new_col text;
-- Backfill from old data if needed
UPDATE players SET new_col = old_col;
```

**Phase 2 — remove the old (only after confirming Phase 1 is stable in production):**
```sql
ALTER TABLE players DROP COLUMN old_col;
```

### Never in a single migration:
- Rename a column that the current app code reads
- Drop a column before deploying app code that stops using it
- Change a column type in a way that breaks existing rows

---

## Staging Environment Testing Strategy

Two separate test suites serve different purposes and should never be merged
into one.

### Mocked E2E tests — CI on every PR

Located in `e2e/`. All external services (Supabase, Stripe) are intercepted
and mocked. These test UI logic and component behaviour in isolation.

- Fast (seconds), run automatically via `ci.yml` on every PR
- No real credentials needed, no data cleanup required
- Keep these tests mocked — do not try to point them at real services

### Real-environment smoke tests — post-deploy to staging

Located in `e2e/staging/`. Run against the live staging URL with a real
Supabase staging database and Stripe test mode API. These test that the whole
system works together after a deploy.

- Triggered automatically after `main` deploys to staging
- Require a seed step (create test account) and a teardown step (delete it)
- Cover critical paths only — the flows that, if broken, mean no player can
  use the product

**What to cover:**

1. First play flow
  - Player starts a new journey
  - Completes the first encounter
  - Levels up both of their companions
2. Checkout flow
  - Player signs up with a real email
  - Completes checkout with stripe test card
  - Unlocks the second adventure
  - Starts the first encounter of the second adventure
3. Login flow
  - Player signs in with an existing account
  - All the existing game state is preserved

### Stripe test cards

Always use Stripe **test mode keys** (`sk_test_...`) in staging. Useful cards:

| Card number | Behaviour |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires authentication (3DS) |
| `4000 0000 0000 9995` | Declined |

### Data isolation

Staging tests share a live database, so take steps to avoid conflicts:

- Use a unique email per run: `test+{timestamp}@yourdomain.com`
- Delete the test account in Playwright's `afterAll` teardown
- Never run staging tests in parallel across multiple CI jobs

### Playwright config for staging

Add a second config file pointed at the staging URL:

```ts
// playwright.staging.config.ts
export default {
  use: {
    baseURL: process.env.STAGING_URL,
  },
  testDir: './e2e/staging',
};
```

Run manually with:

```bash
STAGING_URL=https://your-staging-url.vercel.app npx playwright test --config=playwright.staging.config.ts
```

---

## Daily Development Flow

```
1. Create feature branch from main
2. Write code, run tests locally
3. Open PR → CI runs (lint, build, unit tests, E2E)
4. Merge to main → staging deploys automatically (~5 min)
5. Play-test on staging URL
6. Satisfied? → PR to main:production
7. Production deploys (~5 min)
8. Verify on production
```

Total time from "merge to main" to "live in production": 10–15 minutes,
with two manual checkpoints (merge to main, push to production).

---

## Required Secrets

Configure these in the GitHub repository settings under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token (from supabase.com/dashboard) |
| `STAGING_PROJECT_REF` | Project ref for the staging Supabase project |
| `PROD_PROJECT_REF` | Project ref for the production Supabase project |

Vercel secrets (Stripe keys, Supabase URLs) are managed in the Vercel dashboard
per environment, not in GitHub.

---

## What to Build Next

When implementing this setup, work in this order:

1. **Deploy frontend to Vercel** — connect the GitHub repo, set `production` as the production branch
2. **Create staging Supabase project** — mirror the schema, connect to `main` deployments
3. **Add `ci.yml`** — lint + build + unit tests on every PR
4. **Add `staging.yml`** — migrations + confirmation that staging deploys work
5. **Add `production.yml`** — migrations gate on the `production` branch
6. **Configure GitHub environment** — add yourself as a required reviewer for the `production` environment
7. **Add Sentry** — production error visibility so you know immediately if something breaks
8. **Add Playwright to CI** — E2E tests against Vercel preview URLs on every PR
