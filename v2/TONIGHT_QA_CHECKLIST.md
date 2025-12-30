# Tonight Tab QA Checklist

## Overview
This checklist validates the Tonight tab implementation in v2, including tonight pick persistence, UI states, and cross-version sync.

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
   - Navigate to Tonight tab

---

## Test Cases

### 1. UI State: No Room Joined

**Steps:**
1. Open /v2/ (no room in localStorage)
2. Navigate to Tonight tab

**Expected:**
- ✅ Display "No room joined" empty state
- ✅ Show "Go to Rooms" button
- ✅ Button navigates to Rooms tab

**Console Logs:**
```
[Tonight] No room code, skipping subscription
```

---

### 2. UI State: Room Joined, Pool Empty

**Steps:**
1. Join/create a room
2. Ensure pool is empty (0 movies)
3. Navigate to Tonight tab

**Expected:**
- ✅ Display "No movies in pool" empty state
- ✅ Show "Go to Pool" button
- ✅ Button navigates to Pool tab

**Console Logs:**
```
[Tonight] Setting up real-time subscription for room: ABC123
[V2 Adapter] Firebase listener attached for room: ABC123
```

---

### 3. UI State: Pool Has Movies, No Pick

**Steps:**
1. Join/create room with movies in pool
2. Ensure no tonight pick exists
3. Navigate to Tonight tab

**Expected:**
- ✅ Display "No movie selected" state
- ✅ Show movie count: "You have X movies in your pool"
- ✅ Show "🎲 Pick tonight's movie" button

**Console Logs:**
```
[Tonight] Setting up real-time subscription for room: ABC123
```

---

### 4. Pick Tonight's Movie

**Steps:**
1. On Tonight tab with no pick
2. Click "🎲 Pick tonight's movie"

**Expected:**
- ✅ Movie card appears immediately
- ✅ Card shows movie title
- ✅ Card shows poster (if tmdbData exists) or placeholder
- ✅ Card shows "Suggested by: [names]"
- ✅ "✓ Mark Watched" button visible
- ✅ "🎲 Pick Again" button visible

**Console Logs:**
```
[Tonight] Picking tonight's movie
[V2 Adapter] Picking tonight's movie
[AppState] Tonight pick set: Frozen
[AppState DEBUG] ►►► save() called ◄◄◄
[AppState DEBUG] → Calling saveToFirebase()
[AppState DEBUG] ✓ Firebase write SUCCESS
[Tonight] Movie picked: Frozen
[Tonight] ✓ Real-time update received for room: ABC123
```

---

### 5. Tonight Pick Persists After Refresh

**Steps:**
1. Pick a movie (e.g., "Frozen")
2. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
3. Navigate to Tonight tab

**Expected:**
- ✅ Same movie still shown (Frozen)
- ✅ No "pick again" automatic behavior

**Console Logs:**
```
[Tonight] Setting up real-time subscription for room: ABC123
[V2 Adapter] Firebase listener attached for room: ABC123
```

---

### 6. Pick Again (Re-roll)

**Steps:**
1. Have a movie picked
2. Click "🎲 Pick Again"

**Expected:**
- ✅ New movie appears (may be same if pool has only 1-2 movies)
- ✅ Card updates immediately
- ✅ If pool has 3+ movies, usually picks a different one

**Console Logs:**
```
[Tonight] Picking again
[V2 Adapter] Picking tonight's movie
[AppState] Tonight pick set: Moana
[Tonight] New pick: Moana
[Tonight] ✓ Real-time update received for room: ABC123
```

---

### 7. Mark Watched - Clears Tonight Pick

**Steps:**
1. Have a movie picked (e.g., "Frozen")
2. Click "✓ Mark Watched"

**Expected:**
- ✅ Movie disappears from Tonight tab
- ✅ UI returns to "No movie selected" state (State C)
- ✅ Movie appears in Watched tab
- ✅ Movie removed from Pool tab
- ✅ Tonight pick is null

**Console Logs:**
```
[Tonight] Marking tonight's movie as watched: Frozen
[V2 Adapter] Marking movie as watched: Frozen
[AppState] Clearing tonight pick (movie was marked watched)
[AppState DEBUG] ►►► save() called ◄◄◄
[AppState DEBUG] ✓ Firebase write SUCCESS
[Tonight] ✓ Movie marked watched
[Tonight] ✓ Real-time update received for room: ABC123
```

---

### 8. Cross-Version Sync: v2 Pick Visible in v1 Data

**Steps:**
1. In v2: Pick a movie (e.g., "Frozen")
2. In v1 (open http://localhost:8080/ in new tab)
3. Open DevTools Console in v1
4. Type: `window.appState.data.tonightPick`

**Expected:**
- ✅ Console shows tonight pick object:
  ```js
  {
    title: "Frozen",
    suggestedBy: ["abc123"],
    tmdbData: {...},
    addedAt: 1234567890
  }
  ```

**Notes:**
- v1 UI doesn't render tonight pick (expected)
- v1 data contains tonightPick field (backwards compatible)

---

### 9. Cross-Tab Real-Time Sync

**Steps:**
1. Open v2 in two browser tabs (Tab A and Tab B)
2. Both tabs on Tonight screen
3. In Tab A: Pick a movie
4. Watch Tab B

**Expected:**
- ✅ Tab B shows same picked movie immediately
- ✅ No manual refresh needed
- ✅ Firebase real-time listener working

**Console Logs (Tab B):**
```
[Tonight] ✓ Real-time update received for room: ABC123
```

---

### 10. Cleanup: Prevent Duplicate Listeners

**Steps:**
1. Navigate to Tonight tab
2. Navigate to Pool tab
3. Navigate back to Tonight tab
4. Repeat 5 times

**Expected:**
- ✅ No duplicate subscription logs
- ✅ Only one listener active per tab visit
- ✅ Old listeners cleaned up

**Console Logs:**
```
[Tonight] Setting up real-time subscription for room: ABC123
[V2 Shell] Cleaning up tonight screen
[Tonight] Cleaning up subscription
[Tonight] Already subscribed to room: ABC123 - skipping duplicate subscription
```

---

### 11. Edge Case: Pool Becomes Empty After Pick

**Steps:**
1. Add 1 movie to pool
2. Pick it as tonight's movie
3. Use another device/tab to remove all movies from pool

**Expected:**
- ✅ Tonight pick still displays (shows picked movie)
- ✅ "Mark Watched" still works
- ✅ "Pick Again" shows "No movies in pool" warning

**Notes:**
- Tonight pick stored as full object, not reference
- Independent of pool state

---

### 12. Contributor Names Display

**Steps:**
1. Add contributors: "Alice" and "Bob"
2. Add movie suggested by both (use Pool's "Add Movie" twice with different contributors)
3. Pick that movie

**Expected:**
- ✅ Card shows "Suggested by: Alice, Bob"
- ✅ Names separated by commas
- ✅ If contributor deleted, shows ID initials as fallback

---

### 13. TMDB Data Display

**Steps:**
1. Pick a movie WITH tmdbData (poster, overview, year, runtime)
2. Pick a movie WITHOUT tmdbData (manually added)

**Expected WITH tmdbData:**
- ✅ Poster image loads
- ✅ Overview text displays (clamped to 4 lines)
- ✅ Year and runtime display

**Expected WITHOUT tmdbData:**
- ✅ Placeholder poster (gradient background)
- ✅ No overview, year, or runtime
- ✅ Title and "Suggested by" still display

---

### 14. Firebase Data Model Validation

**Steps:**
1. Pick a movie
2. Open Firebase Console
3. Navigate to: `rooms/ABC123/tonightPick`

**Expected:**
```json
{
  "title": "Frozen",
  "originalTitle": "Frozen",
  "suggestedBy": ["abc123"],
  "isAutoAdded": false,
  "addedAt": 1234567890,
  "tmdbData": {
    "poster_path": "/...",
    "overview": "...",
    "release_date": "2013-11-27",
    "runtime": 102
  }
}
```

**Validation:**
- ✅ Full movie object stored
- ✅ Includes tmdbData if present
- ✅ Backwards compatible (null for old rooms)

---

### 15. Backwards Compatibility

**Steps:**
1. Open v1 and create a new room
2. Add movies in v1
3. Open same room in v2
4. Navigate to Tonight tab and pick a movie
5. Return to v1

**Expected:**
- ✅ v1 doesn't crash
- ✅ v1 data includes tonightPick field
- ✅ v1 UI unchanged (doesn't render tonight pick)
- ✅ v2 pick persists in Firebase

---

## Performance Checks

### Real-Time Latency
- ✅ Pick appears within 500ms
- ✅ Mark watched clears within 500ms
- ✅ Cross-tab updates within 1s

### Memory Leaks
- ✅ No zombie listeners after 10 tab switches
- ✅ Cleanup() properly detaches listeners

---

## Known Limitations

1. **Pick Again Algorithm:** Simple retry (5 attempts). May pick same movie if unlucky.
2. **Undo Watched:** Not implemented in Tonight tab (use Watched tab's undo if needed within 24h).
3. **Movie References:** Tonight pick stores full object. If movie pool title changes elsewhere, pick won't auto-update.

---

## Success Criteria Summary

- [x] All 4 UI states render correctly
- [x] Pick persists to Firebase with full movie object
- [x] Mark watched clears tonight pick automatically
- [x] Real-time sync works across tabs and v1/v2
- [x] Cleanup prevents duplicate listeners
- [x] Backwards compatible with v1
- [x] Console logs match expected patterns
- [x] No errors in production build
