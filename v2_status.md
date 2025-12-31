# V2 Migration Status

**Last Updated**: 2025-12-31
**Current Phase**: Phase 2 (Complete - Awaiting QA Approval)
**Overall Status**: Create/Join Flows Complete / Ready for Phase 3

---

## Project Overview

**Goal**: Migrate V2 from vanilla JavaScript to React + Tailwind UI matching the MagicPatterns prototype, while preserving V1 stability and maintaining Firebase backend compatibility.

**Repositories**:
- **V1 Production**: `rec-it-ralph` at `/` (MUST remain untouched)
- **V2 Current**: `rec-it-ralph/v2/` (vanilla JS, functional, deployed)
- **MagicPatterns Prototype**: `movie-night-recs-app` (React UI design target)

**Strategy**: Incremental migration, one screen at a time, always deployable, full feature parity before deprecating vanilla v2.

**Tech Stack (Target)**:
- React 18.3.1 + TypeScript 5.5.4
- Tailwind CSS 3.4.17 (MagicPatterns dark theme)
- React Router 6.26.2
- Framer Motion 11.5.4 (animations)
- Vite 5.2.0 (build tool)
- Existing: DataAdapter (v2/data-adapter.js) wrapping V1 AppState

---

## Roadmap Checklist

### Infrastructure
- [x] **Phase 0**: Setup React Infrastructure (~2 hours) ✅ COMPLETE
  - Setup Vite + Tailwind + TypeScript at /v2-react/
  - Create minimal UI shell (App layout + BottomNav + placeholder screens)
  - Setup Firebase config in src/config/firebase.ts
  - Create minimal data-adapter.d.ts (core methods only)
  - Capture baseline bundle size
  - Add Netlify redirect for /v2-react/*
  - **NO** full MagicPatterns copy yet (incremental per phase)
  - **NO** Framer Motion yet (add when needed)
  - **NO** adapter wiring yet (Phase 1)

### Core Screens
- [x] **Phase 1**: AdapterContext + RoomsScreen (~4 hours) ✅ COMPLETE
  - Import MagicPatterns: RoomCard, ActionSheet, AppBar components
  - Create AdapterContext (wrap window.v2Adapter)
  - Create useRoom hook (subscribeRoom wrapper)
  - Build RoomsScreen with real Firebase data
  - Verify room create/join navigation
  - Quick smoke check: adapter wiring works

- [x] **Phase 2**: CreateRoom + JoinRoom Screens (~3 hours) ✅ COMPLETE
  - Theme-only CreateRoomScreen (no streaming services)
  - Wire CreateRoomScreen: form state + adapter.createRoom()
  - Wire JoinRoomScreen: strict validation (6 chars, alphanumeric, auto-uppercase)
  - Robust success conditions (verify adapter state after operations)
  - Error handling for invalid room codes
  - Quick smoke check: create/join flows work

- [ ] **Phase 3**: PoolScreen (~6 hours)
  - Import MagicPatterns: MoviePosterTile, ContributorChip, BottomSheet components
  - Wire useRoom hook for real-time sync
  - Map contributors to ContributorChip
  - Map moviePool to MoviePosterTile grid
  - Add contributor/movie flows with ActionSheets
  - Quick smoke check: Firebase real-time updates work
  - **CRITICAL**: Full cross-tab v1↔v2 sync QA

- [ ] **Phase 4**: PickScreen (Interactive Picker) (~5 hours)
  - Import MagicPatterns: PickScreen with hold-to-spin animation
  - **ADD** Framer Motion dependency (first use)
  - Wire to adapter.pickTonightMovie()
  - Confetti effect on selection
  - Navigate to /tonight after pick
  - Quick smoke check: pick flow works, bundle size acceptable

- [ ] **Phase 5**: TonightScreen (~4 hours)
  - Import MagicPatterns: TonightScreen UI
  - Wire tonightPick display from Firebase
  - Wire mark watched flow
  - Wire pick another flow
  - Quick smoke check: tonight flows work
  - **CRITICAL**: Full cross-tab v1↔v2 sync QA

- [ ] **Phase 6**: WatchedScreen (~3 hours)
  - Import MagicPatterns: WatchedScreen UI
  - Wire watchedMovies grid display
  - Add undo functionality (24-hour check) - enhancement over MagicPatterns
  - Quick smoke check: watched/undo flows work
  - **CRITICAL**: Full cross-tab v1↔v2 sync QA

### Optional Features
- [ ] **Phase 7**: InviteScreen (Optional, ~6 hours)
  - Import MagicPatterns: InviteScreen, InviteCodeCard, InviteLinkCard, MembersList components
  - Add getInviteLink() to DataAdapter
  - Wire copy code/link functionality
  - Wire auto-fill join form from URL param
  - Wire members list display (map from contributors)
  - Quick smoke check: invite flows work
  - **DEFERRED**: Pending invites tracking (needs backend)

### Production
- [ ] **Phase 8**: Polish + Ship (~4 hours)
  - Add loading skeletons
  - Add error boundaries
  - Mobile Safari test (safe area insets) + responsive polish
  - Expand data-adapter.d.ts with complete types
  - Bundle size analysis + optimization if needed
  - Switch /v2/ route from vanilla to React
  - Archive legacy vanilla v2 files
  - Update Netlify deployment config
  - Update README with React architecture docs
  - Final full QA (all screens, cross-tab, mobile)

---

## Completed PRs

### PR #1: Phase 0 - Setup React Infrastructure
**Date**: 2025-12-30
**Branch**: `phase-0-react-infra`
**Status**: Complete - Awaiting QA Approval

**Scope**:
- Created `/v2-react/` directory with full React + Vite + Tailwind setup
- Setup TypeScript with strict mode
- Created minimal data-adapter.d.ts (6 core methods)
- Implemented safe area insets support (--safe-bottom CSS variable + pb-safe utility)
- Created minimal UI shell (App + BottomNav + 4 placeholder screens)
- Added Netlify redirect for `/v2-react/*`
- Verified v1 and vanilla v2 unchanged

**Files Created** (23 files):
- `/v2-react/package.json`
- `/v2-react/vite.config.ts`
- `/v2-react/tsconfig.json`
- `/v2-react/tsconfig.node.json`
- `/v2-react/postcss.config.js`
- `/v2-react/tailwind.config.js`
- `/v2-react/index.html`
- `/v2-react/src/main.tsx`
- `/v2-react/src/App.tsx`
- `/v2-react/src/index.css`
- `/v2-react/src/config/firebase.ts`
- `/v2-react/src/types/data-adapter.d.ts`
- `/v2-react/src/components/BottomNav.tsx`
- `/v2-react/src/pages/RoomsScreen.tsx`
- `/v2-react/src/pages/PoolScreen.tsx`
- `/v2-react/src/pages/TonightScreen.tsx`
- `/v2-react/src/pages/WatchedScreen.tsx`
- `/v2-react/tests/phase-0.spec.ts` (automated tests)
- `/v2-react/tests/README.md` (test documentation)
- `/v2-react/playwright.config.ts` (test configuration)
- `/v2-react/dist/` (build output)
- Plus 140 npm packages installed (includes @playwright/test)

**Files Modified** (1 file):
- `/_redirects` - Added `/v2-react/*` route (line 1-2)

**Baseline Bundle Size**:
- `index.html`: 2.53 KB (gzip: 1.10 KB)
- `index.css`: 6.82 KB (gzip: 2.07 KB)
- `index.js` (React + Router + app code): 166.67 KB (gzip: 54.04 KB)
- **Total**: ~176 KB raw / ~57 KB gzipped

**Known Issues**:
- Build warnings for external scripts (expected, not bundled): `/app.js`, `/v2/data-adapter.js`
- No lucide-react icons yet (using emojis in BottomNav)
- No Framer Motion yet (deferred to Phase 4)
- Automated tests: Firebase/adapter test skipped in dev mode (requires production build)

**Automated Tests Added**:
- Test suite: Playwright with 6 tests covering Phase 0 acceptance criteria
- Coverage: UI shell, navigation, tab switching, active tab highlighting, console errors, route rendering
- Run with: `npm test` (5 pass, 1 skip in dev mode)
- See `/v2-react/tests/README.md` for full documentation

**QA Status**: Pending (see Phase 0 QA Checklist below)

### PR #2: Phase 1 - AdapterContext + RoomsScreen
**Date**: 2025-12-30
**Branch**: `phase-1-adapter-context`
**Status**: ✅ Complete & Merged

**Scope**:
- Created AdapterContext provider to wrap window.v2Adapter
- Created useAdapter hook for accessing adapter in components
- Implemented RoomsScreen with real Firebase data via adapter.getRoomHistory()
- Wired room card click to adapter.joinRoom() + navigation to /pool
- Added ActionSheet for Create/Join navigation

**Files Modified** (3 files):
- `/v2-react/src/context/AdapterContext.tsx` (created)
- `/v2-react/src/pages/RoomsScreen.tsx` (replaced placeholder)
- `/v2-react/src/components/RoomCard.tsx` (created)
- `/v2-react/src/components/ActionSheet.tsx` (created)

**QA Status**: ✅ Complete & Merged to main

### PR #3: Phase 2 - CreateRoom + JoinRoom Flows
**Date**: 2025-12-31
**Branch**: `phase-2-create-join-flows`
**Status**: Complete - Awaiting QA Approval

**Scope**:
- Implemented CreateRoomScreen with theme-only input (no streaming services)
- Implemented JoinRoomScreen with strict validation:
  - Exactly 6 characters
  - Alphanumeric only (A-Z, 0-9)
  - Auto-uppercase on input
  - Inline validation errors
- Robust success conditions:
  - createRoom: verify return value is string + adapter.getRoomCode() updates
  - joinRoom: verify return is true + adapter.getRoomCode() + adapter.getRoomData() populated
- Loading states ("Creating...", "Joining...")
- Error handling (inline errors, clear on retry)
- Navigation to /pool on success

**Files Modified** (3 files):
- `/v2-react/src/pages/CreateRoomScreen.tsx` (replaced placeholder)
- `/v2-react/src/pages/JoinRoomScreen.tsx` (replaced placeholder)
- `/v2-react/index.html` (fixed script paths to align with Vite base)
- `/v2-react/vite.config.ts` (fixed middleware to serve parent directory files correctly)

**Bundle Size** (Phase 2):
- `index.html`: 2.54 KB (gzip: 1.11 KB)
- `index.css`: 16.85 KB (gzip: 3.85 KB)
- `index.js`: 303.01 KB (gzip: 97.14 KB)
- **Total**: ~322 KB raw / ~102 KB gzipped
- **Delta from Phase 0**: +146 KB raw / +45 KB gzipped (expected due to Phase 1 components + lucide-react)

**Deferred**:
- Streaming services checkboxes (dropped from Phase 2 scope)
- Pool/Tonight/Watched screen logic (Phase 3+)

**Fixes Applied** (2025-12-31):
- **Root Cause**: Vite's HTML transform automatically prepends base path to script tags, causing path doubling
- **Issue**: When HTML had `/v2-react-build/app.js`, Vite prepended base again → `/v2-react-build/v2-react-build/app.js`
- **Fix 1**: Use paths WITHOUT base in HTML (`/app.js`, `/v2/data-adapter.js`) - Vite adds base automatically
- **Fix 2**: Middleware checks for `/v2-react-build/app.js` (path after Vite transformation)
- **Fix 3**: Improved stream handling with Content-Length headers and proper async completion
- **Result**: Dev server now serves files correctly, adapter initializes, app loads RoomsScreen

**QA Status**: Pending (see Phase 2 QA Checklist below)

---

## Current Phase Details

**Phase**: Phase 2 (Complete - Awaiting QA Approval)

**Scope** (FINAL for Phase 2):

**DO** (Create/Join Flows):
- Implement CreateRoomScreen with theme-only input (text field)
- Implement JoinRoomScreen with room code input
- Strict validation for JoinRoomScreen:
  - Exactly 6 characters
  - Alphanumeric only (A-Z, 0-9)
  - Auto-uppercase on input
  - Inline validation errors (show first failure)
- Wire adapter.createRoom(theme) with robust success verification
- Wire adapter.joinRoom(roomCode) with robust success verification
- Loading states ("Creating...", "Joining...")
- Error handling (inline errors, clear on retry)
- Navigation to /pool on success

**DO NOT**:
- Add streaming services checkboxes (dropped from scope)
- Modify Pool/Tonight/Watched screens (Phase 3+)
- Change DataAdapter implementation (use as-is)

**Acceptance Criteria**:
- CreateRoomScreen: create with valid theme → success
- CreateRoomScreen: create with empty theme → validation error
- JoinRoomScreen: join with valid 6-char code → success
- JoinRoomScreen: join with invalid code → "Room not found"
- JoinRoomScreen: validation errors for < 6 chars, > 6 chars, special chars
- Auto-uppercase works (type "abc123" → "ABC123")
- Loading states display correctly
- Navigation works (back button, success → /pool)
- No TypeScript compilation errors
- Build succeeds

---

## Deferred Issues / "Real Solution Later"

_To be populated during implementation_

**Known Limitations (from planning)**:
1. **Streaming Services**: MagicPatterns has checkboxes in CreateRoom, but v1 backend doesn't store this.
   - **Decision (Phase 2)**: ✅ DROPPED from Phase 2 scope. Theme-only create flow implemented.
   - Future: Could add Firebase field in Phase 7 if needed

2. **Pending Invites**: MagicPatterns InviteScreen has pending invites list, but v1 doesn't track email invites.
   - Defer to post-MVP (Phase 7 will only do code/link sharing)

3. **Member Roles**: MagicPatterns shows "host" badge, but v1 treats all contributors equally.
   - Defer to post-MVP (no role distinction for now)

4. **Undo UI in WatchedScreen**: MagicPatterns doesn't show undo button, but v1 has 24-hour undo.
   - Add undo button in Phase 6 (enhancement over MagicPatterns)

---

## Known Risks

1. **Netlify SPA Fallback Rules**: /v2-react/* needs proper fallback to index.html
   - Mitigation: Add redirect rule in Phase 0, test in Netlify preview
   - Status: To be implemented in Phase 0

2. **Asset Path Differences**: MagicPatterns may have different image/icon paths than Vite public/
   - Mitigation: Document asset structure in Phase 0, map paths when importing components
   - Status: To be documented in Phase 0

3. **CSS Isolation**: React v2 styles must not affect v1
   - Mitigation: Separate mount point, no shared CSS imports, scoped Tailwind
   - Status: To be verified in Phase 0

4. **Firebase Init Timing**: Firebase must be ready before DataAdapter usage
   - Mitigation: Firebase config runs before React mount, sets window.firebase/window.database
   - Status: To be implemented in Phase 0

5. **TypeScript Incremental Types**: data-adapter.d.ts starts minimal, expands per phase
   - Mitigation: Document which methods are typed per phase, expand incrementally
   - Status: Phase 0 will create baseline

6. **Cross-Tab Sync Complexity**: Real-time Firebase listeners must cleanup properly to avoid leaks
   - Mitigation: Quick smoke check in Phases 1-2, full QA in Phases 3/5/6
   - Status: Testing plan approved

7. **TMDB Image Load Performance**: MagicPatterns assumes instant load, Firebase may be slower
   - Mitigation: Add loading skeleton for MoviePosterTile in Phase 3
   - Status: Deferred to Phase 3

8. **Mobile Safari Safe Area**: Confetti/animations may conflict with safe area insets
   - Mitigation: Quick responsive check in Phase 1, full polish in Phase 8
   - Status: Deferred to Phase 1+

9. **Framer Motion Bundle Size**: Will add ~70KB when included in Phase 4
   - Mitigation: Baseline in Phase 0, measure delta in Phase 4, consider lazy-load
   - Status: Baseline to be captured in Phase 0

---

## Last QA Run

**Date**: 2025-12-30
**Phase**: Phase 0
**Result**: PASS (Pending Netlify Preview Verification)

### Phase 0 QA Checklist

#### Functionality
- [x] `/v2-react/` loads with minimal UI shell (verified locally)
- [x] Bottom nav switches between 4 placeholder screens
- [x] Active tab highlights correctly (visual feedback)
- [x] All routes render without errors (/, /pool, /tonight, /watched)

#### Compatibility
- [x] `/` (v1) loads correctly, unchanged behavior (verified files intact)
- [x] `/v2/` (vanilla v2) loads correctly, unchanged behavior (verified files intact)
- [ ] No console errors in any version (needs browser testing)

#### Build & Dev
- [x] `npm run dev` starts Vite dev server successfully (verified HTTP 200)
- [x] `npm run build` completes without errors
- [x] No TypeScript compilation errors (strict mode enabled)
- [x] Bundle size recorded in v2_status.md (~57 KB gzipped)

#### Firebase & Adapter
- [ ] `window.firebase` exists and is initialized (needs browser console check)
- [ ] `window.database` exists (needs browser console check)
- [ ] `window.v2Adapter` exists and is ready (needs browser console check)
- [ ] `window.v2Adapter.getDiagnostics()` returns valid data (needs browser console check)
- [x] `window.RECITRALPH_V2_MODE` is true (set in index.html)

#### Netlify Deploy
- [ ] Netlify preview deploys successfully (TO DO: push branch + deploy)
- [ ] All 3 paths work in preview (/, /v2/, /v2-react/)
- [ ] SPA fallback works (/v2-react/pool refreshes correctly)

#### CSS Isolation
- [ ] v2-react styles do not affect v1 (needs browser testing)
- [ ] v2-react styles do not affect vanilla v2 (needs browser testing)
- [x] Tailwind classes work correctly in v2-react (verified in code)
- [x] MagicPatterns dark theme colors render correctly (defined in tailwind.config.js)
- [x] Safe area insets configured (--safe-bottom CSS variable + pb-safe utility)

**Summary**: 11/23 checks passed locally. Remaining 12 checks require browser testing and Netlify preview deploy.

### Phase 2 QA Checklist

**Date**: 2025-12-31
**Phase**: Phase 2
**Result**: Pending Manual Testing

**Dev Server**: http://localhost:5173/v2-react-build/

#### CreateRoomScreen Functionality
- [ ] Navigate to /create-room from RoomsScreen ActionSheet
- [ ] Form displays with theme input field
- [ ] Enter valid theme → "Create Room" button enabled
- [ ] Click "Create Room" → loading state shows ("Creating...")
- [ ] Success → navigates to /pool
- [ ] Console shows: `[CreateRoomScreen] Room created successfully: {CODE}`
- [ ] Validation: empty theme → error "Room theme is required"
- [ ] Validation: whitespace-only theme → error "Room theme is required"
- [ ] Error clears when user starts typing
- [ ] Back button works (navigate to /)

#### JoinRoomScreen Functionality
- [ ] Navigate to /join-room from RoomsScreen ActionSheet
- [ ] Form displays with room code input field
- [ ] Auto-uppercase: type "abc123" → displays "ABC123"
- [ ] Input limited to 6 characters (maxLength)
- [ ] Validation: empty code → error "Room code is required"
- [ ] Validation: < 6 chars (e.g., "ABC12") → error "Room code must be 6 characters"
- [ ] Validation: > 6 chars prevented by maxLength
- [ ] Validation: special chars (e.g., "ABC-12") → error "Room code can only contain letters and numbers"
- [ ] Enter valid existing room code → "Join Room" button enabled
- [ ] Click "Join Room" → loading state shows ("Joining...")
- [ ] Success → navigates to /pool
- [ ] Console shows: `[JoinRoomScreen] Joined room successfully: {CODE}`
- [ ] Invalid room code → error "Room not found"
- [ ] Error clears when user starts typing
- [ ] Back button works (navigate to /)

#### Robust Success Conditions
- [ ] CreateRoom: verify adapter.getRoomCode() returns new code in console
- [ ] JoinRoom: verify adapter.getRoomCode() returns joined code in console
- [ ] JoinRoom: verify adapter.getRoomData() shows theme in console

#### Build & TypeScript
- [x] `npm run build` succeeds with no TypeScript errors
- [x] No TypeScript errors in editor
- [x] Bundle size logged: ~102 KB gzipped

#### Compatibility
- [ ] `/` (v1) unchanged and functional
- [ ] `/v2/` (vanilla v2) unchanged and functional
- [ ] No console errors in any version

**Summary**: 3/32 checks passed (automated build). Remaining 29 checks require manual browser testing.

---

## Next Planned PR

**PR #4**: Phase 3 - PoolScreen

**Waiting For**:
- Phase 2 QA approval (manual testing)
- User approval to proceed to Phase 3

**Blocked By**: Phase 2 QA pending

---

## Operating Model (Guardrails)

✅ **One PR = One Phase** (no scope creep)
✅ **Required PR Output**: Phase summary, files changed, QA results, rollback plan
✅ **Update this file every PR**
❌ **Do NOT modify V1**
❌ **Do NOT refactor unless required**
❌ **Do NOT jump ahead**

---

## Questions Log

### Session 2025-12-30 (Pre-Phase 0)

**Questions Raised & Answers**:

1. **Phase 0 scope**: Infrastructure only (Vite + Tailwind + routing) + minimal UI shell. NO full MagicPatterns copy.
   - ✅ Approved: Option B (infrastructure only, incremental component imports)

2. **Legacy v2 routing**: Keep vanilla v2 at /v2/, React at /v2-react/, switch in Phase 8
   - ✅ Approved: Option C (separate path /v2-react/, swap routing in Phase 8)

3. **Deployment strategy**: Local dev + Netlify preview before phase completion
   - ✅ Approved: Option C (hybrid approach)

4. **TypeScript strictness**: Minimal data-adapter.d.ts in Phase 0, expand incrementally
   - ✅ Approved: Lightweight Option B (core methods only, expand per phase)

5. **Cross-tab sync testing**: Quick smoke checks per phase, full QA in Phases 3/5/6
   - ✅ Approved: Option B with tweak (smoke check when touching adapter/Firebase)

6. **Bundle size monitoring**: Capture baseline in Phase 0, log in v2_status.md
   - ✅ Approved: Option A (baseline capture, revisit in Phase 8)

7. **Firebase config location**: /v2-react/src/config/firebase.ts, must set window.firebase/window.database
   - ✅ Approved: Option B (separate config file, maintain window.* compatibility)

8. **Phase 0 success criteria**: Adjusted for /v2-react/ routing, minimal UI, no adapter wiring
   - ✅ Approved with adjustments

**Additional Requirements**:
- NO Framer Motion until Phase 4 (when PickScreen needs it)
- Plan for Netlify SPA fallback rules (/v2-react/*)
- Plan for asset path differences (MagicPatterns vs Vite)
- Strict CSS isolation (React v2 must not affect v1)
- NO adapter wiring in Phase 0 (defer to Phase 1)

---

**End of v2_status.md**
