# Legal & Compliance Reference

> **Company:** Outlean AB (registered limited company, Sweden)
> **Privacy contact:** seyit@outlean.net *(temporary — update after game domain is purchased)*
> **Last reviewed:** 2026-03-08

---

## Table of Contents

1. [Company & Jurisdiction](#1-company--jurisdiction)
2. [Documents Required](#2-documents-required)
3. [Data Inventory (What We Collect & Why)](#3-data-inventory)
4. [GDPR Compliance](#4-gdpr-compliance)
5. [COPPA Compliance](#5-coppa-compliance)
6. [Account Creation Flow — Consent Requirements](#6-account-creation-flow--consent-requirements)
7. [Legal Pages — Placement Requirements](#7-legal-pages--placement-requirements)
8. [Privacy Policy — Key Content Checklist](#8-privacy-policy--key-content-checklist)
9. [Terms of Service — Key Content Checklist](#9-terms-of-service--key-content-checklist)
10. [Refund Policy — Key Content Checklist](#10-refund-policy--key-content-checklist)
11. [Data Processing Agreements (DPAs)](#11-data-processing-agreements-dpas)
12. [Data Deletion Requirements](#12-data-deletion-requirements)
13. [Ongoing Obligations](#13-ongoing-obligations)
14. [Open Items & Blockers](#14-open-items--blockers)

---

## 1. Company & Jurisdiction

| Field | Value |
|---|---|
| **Legal entity** | Outlean AB |
| **Type** | Aktiebolag (AB) — Swedish limited company |
| **Primary law** | GDPR (EU) — Sweden is an EU member state |
| **Secondary law** | COPPA (US) — because the game is directed to children and serves US users |
| **Governing authority** | IMY — Integritetsskyddsmyndigheten (Swedish Data Protection Authority) |
| **No CCPA obligations** | No data sold or shared with third parties; can state this explicitly in Privacy Policy |

---

## 2. Documents Required

| Document | Status | Notes |
|---|---|---|
| **Privacy Policy** | Not yet drafted | Highest priority — informs all other documents |
| **Terms of Service** | Not yet drafted | Must reference Privacy Policy and Refund Policy |
| **Refund Policy** | Not yet drafted | Can be a section inside ToS; required by Stripe for digital goods |
| ~~Cookie Policy~~ | Not needed | Game uses Supabase session storage (not cookies) for auth only; Stripe cookies blocked; no tracking. State this in Privacy Policy instead. |
| ~~Separate COPPA notice~~ | Not needed | Children provide no personal data; COPPA disclosure lives inside Privacy Policy |

---

## 3. Data Inventory

### What is collected and why

| Data | Who provides it | Purpose | Legal basis (GDPR) | Stored by |
|---|---|---|---|---|
| Email address | Parent/guardian | Account access | Contract | Supabase |
| Password (hashed) | Parent/guardian | Account access | Contract | Supabase |
| Supabase session token | System-generated | Authentication after login | Contract necessity | Browser sessionStorage |
| Anonymous session ID | System-generated (tab-scoped) | Analytics | Legitimate interest | Supabase (`play_events`) |
| Game progress data | System-generated | Cross-device save, gameplay | Contract | Supabase |
| Payment data | Parent/guardian | Purchase processing | Contract | Stripe (we never store card data) |

### What is explicitly NOT collected

- No personal data from children — children play without accounts
- No device fingerprints or persistent user identifiers
- No advertising identifiers (fbclid, gclid, etc. are stripped from UTM tracking)
- No cross-site tracking
- No data sold or shared with third parties for any purpose
- No behavioral advertising — no advertisements of any kind in the game

### Data flow between processors

```
Parent/Guardian
    │
    ├── Email + password ──► Supabase (auth + DB) ── EU region required (see §4)
    │
    ├── Payment ──────────► Stripe (payment processing) ── card data never touches our servers
    │
    └── Game session ──────► Anonymous session ID in Supabase play_events
                             (cannot be linked back to account)
```

---

## 4. GDPR Compliance

Outlean AB is established in Sweden (EU) and is therefore a **data controller** under GDPR. All requirements below are mandatory.

### 4.1 Lawful Basis for Each Processing Activity

| Activity | Lawful basis | Notes |
|---|---|---|
| Storing email + password | Art. 6(1)(b) — Contract | Necessary to provide the account service |
| Supabase session token | Art. 6(1)(b) — Contract | Necessary for authentication |
| Game progress storage | Art. 6(1)(b) — Contract | Necessary for cross-device save feature |
| Payment processing | Art. 6(1)(b) — Contract | Necessary to fulfil purchase |
| Anonymous analytics | Art. 6(1)(f) — Legitimate interest | Session ID cannot be linked to a person; minimal privacy impact |
| Product update emails | Art. 6(1)(a) — Consent | Requires explicit opt-in checkbox at account creation; must be withdrawable at any time |

### 4.2 Data Subject Rights

Parents/guardians have the following rights regarding their account data:

| Right | How to fulfil |
|---|---|
| **Access** | Provide data export on request via email |
| **Rectification** | Allow email change in account settings |
| **Erasure** | Account deletion must delete all associated data (see §12) |
| **Portability** | Provide data in machine-readable format (JSON/CSV) on request |
| **Objection to legitimate interest** | Honour opt-out from analytics on request |
| **Withdraw consent** | Allow unsubscribe from product update emails at any time |

### 4.3 Data Retention

- **Account data (email, game progress):** Kept until account is deleted
- **Anonymous analytics:** May be retained indefinitely — session IDs cannot be linked to individuals
- **Stripe payment records:** Stripe retains these for their own legal obligations; we do not store payment data
- On account deletion: all personal data deleted immediately (see §12)

### 4.4 International Data Transfers

Supabase and Stripe are US-headquartered companies. GDPR requires a valid transfer mechanism when personal data leaves the EU:

- **Supabase:** Use an EU region (e.g. `eu-west-1` or `eu-central-1`) to avoid cross-border transfer entirely. If US region is used, rely on Supabase's Standard Contractual Clauses (SCCs) — available in Supabase dashboard.
- **Stripe:** Covered by EU-US Data Privacy Framework (DPF) adequacy decision (as of 2023).

**Action required:** Verify Supabase project region and switch to EU if needed (see §11).

### 4.5 Records of Processing Activities (RoPA)

GDPR Article 30 requires data controllers to maintain an internal record of processing activities. While companies with fewer than 250 employees are partially exempt, it is best practice to maintain one. This is an internal document, not published.

**Minimum RoPA content:**
- Name and contact details of controller (Outlean AB)
- Purposes of processing
- Categories of data subjects (parents/guardians)
- Categories of personal data (email, hashed password, session tokens)
- Categories of recipients (Supabase, Stripe)
- International transfer details
- Retention periods

### 4.6 IMY Registration

Sweden's data protection authority is [IMY (Integritetsskyddsmyndigheten)](https://www.imy.se). General registration is not required under GDPR (unlike the old Swedish PUL law). However:

- If you appoint a Data Protection Officer (DPO), you must register them with IMY
- Certain high-risk processing activities require a DPIA (Data Protection Impact Assessment)
- Since the app targets children, a lightweight DPIA is advisable even if not strictly mandatory

---

## 5. COPPA Compliance

COPPA (Children's Online Privacy Protection Act, US) applies because:
1. The game is directed at children ages 6–8
2. The game serves US users

**Key determination: Children provide no personal data.**

- Children play without accounts — they are anonymous throughout
- All account data (email, password) is provided by the parent/guardian
- Analytics use non-linkable session IDs

This means the heaviest COPPA obligation (verifiable parental consent before collecting child data) is satisfied by design. Remaining obligations:

| Obligation | How satisfied |
|---|---|
| Privacy Policy describing practices | Include COPPA section in Privacy Policy |
| No collection of personal data from children | Children play anonymously — no account required |
| No behavioural advertising to children | No advertisements in the game |
| Parent access/deletion rights | Account deletion deletes all game data (see §12) |
| Notice to parents | Privacy Policy clearly states children play without accounts |

---

## 6. Account Creation Flow — Consent Requirements

The account creation modal **must include** the following before the account is created:

```
[ Account Creation ]

  Email     ___________________________
  Password  ________________________

  ☐  I am 18 years or older and I am creating this account
     as a parent or guardian for my child.

  ☐  I agree to the Terms of Service and Privacy Policy.
     (Links open the full documents)

  ☐  (Optional) Notify me about new adventures and game updates.
     You can unsubscribe at any time.

  [ Create Account ]
```

**Rules:**
- The first two checkboxes are **mandatory** — the button must be disabled until both are checked
- The third checkbox (product updates) is **optional** — pre-unchecked, no dark patterns
- "Terms of Service" and "Privacy Policy" must be clickable links to the full documents
- These checkboxes must be rendered before any personal data is submitted to Supabase
- The consent choices (including whether product updates was opted into) should be stored

**At checkout (before Stripe form):**

```
  Payment is processed securely by Stripe.
  Outlean AB does not store your payment details.
```

No additional checkbox needed — the ToS accepted at account creation covers purchase terms.

---

## 7. Legal Pages — Placement Requirements

Legal pages must be accessible from at least these locations:

| Location | Links required |
|---|---|
| **Footer of Chronicles page** (first screen players see) | Privacy Policy, Terms of Service |
| **Account creation modal** | Privacy Policy, Terms of Service (inline links in consent checkboxes) |
| **Account settings / management page** | Privacy Policy, Terms of Service, link to request account deletion |
| **Checkout page** | Privacy Policy, Terms of Service |

### Page hosting options

- **Option A:** In-app pages rendered as modal or overlay (e.g. `/legal/privacy`, `/legal/terms`)
- **Option B:** Separate static HTML pages hosted alongside the game
- **Option C:** Linked to the game's domain once the domain is purchased

Recommendation: **Option A** — render as in-app pages so they're always accessible without leaving the game, and update them as the app evolves. Add a "Last updated" date at the top of each.

---

## 8. Privacy Policy — Key Content Checklist

When drafting the Privacy Policy, include all of the following:

### Identity & Contact
- [ ] Data controller: Outlean AB, Sweden
- [ ] Privacy contact email: *(update when game domain is purchased)*
- [ ] Date of last update

### Data Collected
- [ ] Email address and password (for account access only)
- [ ] Supabase session token (stored in browser sessionStorage, cleared when tab closes)
- [ ] Anonymous session ID for analytics (cannot be linked to any account or person)
- [ ] Game progress data (adventure completion, companion levels, difficulty preferences)
- [ ] Payment processing via Stripe (we do not store card data)

### What We Do NOT Collect
- [ ] No personal data from children — children play without accounts
- [ ] No device fingerprints or persistent identifiers
- [ ] No advertising identifiers
- [ ] No data sold or shared with third parties for commercial purposes

### Lawful Basis (for each activity — see §4.1)

### Children's Privacy (COPPA section)
- [ ] Game designed for children ages 6–8, played under parent supervision
- [ ] Children play without accounts and provide no personal information
- [ ] Accounts are for parents/guardians only (must be 18+)
- [ ] No behavioural advertising

### Third-Party Processors
- [ ] Supabase — authentication and database hosting (EU region; link to Supabase privacy policy)
- [ ] Stripe — payment processing (link to Stripe privacy policy)
- [ ] Neither processor sells or re-shares data

### Data Retention
- [ ] Account data retained until account deletion
- [ ] Anonymous analytics may be retained indefinitely (not linked to any person)
- [ ] Instructions for requesting account deletion

### Your Rights (GDPR)
- [ ] Right of access
- [ ] Right to rectification
- [ ] Right to erasure / account deletion
- [ ] Right to data portability
- [ ] Right to object to legitimate interest processing
- [ ] Right to withdraw consent (product update emails)
- [ ] Right to lodge a complaint with IMY (Sweden) or your local supervisory authority

### No Data Sales (explicit statement)
- [ ] "We do not sell, rent, or trade your personal data. No opt-out mechanism is provided because there is nothing to opt out of."

### Cookies / Browser Storage
- [ ] We do not use tracking cookies
- [ ] Stripe cookies are blocked in our implementation
- [ ] Supabase stores a session token in `sessionStorage` only while you are logged in; it is cleared when the browser tab is closed
- [ ] No third-party analytics cookies

### Contact for Privacy Requests
- [ ] How to exercise rights (email address)
- [ ] How to request account and data deletion
- [ ] Response time commitment (GDPR requires response within 30 days)

---

## 9. Terms of Service — Key Content Checklist

- [ ] Who can use the service (parents/guardians aged 18+, on behalf of their child)
- [ ] Description of the service (educational game, freemium model)
- [ ] Free vs. premium content (what's included in each tier)
- [ ] Account responsibilities (keep credentials secure, notify us of unauthorized access)
- [ ] Intellectual property (game content owned by Outlean AB; players retain no IP rights)
- [ ] Acceptable use (no reverse engineering, no resale of accounts or content)
- [ ] Account termination (we may suspend accounts for ToS violations)
- [ ] Disclaimers (no guarantee of uninterrupted service)
- [ ] Limitation of liability
- [ ] Refund policy (see §10) — can be a section here or a separate linked page
- [ ] Changes to terms (how we notify users of updates; what consent applies)
- [ ] Governing law: Sweden / EU law
- [ ] Dispute resolution: IMY for privacy; Swedish courts for general disputes
- [ ] Contact: seyit@outlean.net *(update when game domain is purchased)*

---

## 10. Refund Policy — Key Content Checklist

Stripe requires merchants to have a refund policy for digital goods.

- [ ] Digital goods are generally non-refundable after access is granted
- [ ] Exception: refund available within X days if content is not yet accessed (recommended: 14 days)
- [ ] EU consumer law note: EU customers have a 14-day right of withdrawal for digital content *unless* they explicitly waive it before download/access. Consider adding a waiver checkbox at checkout: "I understand that by starting to download/access digital content, I waive my 14-day right of withdrawal."
- [ ] How to request a refund (email address, what information to include)
- [ ] Processing time (e.g. 5–10 business days)

**Note on EU consumer right of withdrawal:** Under the EU Consumer Rights Directive, consumers have a 14-day withdrawal right for digital purchases. This right can be waived at checkout if the consumer explicitly consents and access begins immediately. Add this to the checkout flow.

---

## 11. Data Processing Agreements (DPAs)

GDPR Article 28 requires a written DPA with every data processor. These are self-serve:

| Processor | DPA location | Status |
|---|---|---|
| **Supabase** | Supabase dashboard → Settings → Legal / [supabase.com/legal/dpa](https://supabase.com/legal/dpa) | Not yet signed |
| **Stripe** | Stripe dashboard → Settings → Legal → Data Processing Agreement | Not yet signed |

Both DPAs are click-through — no lawyer required. Sign both before launching.

---

## 12. Data Deletion Requirements

When a parent deletes their account, **all associated data must be deleted**:

| Data | Location | Deletion method |
|---|---|---|
| Email + hashed password | Supabase Auth | Delete Supabase auth user |
| Game progress (adventure completion, companion levels, etc.) | Supabase DB | Cascade delete on user record |
| Product update consent flag | Supabase DB | Cascade delete on user record |
| Stripe customer record | Stripe | Call Stripe API to delete customer |
| Anonymous analytics | Supabase `play_events` | **Not deleted** — session IDs cannot be linked to the account; this is acceptable |

**Important:** The `play_events` analytics table records cannot be linked back to a user account by design (session ID is tab-scoped, cleared on tab close). This means:
- They do not constitute "personal data" under GDPR (no re-identification possible)
- They do not need to be deleted on account deletion
- State this clearly in the Privacy Policy

**Implementation requirements:**
- Account deletion must be triggerable by the parent from account settings (not just via email request)
- Deletion should be confirmed with a warning (irreversible action)
- Deletion of Stripe customer should happen via a Supabase Edge Function to keep Stripe secret key server-side
- Consider a grace period (e.g. 30 days soft-delete) before permanent erasure — document this in Privacy Policy

---

## 13. Ongoing Obligations

| Obligation | Frequency | Owner |
|---|---|---|
| Review and update Privacy Policy | When practices change or annually | Outlean AB |
| Review and update Terms of Service | When practices change or annually | Outlean AB |
| Respond to data subject access/deletion requests | Within 30 days of request (GDPR) | Outlean AB |
| Maintain Records of Processing Activities (RoPA) | Keep current; review annually | Outlean AB |
| Monitor Supabase and Stripe for DPA/policy changes | When notified by processor | Outlean AB |
| Update privacy contact email | After game domain is purchased | Outlean AB |
| Notify users of material Privacy Policy / ToS changes | Before changes take effect | Outlean AB |

---

## 14. Open Items & Blockers

| # | Item | Status | Blocked by |
|---|---|---|---|
| 1 | Update privacy contact email | Blocked | Game domain not yet purchased |
| 2 | Verify Supabase region is EU | Action required | Check Supabase dashboard |
| 3 | Sign Supabase DPA | Action required | Manual action in Supabase dashboard |
| 4 | Sign Stripe DPA | Action required | Manual action in Stripe dashboard |
| 5 | Draft and publish Privacy Policy | Ready to implement | — |
| 6 | Draft and publish Terms of Service | Ready to implement | — |
| 7 | Draft Refund Policy (section in ToS) | Ready to implement | — |
| 8 | Update account creation modal with consent checkboxes | Ready to implement | — |
| 9 | Add legal page links to Chronicles footer | Ready to implement | — |
| 10 | Add legal page links to account creation + settings | Ready to implement | — |
| 11 | Implement account deletion flow (full cascade) | Ready to implement | — |
| 12 | Add EU withdrawal waiver checkbox at checkout | Ready to implement | — |
| 13 | Create internal RoPA document | Action required | No blocker — internal document |
| 14 | Optional: lightweight DPIA (children's app) | Recommended | No blocker — internal document |
| 15 | Optional: lawyer review of final documents | Recommended | Drafts must exist first |
