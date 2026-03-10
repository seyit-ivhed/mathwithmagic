# Math with Magic

A browser-based educational game designed to teach math concepts to children
through space-themed missions and challenges.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Framer Motion, Zustand
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Drizzle ORM
- **Testing:** Vitest, Playwright

## Prerequisites

- Node.js (v18 or higher recommended)
- npm
- **[Deno](https://deno.land/)** (Required for Edge Function testing)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mathwithmagic
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment files:** Copy the example templates and fill in your values:
   ```bash
   cp .env.example .env                                  # Production Supabase + Stripe keys
   cp .env.local.example .env.local                      # Local Supabase keys (from `supabase status`)
   cp supabase/functions/.env.example supabase/functions/.env  # Stripe secret keys for Edge Functions
   ```

## Local HTTPS Setup

The dev server runs over HTTPS. You need locally-trusted SSL certificates:

1. **Install mkcert:**
   ```bash
   brew install mkcert
   mkcert -install
   ```

2. **Generate certificates** (from the project root):
   ```bash
   mkcert localhost 127.0.0.1
   ```

   This creates `localhost+1.pem` and `localhost+1-key.pem` in the project root (git-ignored).

## Running the Project

To run the full application, you will need to start both the client (frontend)
and the server (backend) in separate terminal instances.

### 1. Start the Client (Frontend)

Open a new terminal window (from the root directory) and run:

```bash
npm run dev
```

This will start the Vite development server. Open your browser and navigate to
the URL shown in the terminal (usually `https://127.0.0.1:5173`).

## Backend Setup (Supabase)

The project uses Supabase for authentication, database, and edge functions.

### Local Development

We use a local Supabase instance run via Docker.

**1. Generate a signing key (first-time only):** The local Supabase instance
uses a pinned signing key so that API keys stay stable across restarts. Generate
one before your first `supabase start`:

```bash
npx supabase gen signing-key
```

This file is git-ignored. Without it, keys regenerate on every restart and your
`.env.local` will go out of sync.

**2. Manage Local Secrets:** To use features like Stripe payments locally, you
must set your API keys. If you haven't already done so in the Installation
step, copy the template and fill in the values:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Add your secrets there (this file is git-ignored and safe):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart services to load the keys: `npm run deploy-supabase`

**3. View Edge Function Logs:** Supabase Edge Functions run effectively in a
Docker container locally. To view real-time logs (including `console.log` from
your functions):

```bash
docker logs -f supabase_edge_runtime_workspace-1
```

**4. Test Webhooks Locally:** To receive Stripe events (like successful
payments) on your local machine:

1. **Install Stripe CLI:** `brew install stripe/stripe-cli/stripe`
2. **Login:** `stripe login`
3. **Forward events:**
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```
4. **Copy the Signing Secret:** The command will output a secret starting with
   `whsec_...`.
5. **Update .env:** Paste this into `supabase/functions/.env` as
   `STRIPE_WEBHOOK_SECRET`.
6. **Restart:** Run `npm run deploy-supabase` to apply the new secret.

### Production Deployment

1. **Database Migrations:** The project uses a consolidated migration strategy.
   - `20240106000000_full_schema.sql`: Contains the entire schema (Players, Game
     States, Payments, Entitlements).

2. **Edge Functions:** Deploy the payment logic:
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy stripe-webhook
   ```

3. **Environment Secrets:** Set the required secrets in your live Supabase
   project:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing

### Unit Tests (Vitest)

We use **Vitest** for unit testing.

- **Run all unit tests:**
  ```bash
  npm run test
  ```

- **Run tests with UI:**
  ```bash
  npm run test:ui
  ```

- **Check test coverage:**
  ```bash
  npm run test:coverage
  ```

- **Check test coverage for a specific directory:**
  ```bash
  npm run test:coverage -- src/stores/game
  ```

### End-to-End Tests (Playwright)

We use **Playwright** for end-to-end testing. Tests live in the `/e2e` directory and
are automatically served by the Vite dev server when the test suite runs. No real
Supabase credentials are required — the Playwright config injects fake credentials and
the tests intercept any outbound auth requests.

| File | Covers |
|---|---|
| `e2e/onboarding.spec.ts` | Cover page → difficulty selection → first adventure chapter |
| `e2e/adventure-map.spec.ts` | Adventure map → encounter node → difficulty modal → encounter start |
| `e2e/encounter.spec.ts` | Encounter battle page loads, unit cards render, back navigation |
| `e2e/settings.spec.ts` | Settings modal accessible from all major pages |

#### Setup

> **Note:** This project uses Deno's npm compatibility layer, which causes
> `npx playwright install` to install browsers for the wrong Playwright version.
> Always use the npm scripts below instead.

- **Install Playwright browsers (first-time or after upgrading `@playwright/test`):**
  ```bash
  npm run playwright:install
  ```

#### Conventions

- Selectors always use `data-testid` attributes — never element text.
- All button clicks use the `{ force: true }` option.
- Supabase network calls are intercepted via `page.route()` in `e2e/helpers.ts`
  so tests never depend on a live backend.

- **Run all E2E tests:**
  ```bash
  npm run test:e2e
  ```

- **Run E2E tests with UI mode:**
  ```bash
  npm run test:e2e -- --ui
  ```

- **Run a single test file:**
  ```bash
  npm run test:e2e -- e2e/onboarding.spec.ts
  ```

- **View the last HTML report:**
  ```bash
  node node_modules/@playwright/test/cli.js show-report
  ```

### Edge Function Tests (Deno)

We use **Deno** for testing Supabase Edge Functions.

**Installation (if needed):**

```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Note on Dependencies:** The project includes a `deno.json` file that enables
automatic installation of `npm:` dependencies (like Stripe and Supabase JS).
Deno will automatically download these the first time you run the tests.

- **Run all edge function tests:**
  ```bash
  deno test --allow-all supabase/functions/
  ```

- **Run a specific edge function test:**
  ```bash
  deno test --allow-all supabase/functions/create-payment-intent/index.test.ts
  ```
