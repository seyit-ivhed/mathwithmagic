# Analytics Events

First-party analytics implemented via Supabase (`play_events` table). All events are anonymous — no personal identifiers are stored. `session_id` is a memory-only UUID generated fresh per page load and never persisted.

Related GitHub issue: `copilot/add-first-party-analytics`

---

## Schema

Every event shares this base structure:

| Field | Type | Description |
|---|---|---|
| `session_id` | `text` | Memory-only UUID, per page load |
| `event_type` | `text` | Event name (see below) |
| `payload` | `jsonb` | Event-specific data (nullable) |
| `attribution` | `jsonb` | UTM source/campaign/medium from URL params (nullable) |
| `created_at` | `timestamptz` | Server timestamp |

---

## Attribution

If the URL contains `utm_source` on load, `{ source, campaign, medium }` is captured in `sessionStorage` and attached to every event as `attribution`. Individual-level ad identifiers (`fbclid`, `gclid`) are intentionally excluded.

---

## Events

### Session

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `session_started` | `{ has_progress: boolean }` | `useInitializeGame` | Fired once on app init. `has_progress` indicates whether saved game state exists. |

---

### Onboarding / Cover

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `cover_start_clicked` | `{ has_progress: boolean, destination: 'adventure' \| 'difficulty' }` | `ChronicleBook` | Player taps the start button. Destination is `'adventure'` if progress exists, otherwise `'difficulty'`. |
| `cover_login_clicked` | — | `ChronicleBook` | Player taps the login link on the cover. |

---

### Authentication

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `login_succeeded` | — | `ChronicleBook` | Successful sign-in. |
| `login_failed` | — | `BookLogin` | Sign-in attempt failed. |
| `password_reset_requested` | — | `BookForgotPassword` | Reset email submitted. |
| `password_reset_failed` | — | `BookForgotPassword` | Reset email submission failed. |

---

### Difficulty Selection

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `initial_difficulty_selected` | `{ difficulty: number }` | `BookDifficulty` | Player picks a difficulty for the first time. |

---

### Adventure / Map

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `node_clicked` | `{ adventure_id: string, node_index: number, encounter_type: string }` | `AdventurePage` | Player taps a node on the map. |
| `encounter_difficulty_selected` | `{ adventure_id: string, node_index: number, encounter_type: string, difficulty: number }` | `AdventurePage` | Player confirms a difficulty before starting a node. |

---

### Encounters

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `encounter_started` | `{ adventure_id: string, node_index: number, difficulty: number, encounter_type: string }` | `EncounterPage` | Encounter screen mounts. |
| `encounter_completed` | `{ adventure_id: string, node_index: number, difficulty: number, turn_count: number }` | `EncounterPage` | Player reaches VICTORY phase. |
| `encounter_failed` | `{ adventure_id: string, node_index: number, difficulty: number, turn_count: number }` | `EncounterPage` | Player reaches DEFEAT phase. |
| `special_attack_attempted` | `{ adventure_id: string, node_index: number, success: boolean }` | `EncounterPage` | Player uses a special attack. |

---

### Puzzles

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `puzzle_started` | `{ adventure_id: string, node_index: number, puzzle_type: string, difficulty: number }` | `PuzzlePage` | Puzzle data loaded and displayed. |
| `puzzle_completed` | `{ adventure_id: string, node_index: number, puzzle_type: string, difficulty: number }` | `PuzzlePage` | Player solves the puzzle. |

---

### Premium / Monetisation

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `premium_store_viewed` | `{ source_adventure_id: string \| null }` | `PremiumStoreModal` | Premium store modal opens. `source_adventure_id` identifies which adventure triggered it (null if opened directly). |
| `premium_unlock_clicked` | — | `PremiumStoreModal` | Player taps the unlock/buy button in the store. Redirects to checkout with `ref_session` in URL. |
| `checkout_viewed` | `{ ref_session_id: string \| null }` | `CheckoutPage` | Checkout page loads for an authenticated non-anonymous user. `ref_session_id` links back to the originating game session. |
| `account_creation_viewed` | `{ ref_session_id: string \| null }` | `AccountCreationStep` | Account creation form shown during checkout flow. |
| `account_created` | `{ ref_session_id: string \| null }` | `AccountCreationStep` | New account successfully created. |
| `account_creation_failed` | `{ ref_session_id: string \| null }` | `AccountCreationStep` | Account creation attempt failed. |
| `payment_submitted` | `{ ref_session_id: string \| null, content_pack_id: string }` | `CheckoutForm` | Player submits the payment form. |
| `payment_succeeded` | `{ ref_session_id: string \| null, content_pack_id: string }` | `CheckoutForm` | Payment confirmed and verified. |
| `payment_failed` | `{ ref_session_id: string \| null }` | `CheckoutForm` | Payment failed (Stripe error or webhook timeout). |
| `payment_verification_timeout` | `{ ref_session_id: string \| null }` | `CheckoutForm` | Webhook confirmation did not arrive in time. |

---

## Cross-session attribution

The checkout flow spans two sessions (game → checkout page). The game session passes its `session_id` as `ref_session` in the URL (`/checkout.html?ref_session=<uuid>`). The checkout page reads this via `analyticsService.getRefSessionId()` and attaches it as `ref_session_id` in all payment events, enabling cross-session funnel analysis.

---

## Privacy

- No user IDs, emails, or device fingerprints are stored.
- `session_id` is in-memory only and resets on every page load.
- UTM attribution excludes individual-level ad click identifiers (`fbclid`, `gclid`).
- RLS policy allows anonymous insert only — no read access for clients.
