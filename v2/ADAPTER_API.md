# DataAdapter API Documentation (Phase 1a)

## Overview

The DataAdapter provides a clean, Promise-based API for v2 screens to interact with the v1 AppState and Firebase. All v2 screens **must** use this adapter - do NOT access `window.appState` directly.

## Initialization

The adapter is automatically initialized when v2 loads:

```javascript
// Adapter is globally available
const adapter = window.v2Adapter;

// Wait for adapter to be ready
await adapter.readyPromise;
```

## Room Management

### Create a New Room

```javascript
// Creates a room with a random 6-character code
const roomCode = await adapter.createRoom("Horror Movies");
// Returns: "ABC123" (example)

// Automatically:
// - Creates room in Firebase
// - Adds to v2 room history (localStorage)
// - Sets as current room
```

### Join an Existing Room

```javascript
const success = await adapter.joinRoom("XYZ789");
// Returns: true if successful, false if room doesn't exist

// Automatically:
// - Loads room from Firebase
// - Adds to v2 room history
// - Sets as current room
```

### Switch Between Rooms

```javascript
// Alias for joinRoom
await adapter.setCurrentRoom("ABC123");
```

### Subscribe to Room Updates (Live Data)

```javascript
// Subscribe to real-time updates
const unsubscribe = adapter.subscribeRoom("ABC123", (roomData) => {
  console.log("Room updated!", roomData);
  // roomData contains: theme, contributors, moviePool, watchedMovies, etc.
});

// Unsubscribe when done
unsubscribe();
```

### Get Current Room Info

```javascript
// Get current room code
const roomCode = adapter.getRoomCode();
// Returns: "ABC123" or null

// Get full room data
const roomData = adapter.getRoomData();
// Returns: { theme, contributors, moviePool, watchedMovies, ... }

// Get theme only
const theme = adapter.getTheme();
// Returns: "Horror Movies"
```

## Contributor Management

### Add a Contributor

```javascript
const contributor = adapter.addContributor("Alice");
// Returns: { id: "xyz123", name: "Alice", color: "#ff5733", movies: [] }
```

### Get All Contributors

```javascript
const contributors = adapter.getContributors();
// Returns: [{ id, name, color, movies }, ...]
```

### Remove a Contributor

```javascript
adapter.removeContributor("contributorId");
```

## Movie Management

### Add a Movie to the Pool

```javascript
const movie = await adapter.addMovie("contributorId", "The Shining");
// Returns: { title, tmdbData: { poster_path, vote_average, ... }, suggestedBy: [...] }

// Automatically:
// - Searches TMDB for metadata and poster
// - Detects sequels
// - Adds to pool with real-time sync
```

### Get Movie Pool

```javascript
const movies = adapter.getMoviePool();
// Returns: [{ title, tmdbData, suggestedBy, addedAt }, ...]
```

### Pick a Random Movie

```javascript
const randomMovie = adapter.pickRandomMovie();
// Returns: Random movie object from pool, or null if pool is empty
```

### Mark a Movie as Watched

```javascript
await adapter.markWatched(movie);
// Moves movie from pool to watched list
// Adds watchedAt timestamp
```

### Get Watched Movies

```javascript
const watched = adapter.getWatchedMovies();
// Returns: [{ title, watchedAt, suggestedBy }, ...]
```

### Undo Watched (within 24 hours)

```javascript
const success = adapter.undoWatched(watchedMovie);
// Returns: true if successful (within 24h), false otherwise
// Moves movie back to pool
```

### Remove Movie from Pool

```javascript
adapter.removeMovie(movieIndex);
// Removes movie at given index from pool
```

## TMDB Integration

### Search for a Movie

```javascript
const result = await adapter.searchMovie("Inception");
// Returns: { title, poster_path, vote_average, id, ... }
```

### Get Streaming Providers

```javascript
const providers = await adapter.getProviders(tmdbMovieId);
// Returns: { US: { flatrate: [...], rent: [...], buy: [...] } }
```

## V2 Room History (Namespaced localStorage)

### Get Room History

```javascript
const history = adapter.getRoomHistory();
// Returns: [
//   { roomCode: "ABC123", theme: "Horror", lastVisited: 1234567890, createdAt: 1234567890 },
//   ...
// ]
// Sorted by lastVisited (most recent first)
// Max 20 rooms stored
```

### Clear Room History

```javascript
adapter.clearRoomHistory();
// Removes all v2 room history from localStorage
```

## Diagnostics

### Get Diagnostics Info

```javascript
const diag = adapter.getDiagnostics();
// Returns: {
//   ready: true,
//   roomCode: "ABC123",
//   theme: "Horror Movies",
//   contributorsCount: 3,
//   moviePoolCount: 12,
//   watchedCount: 5,
//   isFirebaseMode: true,
//   roomHistoryCount: 4
// }
```

### Check if Ready

```javascript
const isReady = adapter.isReady();
// Returns: true if AppState and TMDBService are initialized
```

## Console Testing Commands

Open `/v2/` in your browser and try these in the console:

```javascript
// Get diagnostics
v2Adapter.getDiagnostics()

// Create a test room
const roomCode = await v2Adapter.createRoom("Test Theme")
console.log("Created room:", roomCode)

// Add a contributor
const alice = v2Adapter.addContributor("Alice")
console.log("Added contributor:", alice)

// Add a movie
const movie = await v2Adapter.addMovie(alice.id, "The Matrix")
console.log("Added movie:", movie)

// Get current state
console.log("Contributors:", v2Adapter.getContributors())
console.log("Movies:", v2Adapter.getMoviePool())

// Subscribe to updates
const unsub = v2Adapter.subscribeRoom(roomCode, (data) => {
  console.log("Room updated:", data.moviePool.length, "movies")
})

// Join from v1, watch updates in v2!
// Open / in another tab, join the same room, add movies
// v2 will show live updates

// Cleanup
unsub()

// Check room history
v2Adapter.getRoomHistory()
```

## Example: Complete Room Flow

```javascript
// 1. Wait for adapter
await v2Adapter.readyPromise;

// 2. Create a room
const roomCode = await v2Adapter.createRoom("90s Action Movies");

// 3. Add contributors
const bob = v2Adapter.addContributor("Bob");
const alice = v2Adapter.addContributor("Alice");

// 4. Add movies
await v2Adapter.addMovie(bob.id, "Die Hard");
await v2Adapter.addMovie(bob.id, "Speed");
await v2Adapter.addMovie(alice.id, "The Matrix");
await v2Adapter.addMovie(alice.id, "Face/Off");

// 5. Pick random movie
const picked = v2Adapter.pickRandomMovie();
console.log("Let's watch:", picked.title);

// 6. Mark as watched
await v2Adapter.markWatched(picked);

// 7. Check state
console.log("Pool:", v2Adapter.getMoviePool().length, "movies");
console.log("Watched:", v2Adapter.getWatchedMovies().length, "movies");
```

## Storage Keys

### V2 Namespaced Keys
- `recitralph:v2:rooms` - Room history (max 20)

### V1 Keys (DO NOT USE IN V2)
- `rec-it-ralph-state` - V1 localStorage state

## Rules for V2 Screens

1. ✅ **DO** use `adapter.getMoviePool()` to access movie pool
2. ✅ **DO** use `adapter.subscribeRoom()` for live updates
3. ✅ **DO** use `await adapter.readyPromise` before adapter calls
4. ❌ **DO NOT** access `window.appState` directly
5. ❌ **DO NOT** call Firebase methods directly
6. ❌ **DO NOT** read/write v1 localStorage keys

## Live Data Updates

The adapter automatically keeps v2 in sync with Firebase:

1. When data changes in v1 → Firebase updates → v2 `subscribeRoom` callbacks fire
2. When data changes in v2 → Adapter calls AppState methods → Firebase syncs → v1 updates
3. Real-time collaboration works seamlessly between v1 and v2

## Firebase Mode vs. Offline Mode

```javascript
// Check if Firebase is connected
const diag = adapter.getDiagnostics();
if (diag.isFirebaseMode) {
  console.log("✓ Real-time sync enabled");
} else {
  console.log("✗ Offline mode (localStorage only)");
}
```

If Firebase fails to initialize, the adapter falls back to localStorage mode automatically.
