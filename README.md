# Space Math Academy (PlayToLearn)

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
   cd playtolearn
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:** Navigate to the server directory and
   install dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment files:** Copy the example templates and fill in your values:
   ```bash
   cp .env.example .env                                  # Production Supabase + Stripe keys
   cp .env.local.example .env.local                      # Local Supabase keys (from `supabase status`)
   cp supabase/functions/.env.example supabase/functions/.env  # Stripe secret keys for Edge Functions
   ```

## Running the Project

To run the full application, you will need to start both the client (frontend)
and the server (backend) in separate terminal instances.

### 1. Start the Server (Backend)

Open a terminal and run:

```bash
cd server
npm run dev
```

This will start the backend server in watch mode using `tsx`.

### 2. Start the Client (Frontend)

Open a new terminal window (from the root directory) and run:

```bash
npm run dev
```

This will start the Vite development server. Open your browser and navigate to
the URL shown in the terminal (usually `http://localhost:5173`).

## Backend Setup (Supabase)

The project uses Supabase for authentication, database, and edge functions.

### Local Development

We use a local Supabase instance run via Docker.

**1. Manage Local Secrets:** To use features like Stripe payments locally, you
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

**2. View Edge Function Logs:** Supabase Edge Functions run effectively in a
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

We use **Playwright** for end-to-end testing.

- **Run all E2E tests:**
  ```bash
  npx playwright test
  ```

- **Run E2E tests with UI mode:**
  ```bash
  npx playwright test --ui
  ```

- **View the last HTML report:**
  ```bash
  npx playwright show-report
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
