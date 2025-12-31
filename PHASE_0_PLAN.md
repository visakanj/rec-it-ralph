# Phase 0 Implementation Plan

**Status**: Approved - Ready to Execute
**Goal**: Setup React infrastructure at /v2-react/ with minimal UI shell
**Estimated Time**: 2 hours
**PR Number**: #1

---

## Exact Scope (Approved)

### Files to Create

#### 1. `/v2-react/` Directory Structure
```
/v2-react/
├── index.html                    # Vite entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind with MagicPatterns theme
├── postcss.config.js             # PostCSS for Tailwind
├── package.json                  # Dependencies (React, Vite, Tailwind, TypeScript)
├── /src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Router + layout
│   ├── index.css                 # Tailwind imports + MagicPatterns base styles
│   ├── /config/
│   │   └── firebase.ts           # Firebase init (sets window.firebase/window.database)
│   ├── /components/
│   │   └── BottomNav.tsx         # 4-tab navigation (minimal implementation)
│   ├── /pages/
│   │   ├── RoomsScreen.tsx       # Placeholder: "Rooms - Coming Soon"
│   │   ├── PoolScreen.tsx        # Placeholder: "Pool - Coming Soon"
│   │   ├── TonightScreen.tsx     # Placeholder: "Tonight - Coming Soon"
│   │   └── WatchedScreen.tsx     # Placeholder: "Watched - Coming Soon"
│   └── /types/
│       └── data-adapter.d.ts     # Minimal TypeScript definitions
└── /dist/                        # Build output (gitignored)
```

#### 2. Root-Level Files to Modify
- `/_redirects` - Add: `/v2-react/* /v2-react/index.html 200`
- `/netlify.toml` - Update redirects section (if needed)
- `/v2_status.md` - Update with Phase 0 completion + bundle size

#### 3. Files to NOT Touch
- ❌ `/` (v1 app)
- ❌ `/v2/` (vanilla v2, stays untouched)
- ❌ `/app.js` (v1 core logic)
- ❌ `/v2/data-adapter.js` (no changes until Phase 7)

---

## Implementation Checklist

### Step 1: Create Directory Structure (5 min)
- [ ] Create `/v2-react/` directory
- [ ] Create `/v2-react/src/` subdirectories (config, components, pages, types)

### Step 2: Setup Package Management (10 min)
- [ ] Create `/v2-react/package.json` with dependencies:
  - react: ^18.3.1
  - react-dom: ^18.3.1
  - react-router-dom: ^6.26.2
  - Dependencies: (none yet, wait until Phase 4 for Framer Motion)
- [ ] Dev dependencies:
  - vite: ^5.2.0
  - @vitejs/plugin-react: ^4.2.0
  - typescript: ^5.5.4
  - tailwindcss: ^3.4.17
  - autoprefixer: ^10.4.0
  - postcss: ^8.4.0
  - @types/react: ^18.3.0
  - @types/react-dom: ^18.3.0
- [ ] Scripts: `dev`, `build`, `preview`
- [ ] Run `npm install` in /v2-react/

### Step 3: Setup Build Configuration (15 min)
- [ ] Create `vite.config.ts` (root: '.', base: '/v2-react/')
- [ ] Create `tsconfig.json` (strict: true, jsx: react-jsx)
- [ ] Create `postcss.config.js` (tailwindcss + autoprefixer)
- [ ] Create `tailwind.config.js` with MagicPatterns colors:
  - background: { DEFAULT: '#0A0A0B', elevated: '#121214' }
  - surface: { DEFAULT: '#1A1A1D', elevated: '#1F1F23' }
  - accent: { DEFAULT: '#3B82F6', hover: '#2563EB' }
  - text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A' }
  - border: { DEFAULT: 'rgba(255,255,255,0.08)', highlight: 'rgba(255,255,255,0.12)' }
- [ ] Verify: `npm run build` succeeds (empty build)

### Step 4: Setup Firebase Config (10 min)
- [ ] Create `/v2-react/src/config/firebase.ts`:
  - Import Firebase SDK 9.17.1 compat (inline script in index.html)
  - Initialize Firebase with same config as v1
  - **CRITICAL**: Set `window.firebase` and `window.database`
  - Export config for TypeScript (optional)
- [ ] Create `/v2-react/index.html`:
  - Load Firebase SDK via CDN (before React mount)
  - Set `window.RECITRALPH_V2_MODE = true`
  - Load `/app.js` (v1 core with AppState/TMDBService)
  - Load `/v2/data-adapter.js` (existing adapter)
  - Mount point: `<div id="root"></div>`
  - Module script: `/src/main.tsx`

### Step 5: Create TypeScript Definitions (10 min)
- [ ] Create `/v2-react/src/types/data-adapter.d.ts`:
  - Declare `window.v2Adapter`
  - Define minimal interfaces: Contributor, Movie, RoomData
  - Type core methods only:
    - getRoomCode(): string | null
    - getRoomData(): RoomData | null
    - subscribeRoom(roomCode: string, callback: (data: RoomData) => void): () => void
    - createRoom(theme: string): Promise<string>
    - joinRoom(roomCode: string): Promise<boolean>
    - getRoomHistory(): Array<{roomCode: string, theme: string, lastVisited: number}>
  - Mark as expandable in future phases

### Step 6: Create Minimal UI Shell (30 min)
- [ ] Create `/v2-react/src/index.css`:
  - Tailwind directives: @tailwind base/components/utilities
  - MagicPatterns fadeIn animation (from their index.css)
  - Glass panel effect (if used)
- [ ] Create `/v2-react/src/main.tsx`:
  - Import React 18 createRoot
  - Import App component
  - Render with StrictMode
- [ ] Create `/v2-react/src/App.tsx`:
  - BrowserRouter with basename="/v2-react"
  - Routes: /, /pool, /tonight, /watched
  - Layout: `<div className="min-h-screen bg-background text-text-primary">`
  - Include BottomNav
- [ ] Create `/v2-react/src/components/BottomNav.tsx`:
  - Fixed bottom navigation
  - 4 tabs: Rooms (Home icon), Pool (Grid icon), Tonight (Moon icon), Watched (Clock icon)
  - Use React Router Link with active state detection
  - Tailwind classes: `fixed bottom-0 left-0 right-0 bg-surface border-t border-border`
  - Safe area insets: `pb-safe` (if Tailwind supports, else pb-4)
  - **NO** lucide-react icons yet (use emoji or simple SVG)
- [ ] Create placeholder screens:
  - `/v2-react/src/pages/RoomsScreen.tsx`: `<div>Rooms - Coming Soon</div>`
  - `/v2-react/src/pages/PoolScreen.tsx`: `<div>Pool - Coming Soon</div>`
  - `/v2-react/src/pages/TonightScreen.tsx`: `<div>Tonight - Coming Soon</div>`
  - `/v2-react/src/pages/WatchedScreen.tsx`: `<div>Watched - Coming Soon</div>`

### Step 7: Update Netlify Configuration (5 min)
- [ ] Update `/_redirects`:
  - Add: `/v2-react/* /v2-react/index.html 200` (SPA fallback)
  - Keep existing: `/v2/* /v2/index.html 200` (vanilla v2)
  - Keep existing: `/* /index.html 200` (v1)
- [ ] Verify redirect order (most specific first)

### Step 8: Local Testing (15 min)
- [ ] Run `npm run dev` in /v2-react/
- [ ] Open http://localhost:5173/v2-react/
- [ ] Test:
  - All 4 placeholder screens load
  - Bottom nav switches between screens
  - Active tab highlights correctly
  - `window.v2Adapter` exists in console
  - `window.v2Adapter.getDiagnostics()` returns data
  - No console errors
  - No TypeScript compilation errors

### Step 9: Build & Bundle Size (10 min)
- [ ] Run `npm run build` in /v2-react/
- [ ] Check `/v2-react/dist/` output
- [ ] Record bundle sizes:
  - index.html (size)
  - JS chunks (main, vendor if split)
  - CSS (main stylesheet)
  - Total size
- [ ] Log in v2_status.md under "Baseline Bundle Size" section

### Step 10: Verify Isolation (5 min)
- [ ] Open `/` (v1) → verify unchanged, no console errors
- [ ] Open `/v2/` (vanilla v2) → verify unchanged, works correctly
- [ ] Open `/v2-react/` → verify React app loads
- [ ] Check: No CSS conflicts between v1/v2/v2-react

### Step 11: Netlify Preview Deploy (10 min)
- [ ] Commit Phase 0 changes
- [ ] Push to branch: `phase-0-react-infra`
- [ ] Deploy Netlify preview
- [ ] Test preview URLs:
  - https://preview.../  (v1)
  - https://preview.../v2/  (vanilla v2)
  - https://preview.../v2-react/  (React v2)
- [ ] Verify all routes work as expected

### Step 12: Update v2_status.md (5 min)
- [ ] Mark Phase 0 as complete
- [ ] Add to "Completed PRs" section
- [ ] Add baseline bundle size
- [ ] Add QA results
- [ ] Update "Next Planned PR" to Phase 1

---

## Acceptance Criteria (QA Checklist)

Before marking Phase 0 complete, verify:

### Functionality
- [ ] `/v2-react/` loads with minimal UI shell
- [ ] Bottom nav switches between 4 placeholder screens
- [ ] Active tab highlights correctly (visual feedback)
- [ ] All routes render without errors (/, /pool, /tonight, /watched)

### Compatibility
- [ ] `/` (v1) loads correctly, unchanged behavior
- [ ] `/v2/` (vanilla v2) loads correctly, unchanged behavior
- [ ] No console errors in any version (v1, v2, v2-react)

### Build & Dev
- [ ] `npm run dev` starts Vite dev server successfully
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] Bundle size recorded in v2_status.md

### Firebase & Adapter
- [ ] `window.firebase` exists and is initialized
- [ ] `window.database` exists
- [ ] `window.v2Adapter` exists and is ready
- [ ] `window.v2Adapter.getDiagnostics()` returns valid data
- [ ] `window.RECITRALPH_V2_MODE` is true

### Netlify Deploy
- [ ] Netlify preview deploys successfully
- [ ] All 3 paths work in preview (/, /v2/, /v2-react/)
- [ ] SPA fallback works (/v2-react/pool refreshes correctly)

### CSS Isolation
- [ ] v2-react styles do not affect v1
- [ ] v2-react styles do not affect vanilla v2
- [ ] Tailwind classes work correctly in v2-react
- [ ] MagicPatterns dark theme colors render correctly

---

## Known Issues / Deferred Items

### Intentionally Incomplete (by design):
- No MagicPatterns components imported yet (Phase 1+)
- No AdapterContext wiring (Phase 1)
- No real data displayed (placeholder screens only)
- No Framer Motion (Phase 4)
- No lucide-react icons (may use emoji or simple SVG for BottomNav)

### To Document in Phase 0:
- Asset path strategy (for when we import MagicPatterns images)
- Icon strategy (emoji vs SVG vs wait for lucide-react)

---

## Rollback Plan

If Phase 0 needs to be reverted:

1. Delete `/v2-react/` directory entirely
2. Revert `/_redirects` to remove `/v2-react/*` rule
3. Revert `v2_status.md` to pre-Phase 0 state
4. Verify v1 and vanilla v2 still work
5. Redeploy main branch to Netlify

**Estimated rollback time**: 5 minutes
**Risk**: Very low (no changes to existing code)

---

## Estimated Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Directory structure | 5 min |
| 2 | Package management | 10 min |
| 3 | Build configuration | 15 min |
| 4 | Firebase config | 10 min |
| 5 | TypeScript definitions | 10 min |
| 6 | Minimal UI shell | 30 min |
| 7 | Netlify config | 5 min |
| 8 | Local testing | 15 min |
| 9 | Build & bundle size | 10 min |
| 10 | Verify isolation | 5 min |
| 11 | Netlify preview deploy | 10 min |
| 12 | Update v2_status.md | 5 min |
| **TOTAL** | | **~2 hours** |

---

## Next Phase Preview

**Phase 1** will:
- Import MagicPatterns: RoomCard, ActionSheet, AppBar
- Create AdapterContext
- Create useRoom hook
- Build full RoomsScreen with real Firebase data
- Wire create/join room flows

**Phase 1 Dependencies** (established in Phase 0):
- ✅ TypeScript definitions for adapter
- ✅ Firebase initialized and window.* set
- ✅ Routing infrastructure in place
- ✅ Tailwind theme configured
- ✅ Build process working

---

**Ready to Execute**: YES (awaiting final approval)
**Blocking Issues**: NONE
**Assumptions Confirmed**: ALL

---

**End of Phase 0 Plan**
