# Watched Tab QA Checklist

## Overview
This checklist validates the Watched tab implementation in v2, including watched movie display, undo functionality (24h limit), real-time updates, and listener cleanup.

---

## Test Environment Setup

1. **Prerequisites:**
   - Server running: `npx serve -l 8080`
   - Browser: http://localhost:8080/v2/
   - DevTools Console open
   - Firebase connection active

2. **Initial State:**
   - Join or create a room
   - Add at least 2 contributors
   - Add at least 3 movies to pool
   - Mark 2-3 movies as watched (from Pool or Tonight tabs)
   - Navigate to Watched tab

---

## Test Cases

### 1. UI State: No Room Joined

**Steps:**
1. Open /v2/ (no room in localStorage)
2. Navigate to Watched tab

**Expected:**
- ✅ Display "No room joined" empty state
- ✅ Show "Go to Rooms" button
- ✅ Button navigates to Rooms tab

**Console Logs:**
```
[Watched] No room code, skipping subscription
```

---

### 2. UI State: Room Joined, No Watched Movies

**Steps:**
1. Join/create a room
2. Ensure watchedMovies array is empty
3. Navigate to Watched tab

**Expected:**
- ✅ Display "No watched movies yet" empty state
- ✅ Show "Go to Pool" button
- ✅ Button navigates to Pool tab

**Console Logs:**
```
[Watched] Setting up real-time subscription for room: ABC123
[V2 Adapter] Firebase listener attached for room: ABC123
```

---

### 3. UI State: Room with Watched Movies

**Steps:**
1. Mark 3 movies as watched (from Pool or Tonight)
2. Navigate to Watched tab

**Expected:**
- ✅ Display header: "Watched" with count "3 movies"
- ✅ List shows 3 watched items
- ✅ Each item shows:
  - Poster (if tmdbData exists) or placeholder
  - Movie title
  - Time ago (e.g., "5 minutes ago", "2 hours ago")
  - Year (if tmdbData.release_date exists)
  - "Suggested by: [names]"
  - "↩ Undo" button (if eligible)

**Console Logs:**
```
[Watched] Setting up real-time subscription for room: ABC123
[Watched] ✓ Real-time update received for room: ABC123 - watched: 3
```

---

### 4. Real-Time Update: Mark Watched from Pool

**Steps:**
1. Open Watched tab
2. In another tab/window, open Pool
3. Mark a movie as watched from Pool
4. Watch Watched tab

**Expected:**
- ✅ Watched list updates immediately
- ✅ New movie appears at top of list
- ✅ Count updates (e.g., "3 movies" → "4 movies")

**Console Logs:**
```
[Watched] ✓ Real-time update received for room: ABC123 - watched: 4
```

---

### 5. Real-Time Update: Mark Watched from Tonight

**Steps:**
1. Open Watched tab
2. In Tonight tab, pick a movie and mark it watched
3. Watch Watched tab

**Expected:**
- ✅ Watched list updates immediately
- ✅ New movie appears at top
- ✅ Tonight pick is cleared (Tonight returns to "No pick" state)

**Console Logs:**
```
[AppState] Clearing tonight pick (movie was marked watched)
[Watched] ✓ Real-time update received for room: ABC123 - watched: X
```

---

### 6. Undo Watched - Within 24 Hours (Eligible)

**Steps:**
1. Mark a movie watched (it should appear immediately)
2. Click "↩ Undo" button on that movie

**Expected:**
- ✅ Movie disappears from Watched list
- ✅ Movie returns to Pool (check Pool tab)
- ✅ Count decreases
- ✅ No error message shown

**Console Logs:**
```
[Watched] Undoing watched movie: Frozen
[V2 Adapter] Undoing watched movie: Frozen
[Watched] ✓ Movie returned to pool: Frozen
[Watched] ✓ Real-time update received for room: ABC123 - watched: X
```

---

### 7. Undo Watched - Beyond 24 Hours (Ineligible)

**Steps:**
1. Find a movie watched >24h ago (or simulate by manipulating watchedAt in Firebase Console)
2. Check its Undo button state

**Expected:**
- ✅ Button shows "Undo expired" (disabled state)
- ✅ Button has `disabled` attribute
- ✅ Tooltip shows "Undo expired (>24h)"
- ✅ Button is not clickable

**If user somehow clicks (via dev tools):**
- ✅ Error message appears: "Cannot undo - more than 24 hours have passed"
- ✅ Movie stays in watched list

**Console Logs:**
```
[Watched] Cannot undo - more than 24 hours have passed
```

---

### 8. Undo Eligibility Display

**Steps:**
1. Mark a movie watched right now
2. Observe undo button

**Expected:**
- ✅ Button shows "↩ Undo"
- ✅ Tooltip shows "Undo within 24h" (or remaining hours)
- ✅ Button is enabled and clickable
- ✅ As time passes, hours remaining decreases (check tooltip)

**Notes:**
- Client-side check: `(Date.now() - movie.watchedAt) < 24 * 60 * 60 * 1000`
- Server-side enforcement in AppState.undoWatched()

---

### 9. Undo Error Handling

**Steps:**
1. Simulate error by manipulating data or network
2. Attempt undo

**Expected:**
- ✅ Error banner appears at top of screen
- ✅ Error message: "⚠️ Failed to undo: [error message]"
- ✅ Error is dismissible (click X or anywhere on banner)
- ✅ After dismissal, error disappears

**Console Logs:**
```
[Watched] Undo error: [error details]
```

---

### 10. Watched List Persistence After Refresh

**Steps:**
1. Mark 3 movies as watched
2. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
3. Navigate to Watched tab

**Expected:**
- ✅ All 3 watched movies still shown
- ✅ Time ago updates correctly (not reset)
- ✅ Undo eligibility preserved

**Console Logs:**
```
[Watched] Setting up real-time subscription for room: ABC123
[Watched] ✓ Real-time update received for room: ABC123 - watched: 3
```

---

### 11. Cleanup: Prevent Duplicate Listeners

**Steps:**
1. Navigate to Watched tab
2. Navigate to Pool tab
3. Navigate back to Watched tab
4. Repeat 5 times

**Expected:**
- ✅ No duplicate subscription logs
- ✅ Only one listener active per tab visit
- ✅ Old listeners cleaned up

**Console Logs:**
```
[Watched] Setting up real-time subscription for room: ABC123
[V2 Shell] Cleaning up watched screen
[Watched] ✓ Cleanup called - unsubscribing from room: ABC123
[Watched] Already subscribed to room: ABC123 - skipping duplicate subscription
```

---

### 12. Cross-Tab Synchronization

**Steps:**
1. Open v2 in two browser tabs (Tab A and Tab B)
2. Both tabs on Watched screen
3. In Tab A: Go to Pool, mark a movie watched
4. Watch Tab B

**Expected:**
- ✅ Tab B shows new watched movie immediately
- ✅ No manual refresh needed
- ✅ Firebase real-time listener working

**Console Logs (Tab B):**
```
[Watched] ✓ Real-time update received for room: ABC123 - watched: X
```

---

### 13. Poster Display

**Steps:**
1. Mark a movie WITH tmdbData (has poster_path)
2. Mark a movie WITHOUT tmdbData (manually added)
3. Navigate to Watched tab

**Expected WITH tmdbData:**
- ✅ Poster image loads from TMDB (w200 size)
- ✅ Image has proper aspect ratio
- ✅ Year displays from release_date

**Expected WITHOUT tmdbData:**
- ✅ Placeholder shows (gradient background + 🎬 icon)
- ✅ No year displays
- ✅ Title and "Suggested by" still display

---

### 14. Time Ago Formatting

**Steps:**
1. Mark movies at different times (simulate or wait)
2. Check time ago display

**Expected Formats:**
- ✅ "Just now" (< 1 minute)
- ✅ "5 minutes ago" (< 1 hour)
- ✅ "2 hours ago" (< 1 day)
- ✅ "1 day ago" (24-47 hours)
- ✅ "3 days ago" (> 2 days)

**Tooltip:**
- ✅ Hover/long-press shows full timestamp
- ✅ Format: locale-specific (e.g., "12/28/2024, 3:45:00 PM")

---

### 15. Contributor Names Display

**Steps:**
1. Add contributors: "Alice" and "Bob"
2. Add movie suggested by Alice (contributor ID: abc123)
3. Add movie suggested by both Alice and Bob
4. Mark both movies watched

**Expected:**
- ✅ Single contributor: "Suggested by: Alice"
- ✅ Multiple contributors: "Suggested by: Alice, Bob"
- ✅ Names separated by commas

**If contributor deleted:**
- ✅ Shows ID initials as fallback (e.g., "AB")

---

### 16. Max 20 Watched Movies Limit

**Steps:**
1. Mark 25 movies as watched (add more movies if needed)
2. Check Watched tab

**Expected:**
- ✅ Only 20 most recent movies shown
- ✅ Oldest 5 movies not displayed (automatically pruned)
- ✅ Enforced by AppState.movePoolToWatched() at line 1246-1248

**Notes:**
- Limit is server-side (AppState)
- v2 just displays what Firebase provides

---

### 17. Rapid Tab Switching

**Steps:**
1. Rapidly click: Rooms → Pool → Tonight → Watched → Rooms → Pool → Tonight → Watched
2. Do this 10 times quickly

**Expected:**
- ✅ No console errors
- ✅ No zombie listeners
- ✅ Each screen shows correct data
- ✅ Cleanup logs appear for each navigation

**Console Logs:**
```
[V2 Shell] Cleaning up watched screen
[Watched] ✓ Cleanup called - unsubscribing from room: ABC123
[Watched] Setting up real-time subscription for room: ABC123
```

---

### 18. Scroll Position Preservation

**Steps:**
1. Add 10+ watched movies (long list)
2. Scroll halfway down
3. Undo a movie (triggers rerender)

**Expected:**
- ✅ Scroll position preserved after rerender
- ✅ User stays at same scroll location

**Implementation:**
- Stored at line 468: `const scrollTop = this.container.scrollTop`
- Restored at line 477: `this.container.scrollTop = scrollTop`

---

### 19. Backwards Compatibility: v1 Integration

**Steps:**
1. Open v1 (http://localhost:8080/)
2. Mark a movie as watched in v1
3. Switch to v2 Watched tab

**Expected:**
- ✅ v2 shows v1-watched movie
- ✅ Real-time sync works across versions
- ✅ Undo works (returns movie to v1 pool)

**Notes:**
- Same Firebase backend
- Same data structure (watchedAt timestamp)

---

### 20. Empty State Navigation

**Steps:**
1. From "No room joined" state, click "Go to Rooms"
2. From "No watched movies" state, click "Go to Pool"

**Expected:**
- ✅ "Go to Rooms" navigates to Rooms tab
- ✅ "Go to Pool" navigates to Pool tab
- ✅ Navigation uses `appShell.navigateTo()`

---

## Performance Checks

### Real-Time Latency
- ✅ Watched appears within 500ms of marking
- ✅ Undo updates within 500ms
- ✅ Cross-tab updates within 1s

### Memory Leaks
- ✅ No zombie listeners after 10 tab switches
- ✅ Cleanup() properly detaches listeners

---

## Console Log Patterns (Expected Output)

### Normal Flow:
```
[Watched] Setting up real-time subscription for room: ABC123
[V2 Adapter] Firebase listener attached for room: ABC123
[Watched] ✓ Real-time update received for room: ABC123 - watched: 3
```

### Undo Flow:
```
[Watched] Undoing watched movie: Frozen
[V2 Adapter] Undoing watched movie: Frozen
[Watched] ✓ Movie returned to pool: Frozen
[AppState DEBUG] ►►► save() called ◄◄◄
[AppState DEBUG] ✓ Firebase write SUCCESS
[Watched] ✓ Real-time update received for room: ABC123 - watched: 2
```

### Cleanup Flow:
```
[V2 Shell] Cleaning up watched screen
[Watched] ✓ Cleanup called - unsubscribing from room: ABC123
```

### Error Flow:
```
[Watched] Cannot undo - more than 24 hours have passed
[Watched] Undo failed - time limit exceeded
```

---

## Success Criteria Summary

- [x] All 3 UI states render correctly (no room, empty, with movies)
- [x] Real-time subscription works across tabs and screens
- [x] Undo works within 24h limit
- [x] Undo expired (>24h) properly disabled
- [x] Error handling shows user-visible messages
- [x] Cleanup prevents duplicate listeners
- [x] Poster images load correctly (TMDB + placeholder)
- [x] Time ago formatting accurate
- [x] Contributor names displayed
- [x] Scroll position preserved on rerender
- [x] Backwards compatible with v1
- [x] Navigation CTAs work
- [x] Console logs match expected patterns
- [x] No errors in production build
