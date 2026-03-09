# Technical Architecture

## Overview

This document defines the technical architecture and directory structure for
Math Quest Adventures. The architecture follows a **feature-based organization**
pattern that promotes modularity, maintainability, and scalability.

---

## Core Principles

### 1. Feature-Based Organization

- Code is organized by **feature/domain** rather than by technical type
- Each feature contains all related code: components, pages, styles, and
  feature-specific logic
- Promotes high cohesion and low coupling

### 2. Clear Separation of Concerns

- **Reusable** components live in `/src/components/`
- **Feature-specific** code lives in `/src/features/`
- **Shared** utilities, types, and data live in their respective directories

### 3. Co-location

- Related files are kept close together
- Component and its styles are in the same directory
- Feature-specific components live within the feature directory

---

## Directory Structure

```
src/
├── components/              # Shared, reusable components only
│   ├── MathInput/          # Math-specific reusable components
│   └── ui/                 # UI primitives (if needed)
│
├── features/               # Feature-specific code
│   ├── adventure/
│   │   ├── components/    # Adventure-specific components
│   │   │   ├── AdventureNode.tsx
│   │   │   ├── AdventureNode.module.css
│   │   │   ├── AdventureInfoModal.tsx
│   │   │   ├── AdventureInfoModal.module.css
│   │   │   ├── AdventureRewardSummary.tsx
│   │   │   └── AdventureRewardSummary.module.css
│   │   ├── AdventurePage.tsx
│   │   └── AdventurePage.module.css
│   │
│   ├── encounter/
│   │   ├── components/    # Encounter-specific components
│   │   ├── EncounterPage.tsx
│   │   └── EncounterPage.module.css
│   │
│   └── combat/
│       ├── components/    # Combat-specific components
│       └── types.ts       # Combat-specific types (if needed)
│
├── pages/                  # Route entry points (thin layer)
│   └── index.ts           # Re-exports from features for routing
│
├── data/                   # Static data and configurations
│   ├── companions.data.ts
│   ├── adventures.data.ts
│   └── ...
│
├── hooks/                  # Shared custom React hooks
│   ├── useCombatActions.ts
│   └── ...
│
├── stores/                 # Global state management (Zustand)
│   ├── combat.store.ts
│   ├── progress.store.ts
│   └── ...
│
├── types/                  # Shared TypeScript types
│   ├── companion.types.ts
│   ├── adventure.types.ts
│   └── ...
│
├── utils/                  # Shared utility functions
│   ├── math.utils.ts
│   └── ...
│
├── services/              # External service integrations
│   ├── api.service.ts
│   └── ...
│
├── locales/               # Internationalization files
│   ├── en.json
│   ├── sv.json
│   └── ...
│
├── styles/                # Global styles only
│   ├── globals.css
│   ├── variables.css
│   └── ...
│
├── config/                # App configuration
│   └── constants.ts
│
├── assets/                # Static assets
│   ├── images/
│   └── music/             # Background music and large audio files (>4MB)
│
├── App.tsx                # Root application component
├── main.tsx              # Application entry point
└── i18n.ts               # i18n configuration
```

---

## Directory Guidelines

### `/src/components/` - Shared Components

**Purpose**: Contains only truly reusable components used across multiple
features.

**Rules**:

- Components must be used in **2+ features** to live here
- Should be generic and configurable via props
- No feature-specific business logic
- Well-documented with clear prop interfaces

**Examples**:

- `Button` - Generic button component
- `Modal` - Generic modal wrapper
- `MathInput/` - Math input components used across features

**Anti-patterns**:

- ❌ Components only used in one feature
- ❌ Components with hard-coded feature logic
- ❌ Page components

---

### `/src/features/` - Feature Modules

**Purpose**: Contains feature-specific code organized by domain.

**Structure**: Each feature follows this pattern:

```
feature-name/
├── components/          # Feature-specific components
│   ├── ComponentName.tsx
│   └── ComponentName.module.css
├── FeaturePage.tsx     # Main page component
├── FeaturePage.module.css
├── hooks/              # Feature-specific hooks (optional)
├── utils/              # Feature-specific utilities (optional)
└── types.ts            # Feature-specific types (optional)
```

**Rules**:

- All code specific to a feature lives within its directory
- Components in `feature/components/` are only used by that feature
- If a component is needed by multiple features, promote it to
  `/src/components/`
- Page components are at the feature root level

**Current Features**:

- `adventure/` - Adventure map and navigation
- `encounter/` - Combat encounters and battles
- `combat/` - Combat mechanics and UI
- `chronicle/` - Story progression and book interface
- `premium/` - Premium features and monetization
- `debug/` - Debugging tools
- `math/` - Math game mechanics

---

### `/src/data/` - Static Data

**Purpose**: Static game data and configurations.

**Contents**:

- Companion definitions
- Adventure definitions
- Enemy/monster data
- Configuration constants

**Rules**:

- Data should be typed using types from `/src/types/`
- Keep data separate from logic
- Use `.data.ts` suffix for clarity

---

### `/src/hooks/` - Custom Hooks

**Purpose**: Shared custom React hooks used across features.

**Rules**:

- Must be used in 2+ features
- Follow React hooks naming convention (`use*`)
- Feature-specific hooks go in `features/[feature]/hooks/`

---

### `/src/assets/` - Static Assets

**Purpose**: Images, fonts, and media files.

**Guidelines**:
- **Images**: Place in `/src/assets/images/`
- **Music/Audio**: Place in `/src/assets/music/`
  - Large files (>4MB) should be in `src/assets/music` to leverage Vite's asset handling (hashing/cache busting).
  - Use dynamic imports or `new Audio(importedUrl)` for large media to avoid bundling them into the initial JS payload.


---

### `/src/stores/` - State Management

**Purpose**: Global state management using Zustand.

**Organization**:

- One store per domain (combat, progress, settings, etc.)
- Use `.store.ts` suffix
- Keep stores focused and single-responsibility

**Rules**:

- Stores should be domain-focused
- Can be used by multiple features
- Include selectors for derived state
- **Sliced Store Pattern**: For complex domains (like `game`), use the slice
  pattern where a main store combines multiple slice files (e.g.,
  `src/stores/game/slices/`).

---

## Authentication & Persistence

### Overview

The application uses **Supabase** for centralized authentication and cloud
persistence, following an anonymous-first progression model.

### 1. Progressive Authentication

Identity is managed solely through **Supabase Auth** — no local device IDs or
fingerprints are stored.

- **Anonymous Entry**: On first launch, the app creates an anonymous Supabase
  session. Players can start playing immediately without registration.

- **Account Upgrade**: Players are prompted to "upgrade" their account (link an
  email) before making purchases or to ensure cross-device persistence.
- **State Migration**: Local game state (Zustand) is merged with the permanent
  account upon registration/login.

### 2. Persistence Strategy

- **Local-First**: Primary state management remains in **Zustand** stores for
  immediate UI responsiveness.
- **Background Sync**: Stores are persisted to `localStorage` and synced to
  Supabase (PostgreSQL) in the background on certain events.
- **Sync Triggers**: Sync occurs at critical gameplay milestones, specifically
  after completing an encounter or making a purchase.
- **Conflict Resolution**: In case of multi-device conflicts, we have a merging system that prevents player loosing any progress.

### 3. Service Integration

- **Supabase Auth**: Manages authenticated user sessions.
- **Supabase Edge Functions**: Handles server-authoritative logic (e.g., secure
  payment verification).
- **PostgreSQL**: Stores flattened JSONB blobs of game state for flexible
  progression tracking and structured analytics events.

---

## Schema Management & Evolution

To maintain data consistency for existing players while the game evolves, we use
a dual-layer versioning strategy:

### 1. Database Layer (SQL Migrations)

- **Versioned Migrations**: All changes to structured tables (e.g.,
  `player_profiles`) are managed via timestamped SQL migration files in
  `/supabase/migrations/`.
- **Backward Compatibility**: We prioritize non-breaking changes (e.g., adding
  nullable columns, new tables) over destructive ones (e.g., renaming columns).

### 2. Application Layer (State Versioning)

- **JSONB "Schema-on-Read"**: The core game state is stored as a JSONB blob.
  This allows us to change the internal structure of the game state without
  modifying the database schema.
- **Zustand Migrations**: We leverage Zustand's `persist` middleware `version`
  and `migrate` features.
  - When the application loads a `state_blob` from Supabase, the middleware
    checks the version.
  - If it's an older version, a `migrate` function transforms the data into the
    current format before the game starts.
- **Defaulting Values**: New features use optional properties or default values
  in the store to ensure old save files remain valid.

---

### `/src/types/` - TypeScript Types

**Purpose**: Shared TypeScript type definitions.

**Organization**:

- Group by domain (companion, adventure, combat, etc.)
- Use `.types.ts` suffix
- Export all types from index files for easy imports

**Rules**:

- Only shared types live here
- Feature-specific types go in `features/[feature]/types.ts`
- Use descriptive names that reflect the domain

---

### `/src/utils/` - Utility Functions

**Purpose**: Shared utility functions and helpers.

**Rules**:

- Pure functions only
- Well-tested
- Domain-specific utils (e.g., `math.utils.ts`, `combat.utils.ts`)
- Feature-specific utils go in `features/[feature]/utils/`

---

### `/src/styles/` - Global Styles

**Purpose**: Global CSS and style variables.

**Contents**:

- `globals.css` - Global styles and resets
- `variables.css` - CSS custom properties
- Theme definitions

**Rules**:

- Component-specific styles use CSS Modules
- Only truly global styles live here

---

## Import Conventions

### Relative Imports

Use relative imports from `src/` for better refactoring:

```typescript
// ❌ Avoid
import { Companion } from "@/types/companion.types";
import { useProgress } from "@/stores/progress.store";
import { Button } from "@/components/common/Button";
  
// ✅ Good
import { Companion } from "../../../types/companion.types";
```

### Import Order

Organize imports in this order:

1. External dependencies (React, libraries)
2. Internal absolute imports (types, stores, utils)
3. Relative imports (local components, styles)
4. CSS/Style imports

```typescript
// 1. External
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// 2. Relative
import { AdventureNode } from "./components/AdventureNode";

// 3. Styles
import styles from "./AdventurePage.module.css";
```

---

## File Naming Conventions

### Components

- **PascalCase** for component files: `AdventureNode.tsx`
- **PascalCase** for component names: `export const AdventureNode`
- CSS Modules: `ComponentName.module.css`

### Utilities & Helpers

- **camelCase** with domain prefix: `math.utils.ts`, `combat.helpers.ts`
- Functions use camelCase: `export const calculateDamage`

### Types

- **PascalCase** for type names: `Companion`, `Adventure`
- Files use domain + `.types.ts`: `companion.types.ts`

### Stores

- **camelCase** with domain + `.store.ts`: `combat.store.ts`
- Hook exports: `export const useCombatStore`

### Data

- **camelCase** with domain + `.data.ts`: `companions.data.ts`
- Exported constants: `export const COMPANIONS`

---

## CSS Module Conventions

### Naming

- Use **camelCase** for class names: `.adventureNode`, `.infoModal`
- BEM-style modifiers: `.button--primary`, `.card--highlighted`

### Organization

```css
/* 1. Layout */
.container {}
.wrapper {}

/* 2. Components */
.adventureNode {}
.infoModal {}

/* 3. States */
.isActive {}
.isDisabled {}

/* 4. Modifiers */
.adventureNode--completed {}
.adventureNode--locked {}
```

### Usage

```typescript
import styles from "./AdventureNode.module.css";

<div className={styles.adventureNode}>
  <div className={styles.nodeContent}>...</div>
</div>;
```

---

## TypeScript Conventions

### Enums

**Do not use `enum`**. Use `const` objects with `as const` instead:

```typescript
// ❌ Bad
export enum CompanionRole {
  WARRIOR = "WARRIOR",
  GUARDIAN = "GUARDIAN",
  SUPPORT = "SUPPORT",
}

// ✅ Good
export const CompanionRole = {
  WARRIOR: "WARRIOR",
  GUARDIAN: "GUARDIAN",
  SUPPORT: "SUPPORT",
} as const;

export type CompanionRole = typeof CompanionRole[keyof typeof CompanionRole];
```

**Reason**: Avoids issues with `erasableSyntaxOnly` / `verbatimModuleSyntax`.

### Type Exports

```typescript
// Export types and interfaces
export type { Companion, CompanionStats };
export interface Adventure {}
```

---

## Testing Conventions

### Unit Tests

- Co-located with the code: `ComponentName.test.tsx`
- Test files mirror source structure
- Use Vitest

### E2E Tests

- Located in `/e2e/` directory
- Use Playwright
- Use `data-testid` attributes for selectors
- Never check text content, always use `data-testid`
- Always use `force: true` option when clicking buttons

```typescript
// ✅ Good
await page.click('[data-testid="attack-button"]', { force: true });

// ❌ Bad
await page.click("text=Attack");
```

### Edge Function Testing

We use **Deno's built-in test runner** and the `@std/testing` module for mocking
to test Supabase Edge Functions without affecting the underlying database.

**Key Principles:**

- **Mocking the Supabase Client**: Instead of connecting to a real Supabase
  instance, we mock the `supabaseAdmin` client. This allows us to define exactly
  what the database "returns" for a given query.
- **Mocking External Services**: Similarly, we mock external SDKs like Stripe to
  simulate successful or failed interactions.
- **Isolation**: Each test runs in isolation with its own set of mocks, ensuring
  no side effects on the project's data.

**Test Structure:**

- **Arrange**: Mock global objects (like `fetch`), environment variables, and
  external SDKs.
- **Act**: Invoke the edge function's handler with a mock `Request` object.
- **Assert**: Verify that the response status and content are correct, and that
  the expected database calls were made.

---

## Migration Strategy

When moving files to the new structure:

1. **Create feature directory** if it doesn't exist
2. **Move page component** to feature root
3. **Move feature-specific components** to `feature/components/`
4. **Update all imports** in moved files
5. **Update imports** in files that reference moved files
6. **Update route definitions** in `App.tsx`
7. **Run tests** to verify nothing broke
8. **Delete empty directories**

---

## Component Size Guidelines

### File Size Limits

- TypeScript/TSX files should not exceed **250 lines**
  - **Exception**: `.test.ts` and `.test.tsx` files are excluded from this
    limit.
- If a file exceeds 250 lines, consider refactoring:
  - Extract sub-components
  - Move logic to custom hooks
  - Split into smaller, focused components

### When to Refactor

- Component has multiple responsibilities
- Render method is very long
- Lots of state management
- Complex conditional rendering

---

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should do one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props over State**: Prefer props for configuration
4. **Controlled Components**: Parent controls state when possible

### State Management

1. **Local First**: Use local state when possible
2. **Lift State Up**: Share state at the lowest common ancestor
3. **Global Stores**: Only for truly global state (user, progress, combat)

### Performance

1. **Lazy Loading**: Use `React.lazy()` for route-based code splitting
2. **Memoization**: Use `React.memo()`, `useMemo()`, `useCallback()` judiciously
3. **Avoid Premature Optimization**: Profile before optimizing

---

## Technology Stack

### Core

- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library
- **Vite** - Build tool and dev server

### State Management

- **Zustand** - Lightweight state management

### Routing

- **React Router** - Client-side routing

### Styling

- **CSS Modules** - Scoped CSS
- **Vanilla CSS** - No framework

### Visual Effects

- **tsparticles** - specialized particle engine for high-performance effects

### Internationalization

- **i18next** - Translation management
- **react-i18next** - React integration

### Testing

- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **@testing-library/react** - Component testing utilities

### Code Quality

- **ESLint** - Linting
- **TypeScript** - Type checking

---

## References

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev/)

---
