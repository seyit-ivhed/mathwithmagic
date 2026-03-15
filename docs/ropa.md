# Records of Processing Activities (RoPA)

> **Document type:** Internal compliance record — not published to users
> **Legal basis:** GDPR Article 30
> **Controller:** Outlean AB
> **Privacy contact:** hello@mathwithmagic.com
> **Last reviewed:** 2026-03-13

---

## About this document

GDPR Article 30 requires data controllers to maintain a written record of all processing activities carried out under their responsibility. This document fulfils that obligation for Outlean AB. It is an internal document and must be made available to the supervisory authority (IMY, Sweden) upon request.

---

## Controller details

| Field | Value |
|---|---|
| **Name** | Outlean AB |
| **Type** | Aktiebolag (AB) — Swedish limited company |
| **Country** | Sweden (EU) |
| **Privacy contact** | hello@mathwithmagic.com |
| **Supervisory authority** | IMY — Integritetsskyddsmyndigheten, Sweden |

No Data Protection Officer (DPO) has been appointed.

---

## Processing activities

### 1. Account authentication

| Field | Details |
|---|---|
| **Purpose** | Allow parents/guardians to create and access their account |
| **Lawful basis** | Art. 6(1)(b) — Contract (necessary to provide the account service) |
| **Data subjects** | Parents/guardians of children ages 6–8 |
| **Personal data** | Email address, hashed password, Supabase session token |
| **Recipients** | Supabase (authentication and database hosting), Resend (password recovery emails) |
| **International transfers** | Supabase is US-headquartered; data hosted in an EU region to avoid cross-border transfer. If a non-EU region is used, the transfer relies on Supabase's Standard Contractual Clauses (SCCs). |
| **Retention** | Until the account is deleted |

---

### 2. Game progress storage

| Field | Details |
|---|---|
| **Purpose** | Persist adventure completion, companion levels, and difficulty preferences to enable cross-device play |
| **Lawful basis** | Art. 6(1)(b) — Contract (necessary for the cross-device save feature) |
| **Data subjects** | Parents/guardians of children ages 6–8 |
| **Personal data** | Game progress data linked to the authenticated account (no direct identifiers beyond the account association) |
| **Recipients** | Supabase (database hosting) |
| **International transfers** | Same as §1 above |
| **Retention** | Until the account is deleted |

---

### 3. Anonymous analytics

| Field | Details |
|---|---|
| **Purpose** | Understand how the game is played in order to improve the product |
| **GDPR applicability** | Session IDs are anonymous, tab-scoped, and cannot be linked to any individual. This data does not constitute personal data under GDPR, so no lawful basis is required. Included in this RoPA for completeness. |
| **Data subjects** | Anonymous game sessions (tab-scoped, not linked to any account or person) |
| **Personal data** | None — anonymous session ID, first-visit date (date only), and campaign identifier (campaign slug only). No re-identification possible. |
| **Recipients** | Supabase (database hosting) |
| **International transfers** | Same as §1 above |
| **Retention** | Indefinitely — not personal data |

---

### 4. Payment processing

| Field | Details |
|---|---|
| **Purpose** | Process the one-time premium purchase |
| **Lawful basis** | Art. 6(1)(b) — Contract (necessary to fulfil the purchase) |
| **Data subjects** | Parents/guardians of children ages 6–8 |
| **Personal data** | Payment data is entered directly into Stripe's hosted form; Outlean AB does not receive or store card data. Stripe receives the parent/guardian's payment details. |
| **Recipients** | Stripe (payment processing) |
| **International transfers** | Stripe is US-headquartered and is covered by the EU–US Data Privacy Framework (DPF) adequacy decision (July 2023). |
| **Retention** | Stripe retains payment records for its own legal obligations. Outlean AB retains no payment data. |

---

### 5. Product update emails

| Field | Details |
|---|---|
| **Purpose** | Notify parents/guardians of new game content and updates |
| **Lawful basis** | Art. 6(1)(a) — Consent (explicit opt-in checkbox at account creation; withdrawable at any time from account settings) |
| **Data subjects** | Parents/guardians who have opted in |
| **Personal data** | Email address |
| **Recipients** | Supabase (stores the consent flag and email address), Resend (email delivery) |
| **International transfers** | Same as §1 above |
| **Retention** | Until the account is deleted or consent is withdrawn |

---

## Data not collected

The following categories of data are explicitly not collected:

- No personal data from children — children play without accounts and provide no information
- No device fingerprints or persistent user identifiers
- No advertising identifiers (fbclid, gclid, etc.)
- No cross-site tracking or behavioural advertising data
- No data sold or shared with third parties for commercial purposes

---

## Recipients and sub-processors

| Processor | Role | Location | Transfer mechanism | DPA |
|---|---|---|---|---|
| **Supabase** | Authentication and database hosting | US-headquartered; data in EU region | EU region avoids transfer; SCCs available if needed | Must be signed in Supabase dashboard |
| **Stripe** | Payment processing | US-headquartered | EU–US Data Privacy Framework (DPF) adequacy decision | Must be signed in Stripe dashboard |
| **Resend** | Email delivery (transactional and product update emails) | US-headquartered | EU–US Data Privacy Framework (DPF) adequacy decision | Must be signed — see [resend.com/legal/dpa](https://resend.com/legal/dpa) |

See [`docs/legal.md §11`](legal.md#11-data-processing-agreements-dpas) for DPA signing instructions.

---

## Retention summary

| Data | Retention period |
|---|---|
| Email address and hashed password | Until account deletion |
| Supabase session token | Cleared when the browser tab is closed (sessionStorage only) |
| Game progress data | Until account deletion |
| Anonymous analytics (session IDs) | Indefinitely — not personal data |
| Cohort date and campaign identifier | Stored in browser localStorage as part of the player store; cleared on account deletion or storage clear. Server-side: retained indefinitely as part of anonymous analytics (not personal data). |
| Payment records | Held by Stripe under their own retention policy; not stored by Outlean AB |
| Product update consent flag | Until account deletion or withdrawal of consent |

---

## Technical and organisational security measures

As required by Article 30(1)(g), the following measures are in place (ref. Article 32):

| Measure | Details |
|---|---|
| **Encryption in transit** | All data transmitted over HTTPS/TLS |
| **Encryption at rest** | Supabase encrypts stored data at rest |
| **Password hashing** | Passwords hashed by Supabase Auth (bcrypt) — plaintext passwords are never stored |
| **Session management** | Session tokens stored in browser `sessionStorage` only; cleared when the tab is closed |
| **Access control** | Supabase Row Level Security (RLS) ensures users can only access their own data |
| **Payment isolation** | Card data entered directly into Stripe's hosted form; never touches Outlean AB servers |
| **No child data** | Children play without accounts, eliminating risk of child data exposure |

---

## Review log

| Date | Reviewer | Notes |
|---|---|---|
| 2026-03-13 | Outlean AB | Initial document created |
