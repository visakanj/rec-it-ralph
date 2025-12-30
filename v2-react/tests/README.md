# V2 React Automated Tests

## Overview

Automated test suite using Playwright to verify Phase 0 acceptance criteria.

## Running Tests

```bash
# Run all tests (headless)
npm test

# Run tests with UI (interactive)
npm run test:ui

# View test report
npm run test:report
```

## Test Coverage (Phase 0)

### ✅ What's Tested

1. **UI Shell** - `/v2-react/` loads with bottom nav and 4 tabs visible
2. **Navigation** - All routes render without errors (/, /pool, /tonight, /watched)
3. **Tab Switching** - Bottom nav switches between placeholder screens correctly
4. **Active Tab Highlighting** - Active tab gets `text-accent` class applied
5. **No Console Errors** - Page loads without unexpected console errors
6. **All Routes Accessible** - Each route renders properly on direct navigation

### ⏭️ What's Skipped (in dev mode)

- **Firebase & Adapter Check** - Requires production build (skipped in dev mode)
  - Reason: `/app.js` and `/v2/data-adapter.js` are not served by Vite dev server
  - This test will run in CI/production environments

## Known Warnings

**404 Errors for `/app.js` and `/v2/data-adapter.js`**:
- These are expected in dev mode
- Files are outside `/v2-react/` directory and not served by Vite dev server
- In production (Netlify), these files are served from root and work correctly
- Tests filter out 404 errors as expected warnings

## Test Structure

```
tests/
  phase-0.spec.ts  - Phase 0 acceptance criteria tests
```

## Future Phases

As we progress through phases, additional test files will be added:
- `phase-1.spec.ts` - RoomsScreen + AdapterContext tests
- `phase-2.spec.ts` - CreateRoom + JoinRoom tests
- `phase-3.spec.ts` - PoolScreen real-time sync tests
- etc.

Each phase will add tests for new features while maintaining all previous phase tests.
