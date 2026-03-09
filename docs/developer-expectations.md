# Developer Expectations

This document defines the standards, rules, and practices expected from every developer (human or AI) contributing to this codebase. Read this before starting any implementation, bug fix, or code review.

Also read [technical-architecture.md](technical-architecture.md) before planning any implementation.

---

## Architecture

- Always consult [technical-architecture.md](technical-architecture.md) before planning. Stick to the architectural guidance there.
- Respect the established project structure. Do not introduce new patterns without strong justification.

---

## Code Style

### Comments
- Do not write extensive comments. Write self-explanatory code with good variable, function, and class names instead.
- Only add a comment when logic is genuinely complex and cannot be made clearer through naming alone.

### Conditional Statements
- Always use curly brackets in conditional statements, even for single-line bodies.

```typescript
// Good
if (companion.level >= EXPERIENCE_CONFIG.MAX_LEVEL) {
  return false;
}

// Bad
if (companion.level >= EXPERIENCE_CONFIG.MAX_LEVEL) return false;
```

### Imports
- Use relative imports, not absolute/path-alias imports.

```typescript
// Good
import { PuzzleType } from '../../../../types/adventure.types';

// Bad
import { PuzzleType } from '@/types/adventure.types';
```

---

## TypeScript

### No `enum`
- Do not use `enum`. Use `const` objects with `as const` and derived types instead (required for `erasableSyntaxOnly` / `verbatimModuleSyntax` compatibility).

```typescript
// Good
export const MyEnum = {
  A: 'A',
  B: 'B',
} as const;
export type MyEnum = typeof MyEnum[keyof typeof MyEnum];

// Bad
export enum MyEnum {
  A = 'A',
  B = 'B',
}
```

### No `any`
- Never use the `any` type. It causes lint failures and masks real type errors.
- Do not cast through `unknown` to work around type mismatches. Define, extend, or inherit types properly instead.

```typescript
// Bad
newParty = CombatEngine.tickStatusEffects(newParty as unknown as BattleUnit[]) as unknown as EncounterUnit[];
```

### Parameter Validation
- At the start of a function, validate that required parameters and dependencies exist and have the expected type.
- Log a `console.error` and return early if validation fails. Do not substitute default values.

```typescript
if (!stats) {
  console.error(`Companion stats not found in levelUpCompanion for ${companionId}`);
  return;
}

if (typeof stats.level !== 'number') {
  console.error(`Invalid level for companion ${companionId}`);
  return;
}
```

---

## Modularization and File Size

- Break long functions into smaller, focused functions.
- Aggressively modularize `.tsx` files into smaller components.
- When a `.ts` or `.tsx` file exceeds **250 lines**, consider refactoring into smaller units.
- Each component should have a **single responsibility**. If a component does more than one thing, split it.

---

## React

### Minimize `useEffect`
- Avoid `useEffect` wherever possible. Prefer native React reactivity (derived state, memoization, event handlers).
- Only use `useEffect` when there is no cleaner alternative.

### Component Testability
- If a `.tsx` component contains complex logic, extract that logic to a `.ts` file and write unit tests there.
- Do not write unit tests for `.tsx` files directly.

---

## Security

- Every new Supabase table must have **Row Level Security (RLS) enabled**. Never create a table without RLS unless there is an explicit, documented reason.
- Edge functions must **verify the user's JWT** (via `supabase.auth.getUser(jwt)`) before performing any data read or write. Never trust the request payload alone.
- Never include secrets, service role keys, or any sensitive credentials in client-side code. These belong in server-side environment variables only.

---

## Localization

- All user-readable text must be localized using the i18n system. Never hardcode strings visible to users in code or data files.
- Exception: companion names do not need to be localized.
- When adding a new i18n key, add it to **both** `src/locales/en.json` and `src/locales/sv.json` in the same commit. Leaving one locale behind causes runtime fallback text to appear in production.
- Key names use `snake_case` and are grouped by feature namespace (e.g. `"premium.store.account.title"`).

---

## Accessibility

- All interactive elements (buttons, inputs, links) must have an accessible label — either visible text, `aria-label`, or `aria-labelledby`.
- Modals must trap focus within the modal while open and close on `Escape`.
- Use semantic HTML first: `<button>` for actions, `<a>` for navigation, `<label>` for form fields. Do not use `<div>` or `<span>` with `onClick` in place of a proper element.

---

## Error Handling

- User-facing errors must be displayed in the UI — do not silently swallow errors or only log them.
- For unexpected/internal errors, show a generic user-friendly message (e.g. "Something went wrong. Please try again.") and log the full detail with `console.error`.
- Do not expose raw error messages, stack traces, or internal identifiers to the user.

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components | `PascalCase` file and export | `CheckoutForm.tsx` |
| Hooks | `camelCase` prefixed with `use` | `useAuth.ts` |
| Services | `camelCase` suffixed with `.service` | `analytics.service.ts` |
| Types files | `camelCase` suffixed with `.types` | `adventure.types.ts` |
| CSS Modules | Same name as component file | `LegalModal.module.css` |
| i18n keys | `snake_case`, grouped by feature | `premium.store.account.title` |
| Constants | `UPPER_SNAKE_CASE` | `EXPERIENCE_CONFIG.MAX_LEVEL` |

---

## Styling and Animation

- Use CSS rules and transitions for animations first.
- Only introduce `framer-motion` if CSS becomes genuinely too complex or insufficient.

---

## Polymorphism Over Conditionals

- Avoid long `switch/case` or `if/else` chains. Refactor into polymorphic solutions (strategy pattern, lookup maps, etc.) instead.

---

## Testing

### Unit Tests
- Write unit tests for `.ts` files that contain non-trivial logic.
- Do not write unit tests for `.tsx` files — extract logic to `.ts` files first.
- Do not add unit tests to files that have an explicit comment opting out of unit testing.
- Unit tests must not perform I/O operations (no file reads, network calls, database access).

### End-to-End Tests (Playwright)
- Never assert on element text content. Use `data-testid` attributes instead.
- Always use the `{ force: true }` option when clicking buttons.

---

## Database Migrations

Player data must never be corrupted by a deploy or a rollback. Every migration
must leave the database in a state that the **currently running app code** can
work with — both before and after the migration runs.

### Rules

- **Never rename a column** that the current app code reads. Add the new column
  alongside the old one first; remove the old one in a separate deployment once
  the app no longer references it.
- **Never drop a column** before deploying app code that stops using it.
- **Never change a column type** in a way that breaks existing rows or makes the
  current app code fail to read them.
- **Always use the two-phase pattern** for any destructive schema change: Phase 1
  adds the new structure and backfills data; Phase 2 (a separate deployment)
  removes the old structure only after Phase 1 has been confirmed stable.

### What backwards-compatible looks like

A migration is backwards-compatible when the app code deployed *before* the
migration still works correctly after the migration runs. A migration is
forwards-compatible when the app code deployed *after* the migration still works
if the migration is rolled back.

If a migration cannot satisfy both conditions, split it into smaller steps until
it can.

See [cicd-and-deployment.md](cicd-and-deployment.md) for the full two-phase
migration pattern with SQL examples.

---

## Code Review Checklist

When reviewing code (your own or others'), verify:

1. Architecture aligns with [technical-architecture.md](technical-architecture.md).
2. No hardcoded user-visible strings — all text goes through i18n.
3. No `any` types or unsafe `unknown` casts.
4. No `enum` — use `const` + `as const` pattern.
5. Relative imports used throughout.
6. Curly brackets on all conditionals.
7. `useEffect` usage is justified and minimal.
8. Functions and components have single responsibilities.
9. Files under 250 lines (flag if over).
10. Complex `.tsx` logic is extracted to `.ts` files with tests.
11. Unit tests present for non-trivial `.ts` logic, passing, and I/O-free.
12. E2E tests use `data-testid`, not text content.
13. Parameters validated at function entry with `console.error` + early return on failure.
14. Animations use CSS first; `framer-motion` only when necessary.
15. Long conditionals replaced with polymorphic patterns.
16. Comments only where logic is genuinely opaque.
17. Any `supabase/migrations` changes are backwards- and forwards-compatible: no column renames, drops, or type changes that break the running app code; destructive changes use the two-phase pattern.
18. New Supabase tables have RLS enabled; edge functions verify JWT before any data operation; no secrets in client-side code.
19. New i18n keys added to both `en.json` and `sv.json`; no hardcoded user-visible strings.
20. Interactive elements have accessible labels; modals trap focus and close on Escape; semantic HTML used correctly.
21. User-facing errors displayed in the UI; generic message shown for unexpected errors; no raw stack traces or internal details exposed.
22. File, component, hook, and i18n key names follow the naming conventions table.
