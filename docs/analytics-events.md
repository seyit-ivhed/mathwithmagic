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
| `session_ended` | `{ duration_ms: number }` | `App.tsx` (`beforeunload`) | Fired when the page unloads. |

---

### Onboarding / Cover

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `cover_viewed` | `{ has_progress: boolean }` | `BookCover` | Cover page mounted. |
| `cover_start_clicked` | `{ has_progress: boolean, destination: 'adventure' \| 'difficulty' }` | `BookCover` | Player taps the start button. Destination is `'adventure'` if progress exists, otherwise `'difficulty'`. |
| `cover_login_clicked` | — | `BookCover` | Player taps the login link on the cover. |

---

### Authentication

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `login_viewed` | — | `BookLogin` | Login form mounted. |
| `login_succeeded` | — | `BookLogin` | Successful sign-in. |
| `login_failed` | — | `BookLogin` | Sign-in attempt failed. |
| `password_reset_viewed` | — | `BookForgotPassword` | Forgot-password screen mounted. |
| `password_reset_requested` | — | `BookForgotPassword` | Reset email submitted. |
| `password_reset_failed` | — | `BookForgotPassword` | Reset email submission failed. |

---

### Difficulty Selection

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `difficulty_page_viewed` | — | `BookDifficulty` | Difficulty selection screen mounted. |
| `initial_difficulty_selected` | `{ difficulty: string }` | `BookDifficulty` | Player picks a difficulty for the first time. |

---

### Adventure / Map

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `adventure_begun` | `{ adventure_id: string, has_progress: boolean }` | `ChronicleBook` | Player enters an adventure (new or resumed). |
| `map_viewed` | `{ adventure_id: string, current_node: number }` | `AdventurePage` | Adventure map rendered. Fired when `adventureId` is set. |
| `node_clicked` | `{ adventure_id: string, node_index: number, encounter_type: string }` | `AdventurePage` | Player taps a node on the map. |
| `encounter_difficulty_selected` | `{ adventure_id: string, node_index: number, encounter_type: string, difficulty: string }` | `AdventurePage` | Player confirms a difficulty before starting a node. |
| `chapter_viewed` | `{ adventure_id: string, status: string }` | `ChapterPage` | A chapter page (story interstitial) becomes active. |
| `adventure_completed` | `{ adventure_id: string }` | `AdventurePage` | All nodes in an adventure are cleared. |
| `game_completed` | — | `AdventurePage` | Final adventure completed — all content finished. |

---

### Encounters

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `encounter_started` | `{ adventure_id: string, node_index: number, difficulty: string }` | `EncounterPage` | Encounter screen mounts. |
| `encounter_completed` | `{ adventure_id: string, node_index: number, difficulty: string }` | `EncounterPage` | Player reaches VICTORY phase. |
| `encounter_failed` | `{ adventure_id: string, node_index: number, difficulty: string }` | `EncounterPage` | Player reaches DEFEAT phase. |
| `encounter_abandoned` | `{ adventure_id: string, node_index: number, difficulty: string }` | `EncounterPage` | Player navigates away mid-encounter (not victory/defeat). |
| `special_attack_attempted` | `{ adventure_id: string, node_index: number, success: boolean }` | `EncounterPage` | Player uses a special attack. |

---

### Puzzles

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `puzzle_started` | `{ adventure_id: string, node_index: number, puzzle_type: string, difficulty: string }` | `PuzzlePage` | Puzzle data loaded and displayed. |
| `puzzle_completed` | `{ adventure_id: string, node_index: number, puzzle_type: string, difficulty: string }` | `PuzzlePage` | Player solves the puzzle. |
| `puzzle_abandoned` | `{ adventure_id: string, node_index: number }` | `PuzzlePage` | Player leaves the puzzle before completing it. |

---

### Premium / Monetisation

| Event | Payload | Where fired | Description |
|---|---|---|---|
| `premium_store_viewed` | `{ source_adventure_id: string \| null }` | `PremiumStoreModal` | Premium store modal opens. `source_adventure_id` identifies which adventure triggered it (null if opened directly). |
| `premium_unlock_clicked` | — | `PremiumStoreModal` | Player taps the unlock/buy button in the store. Redirects to checkout with `ref_session` in URL. |
| `premium_store_dismissed` | — | `PremiumStoreModal` | Player closes the store modal without purchasing. |
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
