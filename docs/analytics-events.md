# Analytics Events

First-party analytics implemented via Supabase (`play_events` table). All events are anonymous — no personal identifiers are stored. `session_id` is persisted in `sessionStorage` so it survives page refreshes and navigations within the same browser tab (including the game ↔ checkout flow). It is cleared when the tab closes.

Related GitHub issue: `copilot/add-first-party-analytics`

---

## Schema

Every event shares this base structure:

| Field | Type | Description |
|---|---|---|
| `session_id` | `text` | Tab-scoped UUID, persisted in `sessionStorage`. Shared across game and checkout pages within the same tab. |
| `event_type` | `text` | Event name (see below) |
| `payload` | `jsonb` | Event-specific data (nullable) |
| `attribution` | `jsonb` | UTM source/campaign/medium from URL params (nullable) |
| `created_at` | `timestamptz` | Server timestamp |

---

## Attribution

If the URL contains `utm_source` on load, `{ source, campaign, medium }` is captured in `sessionStorage` and attached to every event as `attribution`. Individual-level ad identifiers (`fbclid`, `gclid`) are intentionally excluded.

---

## Events

### Landing Page

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `landing_viewed` | — | `LandingPage` | Landing page mounts. |
| `landing_cta_clicked` | — | `LandingHero` | Player clicks the "Start Your Adventure" CTA button. |

---

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
| `password_reset_requested` | — | `BookForgotPassword` | Reset email submitted from the forgot-password form. |
| `password_reset_failed` | — | `BookForgotPassword` | Reset email submission failed from the forgot-password form. |
| `password_reset_email_sent` | — | `ChangePasswordSettings` | Recovery email sent successfully from account settings. |
| `password_reset_email_failed` | — | `ChangePasswordSettings` | Recovery email failed to send from account settings. |
| `password_reset_succeeded` | — | `ResetPasswordPage` | Password updated successfully after following the recovery link. |
| `password_reset_update_failed` | — | `ResetPasswordPage` | Password update failed after following the recovery link. |

---

### Account Management

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `account_deletion_triggered` | — | `DeleteAccountSettings` | Player confirmed account deletion; fired before the server-side delete call so the session is still valid. |
| `account_delete_failed` | — | `DeleteAccountSettings` | Server-side account deletion failed (wrong password or other error). |

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
| `premium_unlock_clicked` | — | `PremiumStoreModal` | Player taps the unlock/buy button in the store. |
| `checkout_viewed` | — | `CheckoutPage` | Checkout page loads for an authenticated non-anonymous user. |
| `account_creation_viewed` | — | `AccountCreationStep` | Account creation form shown during checkout flow. |
| `account_created` | — | `AccountCreationStep` | New account successfully created. |
| `account_creation_failed` | — | `AccountCreationStep` | Account creation attempt failed. |
| `account_signed_in` | — | `AccountCreationStep` | Returning player signed in with existing credentials during checkout (triggered when the "email already registered" path is taken). |
| `sign_in_failed` | — | `AccountCreationStep` | Sign-in attempt failed during the "email already registered" fallback flow. |
| `payment_submitted` | `{ content_pack_id: string }` | `CheckoutForm` | Player submits the payment form. |
| `payment_succeeded` | `{ content_pack_id: string }` | `CheckoutForm` | Payment confirmed and verified. |
| `payment_failed` | — | `CheckoutForm` | Payment failed (Stripe error or webhook timeout). |
| `payment_verification_timeout` | — | `CheckoutForm` | Webhook confirmation did not arrive in time. |

---

## Session continuity across checkout

The game and checkout pages share the same `session_id` via `sessionStorage`. When a player navigates from the game to `checkout.html` and back, all events — including account creation and payment — are recorded under the same session, enabling end-to-end funnel analysis without any URL parameter passing.

---

## Privacy

- No user IDs, emails, or device fingerprints are stored.
- `session_id` is scoped to the browser tab via `sessionStorage` and is cleared when the tab closes.
- UTM attribution excludes individual-level ad click identifiers (`fbclid`, `gclid`).
- RLS policy allows anonymous insert only — no read access for clients.
