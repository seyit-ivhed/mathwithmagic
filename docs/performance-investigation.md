# Performance Investigation: Asset Sizes, Bundle Optimization & Lazy Loading

**Date:** 2026-03-11
**Status:** Investigation complete — findings and recommendations only, no code changes

---

## Executive Summary

The production build (`dist/`) totals **164 MB**, with media files accounting for 98% of that size. The single largest performance issue is **eager loading of ~107 MB of music files** at startup via `import.meta.glob({ eager: true })`. Additional significant wins are available through image format optimization (~40 MB), route-level code splitting, and proper React/ReactDOM chunk isolation.

### Quick Impact Overview

| Category | Current Size | Potential Savings | Priority |
|----------|-------------|-------------------|----------|
| Music (eager load) | 107 MB | ~107 MB deferred | 🔴 Critical |
| Images (format/size) | 41 MB | ~25-30 MB | 🟠 High |
| AuthContext chunk (React bundled) | 264 KB | ~140 KB isolated | 🟡 Medium |
| Route lazy loading | All eager | ~100-150 KB deferred | 🟡 Medium |
| tsparticles vendor chunk | 178 KB | ~100-150 KB | 🟢 Low |
| JS stub files (218 files) | ~15 KB total | Marginal | 🟢 Low |

---

## 1. Audio Assets

### 1.1 Music Files — 🔴 CRITICAL

**Current state:**
- **23 MP3 files** in `src/assets/music/` totaling **~107 MB** (3.4–7.2 MB each)
- Loaded via `import.meta.glob('../../assets/music/**/*.mp3', { eager: true, query: '?url', import: 'default' })` in `src/components/audio/BackgroundMusic.tsx`
- **All 23 music URLs are resolved at startup** — the browser fetches all MP3 files on first page load
- Each adventure has 2–4 tracks (map + combat variants); only 1–2 are needed at any time

**Largest files:**
| File | Size |
|------|------|
| `adventure-1/combat-1.mp3` | 7.2 MB |
| `adventure-1/combat-2.mp3` | 6.7 MB |
| `adventure-4/combat-1.mp3` | 5.8 MB |
| `adventure-2/combat-2.mp3` | 5.7 MB |
| `adventure-6/map.mp3` | 5.4 MB |

**Recommended actions:**
1. **Switch to lazy `import.meta.glob`** — remove `eager: true` so music URLs are resolved on demand (same pattern already used for voice-overs in `useVoiceOver.ts`). This alone would defer ~107 MB from initial load.
2. **Convert MP3 → Opus/OGG** with fallback — Opus at 96 kbps provides equivalent quality to MP3 at 192 kbps, reducing file sizes by ~40-50%.
3. **Lower bitrate for background music** — current files appear to be 192-256 kbps MP3; 128 kbps is sufficient for background game music, yielding ~30% size reduction.
4. **Preload only the current adventure's tracks** — load music for the active adventure, not all 6 adventures.

**Estimated impact:** Deferring 107 MB from initial load is the single highest-impact change. Combined with format optimization, total music size could drop to ~50-60 MB loaded on demand.

### 1.2 Sound Effects (SFX) — 🟢 LOW

**Current state:**
- **20 MP3 files** in `src/assets/sfx/` totaling **~788 KB**
- Loaded via `import.meta.glob('../../assets/sfx/**/*.mp3', { eager: true, query: '?url', import: 'default' })` in `src/components/audio/audio.utils.ts`
- Eager loading is acceptable here — total size is under 1 MB and SFX need low-latency playback

**Recommended actions:**
1. Keep eager loading — the 788 KB total is negligible relative to other assets.
2. Optionally convert to Opus/OGG for marginal savings (~30-40%).

**Estimated impact:** Low — already well-optimized at under 1 MB total.

### 1.3 Voice-Overs — ✅ ALREADY LAZY

**Current state:**
- **218 MP3 files** across `src/assets/voice/en/` (7.2 MB) and `src/assets/voice/sv/` (7.3 MB), totaling **~14.5 MB**
- Loaded via `import.meta.glob('/src/assets/voice/**/*.mp3', { import: 'default' })` in `src/hooks/useVoiceOver.ts` — **no `eager: true`**, so these are already lazy-loaded on demand
- However, the lazy glob generates **218 tiny JS stub files** (55–68 bytes each) in the build output — see Section 3.3

**Recommended actions:**
1. No change needed for loading strategy — already correctly lazy-loaded.
2. Consider Opus/OGG conversion for additional size savings (~40-50%).
3. See Section 3.3 for addressing the stub file overhead.

**Estimated impact:** Already well-handled. Format conversion would save ~5-7 MB.

---

## 2. Image Assets

### 2.1 Image Formats — 🟠 HIGH

**Current state:**
- **89 image files** across `src/assets/images/` totaling **~41 MB**
- All formats are **JPG and PNG only** — no WebP, AVIF, or modern formats
- No `<picture>` elements or `srcset` attributes found anywhere in the codebase
- Images are imported as static ES module imports (Vite handles hashing)

**Recommended actions:**
1. **Convert PNG images to WebP** — WebP provides 25-35% smaller files than PNG with equivalent quality. Priority targets:
   - `puzzles/number-path/pressure-plate.png` (5.5 MB, 2048×2048)
   - `puzzles/equation/parchment.png` (3.5 MB, 2048×2048)
   - `puzzles/pedestal.png` (2.3 MB, 1024×1024)
   - `puzzles/mirror/mirror.png` (1.8 MB, 1024×1024)
   - `puzzles/balance/chain.png` (1.5 MB, 1024×1024)
   - `tome-cover/cover.png` (1.2 MB, 620×818)
2. **Convert JPG images to WebP** — smaller savings but still meaningful for the 6 map images (1.2–1.4 MB each).
3. **Add a Vite image optimization plugin** (e.g., `vite-plugin-image-optimizer`) to automate conversion during build.
4. **Use `<picture>` with `<source>` elements** for AVIF → WebP → JPG/PNG fallback chain.

**Estimated impact:** Converting to WebP could save ~10-15 MB total. Combined with resizing (below), savings could reach 25-30 MB.

### 2.2 Oversized Image Dimensions — 🟠 HIGH

**Current state:**
- Two **2048×2048 PNG files** that are likely rendered at much smaller dimensions:
  - `pressure-plate.png` — 5.5 MB (2048×2048)
  - `parchment.png` — 3.5 MB (2048×2048)
- Five **1024×1024 PNG files** that may be oversized:
  - `pedestal.png` — 2.3 MB
  - `mirror.png` — 1.8 MB
  - `chain.png` — 1.5 MB
  - `weight.png` — 915 KB (801×433)
  - `heavy-weight.png` — 705 KB (801×433)
- Six **map images** at 1.2–1.4 MB each (JPG, dimensions not checked but likely oversized for mobile)

**Recommended actions:**
1. **Audit rendered dimensions** — check actual CSS/DOM dimensions these images are displayed at, then resize source assets to 2× those dimensions (for Retina) at most.
2. **Generate responsive variants** — create multiple sizes (e.g., 512w, 1024w, 2048w) and use `srcset` for responsive loading.
3. **Target 512×512 or 1024×1024 max** for puzzle assets — 2048×2048 is excessive for game UI elements.
4. **Compress PNGs** with tools like `pngquant` or `oxipng` for immediate lossless savings.

**Estimated impact:** Resizing 2048×2048 → 1024×1024 alone could save ~6 MB. Combined with format conversion, total image savings of 25-30 MB are achievable.

### 2.3 No Responsive Images — 🟡 MEDIUM

**Current state:**
- No `srcset` or `<picture>` elements used anywhere
- All users (mobile 360px → desktop 2560px) receive the same full-size image

**Recommended actions:**
1. Implement `<picture>` elements with `srcset` for key images (maps, companions, enemies).
2. Generate 2-3 size variants per image during build.
3. Prioritize map images (6 files, 1.2-1.4 MB each) and companion cards.

**Estimated impact:** Medium — mobile users would benefit most, saving 50-70% of image bandwidth.

---

## 3. JavaScript Bundle Size

### 3.1 AuthContext Chunk — 🟡 MEDIUM

**Current state:**
- `AuthContext-*.js`: **264 KB** (83 KB gzipped)
- This chunk is unusually large because **React and ReactDOM are bundled into it**
- `react` and `react-dom` are not listed in `manualChunks` in `vite.config.ts`, so Rollup assigns them to the first chunk that imports them
- The AuthContext CSS is also **19 KB** — large for an auth context

**Chunk contents breakdown (estimated):**
| Component | Est. Size |
|-----------|-----------|
| React + ReactDOM (minified) | ~140 KB |
| Application code (all non-vendor) | ~124 KB |

**Recommended actions:**
1. **Add `react` and `react-dom` to `manualChunks`** in `vite.config.ts`:
   ```ts
   manualChunks: {
     'vendor-react': ['react', 'react-dom'],
     // ... existing chunks
   }
   ```
   This properly isolates the React runtime into a long-lived cacheable chunk.
2. **Audit AuthContext CSS** (19 KB) — verify all styles are needed; this is large for an auth context component.

**Estimated impact:** Better caching (React rarely changes), clearer bundle analysis. No size reduction overall, but the AuthContext chunk would drop from 264 KB to ~124 KB, and the new vendor-react chunk (~140 KB) would be cached independently.

### 3.2 tsparticles Vendor Chunk — 🟢 LOW

**Current state:**
- `vendor-particles-*.js`: **178 KB** (50 KB gzipped)
- Three packages: `tsparticles`, `@tsparticles/react`, `@tsparticles/engine`
- Used in only **2 components**: `GameParticles.tsx` (confetti effects) and `BookCover.tsx`
- Uses `loadFull(engine)` which imports the entire tsparticles library

**Recommended actions:**
1. **Replace `loadFull` with `loadSlim`** or load only needed presets — `tsparticles-slim` is ~60% smaller.
2. **Lazy-load the particle component** — particles are decorative, not critical for first paint. Use `React.lazy()` to defer loading.
3. **Consider a lighter alternative** — `canvas-confetti` (~7 KB) if only confetti effects are needed.

**Estimated impact:** Could reduce from 178 KB to ~70 KB (slim) or ~7 KB (canvas-confetti). Lazy loading would defer this entirely from initial bundle.

### 3.3 Voice-Over JS Stub Files — 🟢 LOW

**Current state:**
- **218 tiny JS files** (55–68 bytes each) generated in the build output from the voice-over `import.meta.glob` (lazy)
- Each stub contains only: `const s="/assets/filename.mp3";export{s as default};`
- Total size: ~15 KB — negligible in terms of bytes
- However, each file generates a separate HTTP request when loaded, which could cause overhead on HTTP/1.1

**Recommended actions:**
1. **Accept the current approach** if deployed on HTTP/2 (Vercel uses HTTP/2 by default) — multiplexing handles many small requests efficiently.
2. Alternatively, **replace `import.meta.glob` with a URL construction pattern** that avoids generating stub files entirely (e.g., build a URL mapping at build time).

**Estimated impact:** Low — HTTP/2 makes this mostly a non-issue. Could marginally improve build output cleanliness.

### 3.4 Other Vendor Chunks

| Chunk | Size | Gzipped | Assessment |
|-------|------|---------|------------|
| `vendor-utils` (framer-motion, zustand, i18next, react-i18next) | 182 KB | 60 KB | Acceptable — all actively used |
| `vendor-supabase` (@supabase/supabase-js) | 173 KB | 46 KB | Acceptable — core dependency |
| `vendor-router` (react-router-dom) | 40 KB | 14 KB | Good — well-sized |
| `vendor-ui` (lucide-react) | 8.8 KB | 3.5 KB | Excellent — tree-shaken |
| `main` (application code) | 176 KB | 50 KB | See Section 4 for splitting |
| `checkout` (separate entry) | 29 KB | 10 KB | Good — properly isolated |

**Recommended actions:**
1. **`framer-motion`** (largest in vendor-utils) — evaluate if the `LazyMotion` component with `domAnimation` feature could reduce bundle size.
2. **Supabase** — verify only `createClient` and `auth` modules are used (confirmed: `src/services/supabase.service.ts` only imports `createClient`). The SDK may include unused modules; check if `@supabase/supabase-js/dist/module` offers tree-shakeable imports.

---

## 4. Code Splitting / Lazy Loading

### 4.1 No Route-Level Lazy Loading — 🟡 MEDIUM

**Current state:**
- **All route components are eagerly imported** in `src/App.tsx`:
  ```tsx
  import AdventurePage from './features/adventure/AdventurePage';
  import { ChronicleBook } from './features/chronicle/ChronicleBook';
  import EncounterPage from './features/encounter/EncounterPage';
  import PuzzlePage from './features/encounter/PuzzlePage';
  import MathTestPage from './features/math/MathTestPage';
  import { AccountPage } from './features/account/AccountPage';
  import { FarewellPage } from './features/farewell/FarewellPage';
  import { ResetPasswordPage } from './features/chronicle/components/ResetPasswordPage';
  ```
- The entire application code is loaded on first visit regardless of which route the user navigates to
- The `main` chunk is **176 KB** and contains all route component code

**Recommended lazy-loading candidates (by priority):**

| Component | Current Import Size | Frequency of Use | Priority |
|-----------|-------------------|-------------------|----------|
| `MathTestPage` | ~5 KB | Debug only | High — never shown to regular users |
| `PuzzlePage` | ~7 KB + puzzle modules | Low — only during puzzle encounters | High |
| `EncounterPage` | ~11 KB + encounter modules | Medium — during gameplay | Medium |
| `AdventurePage` | ~6 KB + map modules | Medium — during gameplay | Medium |
| `AccountPage` | ~4 KB | Low — only for account management | Medium |
| `ResetPasswordPage` | Small | Rare — only for password resets | Medium |
| `FarewellPage` | <1 KB | Rare — only after account deletion | Low |
| `ChronicleBook` | ~12 KB (largest) | High — initial landing page | Low (often first page) |

**Recommended implementation:**
```tsx
const AdventurePage = React.lazy(() => import('./features/adventure/AdventurePage'));
const EncounterPage = React.lazy(() => import('./features/encounter/EncounterPage'));
const PuzzlePage = React.lazy(() => import('./features/encounter/PuzzlePage'));
const MathTestPage = React.lazy(() => import('./features/math/MathTestPage'));
const AccountPage = React.lazy(() => import('./features/account/AccountPage'));
```

Wrap lazy routes with `<Suspense fallback={<LoadingScreen />}>`.

**Estimated impact:** Could defer ~30-50 KB from initial bundle (excluding ChronicleBook which is typically the landing page). More importantly, each route would be loaded only when navigated to, improving perceived performance.

---

## 5. CSS

### 5.1 CSS Bundle Size — 🟢 LOW

**Current state:**
- `main-*.css`: **101 KB** (all application styles)
- `AuthContext-*.css`: **19 KB** (auth-related styles)
- **Total:** 120 KB across 2 CSS files
- Source: 58 CSS files (39 CSS modules + 19 regular CSS files)
- All custom CSS — no framework, no tree-shaking concern

**Largest CSS source files:**
| File | Size |
|------|------|
| `Premium.css` | 15 KB |
| `VisualEffectOverlay.css` | 9.6 KB |
| `RefillCanteenPuzzle.module.css` | 8.1 KB |
| `AdventurePage.css` | 7.7 KB |
| `ChapterPage.css` | 6.9 KB |

**Recommended actions:**
1. **Audit for unused CSS rules** — run a tool like `purgecss` or Chrome DevTools Coverage to identify dead CSS. With 120 KB of custom CSS, there may be unused rules from iterative development.
2. **Consider inlining critical CSS** — extract above-the-fold CSS (~5-10 KB) and inline it in `index.html` for faster first paint.
3. **AuthContext CSS (19 KB)** — investigate why auth styles are this large. This may include styles for the full premium/store UI that are co-located with AuthContext.

**Estimated impact:** Low — 120 KB of CSS (gzipped ~20-30 KB) is acceptable for a game application. Unused CSS removal might save 10-20%.

---

## 6. Build Configuration

### 6.1 Source Maps — ✅ GOOD

**Current state:**
- **No source maps in production build** — 0 `.map` files in `dist/`
- No `sourcemap` setting in `vite.config.ts` (Vite defaults to `false` for production)

**No action needed.**

### 6.2 Compression Plugins — 🟡 MEDIUM

**Current state:**
- **No pre-compression plugins** configured in `vite.config.ts`
- No `vite-plugin-compression` or equivalent for gzip/Brotli pre-compression
- Vercel applies compression at the CDN edge, but pre-compressed assets allow faster serving

**Recommended actions:**
1. **Add `vite-plugin-compression`** to pre-generate gzip and Brotli compressed versions of all text assets (JS, CSS, HTML):
   ```ts
   import compression from 'vite-plugin-compression';
   plugins: [
     react(),
     compression({ algorithm: 'gzip' }),
     compression({ algorithm: 'brotliCompress' }),
   ]
   ```
2. Verify Vercel serves pre-compressed files when available.

**Estimated impact:** Medium — reduces server CPU for compression and enables optimal compression ratios. Brotli typically achieves 15-20% better compression than gzip.

### 6.3 Image Optimization Plugins — 🟠 HIGH

**Current state:**
- **No image optimization plugins** in the build pipeline
- Images are copied to `dist/` as-is, with no resizing, format conversion, or compression

**Recommended actions:**
1. **Add `vite-plugin-image-optimizer`** for automatic image optimization during build.
2. Configure WebP and AVIF output formats.
3. Set quality targets (e.g., 80% quality for JPG, 75% for WebP).

**Estimated impact:** High — could automatically reduce total image size by 30-60% without manual asset conversion.

### 6.4 Vercel Deployment Configuration — 🟡 MEDIUM

**Current state:**
- `vercel.json` contains only SPA rewrites — no cache headers, no edge configuration
- No explicit CDN cache control for static assets

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Recommended actions:**
1. **Add cache headers for hashed assets** — Vite-generated assets have content hashes in filenames and can be cached aggressively:
   ```json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       }
     ]
   }
   ```
2. **Verify Brotli/gzip is enabled** — Vercel enables this by default, but worth confirming.
3. **Add `Content-Type` headers for MP3 files** if not automatically detected.

**Estimated impact:** Medium — proper cache headers ensure returning users don't re-download unchanged assets. Critical for the ~160 MB of media files.

---

## 7. Third-Party Scripts

### 7.1 Stripe — ✅ GOOD

**Current state:**
- Stripe is isolated to `checkout.html` / `src/checkout.tsx` — a **completely separate entry point**
- Not imported or referenced in the main application bundle
- The checkout chunk is only **29 KB** (10 KB gzipped)

**No action needed.** Stripe isolation is properly implemented.

### 7.2 Supabase — ✅ ACCEPTABLE

**Current state:**
- `vendor-supabase-*.js`: **173 KB** (46 KB gzipped)
- Imported in 4 source files (service, auth context, account creation utils)
- Only `createClient` is directly imported in `src/services/supabase.service.ts`
- Auth methods are used via the client instance (not separate imports)

**Recommended actions:**
1. **Investigate `@supabase/ssr`** — if server-side rendering is ever added, the SSR package is smaller.
2. **No immediate action** — the Supabase SDK is a core dependency and 46 KB gzipped is reasonable.

**Estimated impact:** Low — already well-contained.

### 7.3 No External Analytics — ✅ GOOD

**Current state:**
- No Google Analytics, Hotjar, Sentry, or other third-party tracking scripts
- No external CDN dependencies beyond Vercel's own CDN

**No action needed.**

---

## Priority Ranking

### 🔴 Priority 1 — Critical (Fix First)

| # | Finding | Current Impact | Recommended Action | Expected Savings |
|---|---------|---------------|-------------------|-----------------|
| 1 | Music files eagerly loaded | 107 MB at startup | Switch to lazy `import.meta.glob` | 107 MB deferred from initial load |

### 🟠 Priority 2 — High

| # | Finding | Current Impact | Recommended Action | Expected Savings |
|---|---------|---------------|-------------------|-----------------|
| 2 | No image optimization in build | 41 MB unoptimized images | Add `vite-plugin-image-optimizer`, convert to WebP | 15-25 MB |
| 3 | Oversized 2048×2048 PNGs | 9 MB in 2 files | Resize to actual rendered dimensions | 5-7 MB |

### 🟡 Priority 3 — Medium

| # | Finding | Current Impact | Recommended Action | Expected Savings |
|---|---------|---------------|-------------------|-----------------|
| 4 | React/ReactDOM in AuthContext chunk | 264 KB chunk (140 KB is React) | Add `vendor-react` to `manualChunks` | Better caching |
| 5 | No route-level lazy loading | All routes loaded upfront | Add `React.lazy()` for non-landing routes | 30-50 KB deferred |
| 6 | No cache headers in Vercel config | Assets re-downloaded on return visits | Add immutable cache headers for hashed assets | Faster repeat visits |
| 7 | No pre-compression plugins | Server compresses on-the-fly | Add `vite-plugin-compression` for gzip/Brotli | 15-20% better compression |

### 🟢 Priority 4 — Low

| # | Finding | Current Impact | Recommended Action | Expected Savings |
|---|---------|---------------|-------------------|-----------------|
| 8 | tsparticles full library loaded | 178 KB for confetti effects | Use `loadSlim` or `canvas-confetti` | 100-170 KB |
| 9 | Voice-over MP3 format | 14.5 MB in MP3 | Convert to Opus/OGG | 5-7 MB |
| 10 | 218 JS stub files from voice glob | ~15 KB, 218 HTTP requests | Accept (HTTP/2) or refactor URL mapping | Marginal |
| 11 | CSS unused rules | 120 KB total CSS | Audit with purgecss | 10-20 KB |
| 12 | No responsive images | Same size for all viewports | Add `srcset` / `<picture>` | Variable (mobile savings) |

---

## Appendix: Build Output Summary

### Production Build Chunks

| File | Raw Size | Gzipped | Contents |
|------|----------|---------|----------|
| `AuthContext-*.js` | 264 KB | 83 KB | React, ReactDOM, app components |
| `vendor-utils-*.js` | 182 KB | 60 KB | framer-motion, zustand, i18next |
| `vendor-particles-*.js` | 178 KB | 50 KB | tsparticles (full) |
| `main-*.js` | 176 KB | 50 KB | All route components, game logic |
| `vendor-supabase-*.js` | 173 KB | 46 KB | Supabase client SDK |
| `vendor-router-*.js` | 40 KB | 14 KB | React Router DOM |
| `checkout-*.js` | 29 KB | 10 KB | Checkout page (separate entry) |
| `vendor-ui-*.js` | 8.8 KB | 3.5 KB | lucide-react icons |
| 218 stub files | ~15 KB | — | Voice-over URL stubs |
| **JS Total** | **1.9 MB** | — | |

| File | Raw Size | Contents |
|------|----------|----------|
| `main-*.css` | 101 KB | All application styles |
| `AuthContext-*.css` | 19 KB | Auth/premium styles |
| **CSS Total** | **120 KB** | |

### Media Files in Build

| Type | Files | Total Size |
|------|-------|------------|
| Music (MP3) | 23 | 107 MB |
| Voice-overs (MP3) | 218 | 14.5 MB |
| Sound effects (MP3) | 20 | 788 KB |
| Images (JPG/PNG) | 89 | 41 MB |
| **Media Total** | **350** | **~163 MB** |

### dist/ Total: **164 MB**
