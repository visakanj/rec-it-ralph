# TECHNICAL PLAN: React + Tailwind Migration for v2

**Repository**: https://github.com/visakanj/movie-night-recs-app
**Created**: 2025-12-30
**Goal**: Migrate v2 from vanilla JS to React + Tailwind while preserving v1 and maintaining full Firebase interoperability

---

## A) CURRENT STATE (AS-IS)

### v1 Architecture (Root `/`)

**Entry Point**: `/index.html` → `/app.js` (2,464 lines)

**Core Classes**:
- `AppState` (app.js:101-718): Domain model and Firebase RTDB interface
  - Manages: `data.theme`, `data.contributors[]`, `data.moviePool[]`, `data.watchedMovies[]`, `data.tonightPick`
  - Firebase initialization at app.js:719 (guarded by `!window.RECITRALPH_V2_MODE`)
  - Methods: `createRoomAtomic()`, `joinRoom()`, `addContributor()`, `addMovieToPool()`, `pickAndSetTonightMovie()`, `movePoolToWatched()`, `undoWatched()`, `mergeWithDefaults()`
  - Firebase listener: Direct RTDB `.on('value')` attached to `this.firebaseRef` (app.js:785)

- `TMDBService` (app.js:34-100): Movie metadata fetching
  - Methods: `searchMovie()`, `getWatchProviders()`
  - 1-hour cache via `Map()`

- `UIController` (app.js:1273-2429): v1 UI orchestration
  - **SKIPPED in v2 mode** (guard at app.js:2435: `if (window.RECITRALPH_V2_MODE) return;`)
  - Manages modals, theme banners, contributor cards, movie grid

**Firebase Initialization**: Inline `<script>` in `/index.html:75-90`
- Config: `rec-it-ralph-f086b` project
- Creates `window.firebase` and `window.database`

**Storage**:
- Firebase: `rooms/{roomCode}/{theme, contributors, moviePool, watchedMovies, tonightPick}`
- localStorage: `rec-it-ralph-state` (v1 local fallback)

**Deployment**: Netlify static site, `_redirects:5` → `/* /index.html 200`

---

### v2 Current Architecture (`/v2/`)

**Entry Point**: `/v2/index.html`

**Initialization Flow**:
1. v2/index.html:45 sets `window.RECITRALPH_V2_MODE = true` **before** loading app.js
2. v2/index.html:54-80 loads Firebase SDK 9.17.1 (compat) and initializes inline
3. v2/index.html:99 loads `/app.js` (v1 core) → **UIController skipped** due to mode flag
4. v2/index.html:116 loads DataAdapter → creates own AppState instance
5. v2/index.html:117-120 loads screen classes (RoomsScreen, PoolScreen, TonightScreen, WatchedScreen)
6. v2/index.html:121 loads app-shell.js → tab routing

**DataAdapter** (`v2/data-adapter.js:1-668`):
- **Purpose**: Clean API wrapper around v1 AppState for v2 screens
- **Initialization** (data-adapter.js:23-73):
  - Waits for DOM ready
  - Creates new `AppState()` instance (data-adapter.js:50)
  - Creates `TMDBService()` instance (data-adapter.js:54)
  - **Critical cleanup**: Detaches any v1 Firebase listeners from previous navigation (data-adapter.js:59, `_cleanupV1Listeners()`)
  - Exposes `window.appState`, `window.tmdbService`, `window.v2Adapter`

- **Firebase Listener Management** (event-driven, NOT polling):
  - `subscribeRoom(roomCode, callback)` (data-adapter.js:207-243): Fans out to multiple callbacks via `_roomCallbacks` Map
  - `_setupFirebaseListener(roomCode)` (data-adapter.js:249-296): Attaches RTDB `.on('value')` to `database.ref(rooms/${roomCode})`
  - Single active listener stored in `_activeListener = {roomCode, ref, handler}`
  - Merges raw Firebase data with defaults via `AppState.mergeWithDefaults()` (data-adapter.js:268)
  - Cleanup via unsubscribe function (data-adapter.js:227-242)

- **Room Management API**:
  - `createRoom(theme)` → `Promise<roomCode>` (data-adapter.js:107-160)
  - `joinRoom(roomCode)` → `Promise<boolean>` (data-adapter.js:167-189)
  - `subscribeRoom(roomCode, callback)` → `unsubscribe()` (data-adapter.js:207)
  - `getRoomCode()`, `getRoomData()`, `getTheme()` (data-adapter.js:319-337)

- **Contributor API**: `addContributor()`, `getContributors()`, `removeContributor()` (data-adapter.js:348-369)

- **Movie API**:
  - `addMovie(contributorId, title)` → `Promise<movie>` (data-adapter.js:381-405) - calls `AppState.addMovieToPool()`
  - `getMoviePool()`, `removeMovie()`, `pickRandomMovie()` (data-adapter.js:411-432)
  - `pickTonightMovie()` → `movie` (data-adapter.js:456-465) - wraps `AppState.pickAndSetTonightMovie()`
  - `getTonightPick()`, `clearTonightPick()` (data-adapter.js:471-481)
  - `markWatched(movie)`, `getWatchedMovies()`, `undoWatched()` (data-adapter.js:439-492)

- **V2 Room History** (namespaced localStorage: `recitralph:v2:rooms`):
  - `getRoomHistory()` → `[{roomCode, theme, lastVisited, createdAt}]` (max 20) (data-adapter.js:526-538)
  - `clearRoomHistory()` (data-adapter.js:578)

- **Diagnostics**: `getDiagnostics()` (data-adapter.js:611-632) - includes listener verification

**AppShell** (`v2/app-shell.js:1-102`):
- Tab navigation: `navigateTo(tab)` (app-shell.js:51-86)
- Screen lifecycle: `render()` → `bind(container, adapter, shell)` → `cleanup()` (app-shell.js:78-83)
- **Guard against redundant renders** (app-shell.js:54-56): Prevents tab flicker
- Updates room code badge in top bar (app-shell.js:88-94)

**Screens** (vanilla JS, template string rendering):
1. **RoomsScreen** (v2/screens/rooms.js): Room list, Create/Join modals
   - Displays room history with last visited time
   - Create modal with theme input
   - Join modal with room code input

2. **PoolScreen** (v2/screens/pool.js:1-800+): Contributors + Movie grid
   - Horizontal contributor avatars (Netflix-style)
   - Add contributor sheet (bottom drawer)
   - Movie grid with TMDB posters
   - Add movie sheet (select contributor, enter title)
   - Uses `subscribeRoom()` for live updates (pool.js:~650)

3. **TonightScreen** (v2/screens/tonight.js:1-400+): Tonight's pick
   - State machine: No room / Empty pool / No pick / Picked movie
   - "Pick tonight's movie" button → calls `adapter.pickTonightMovie()`
   - Displays picked movie with poster, overview, metadata
   - "Mark Watched" / "Pick Another" actions
   - Uses `subscribeRoom()` for live sync

4. **WatchedScreen** (v2/screens/watched.js:1-500+): History with undo
   - List of watched movies with timestamps
   - Undo button (24-hour limit) → calls `adapter.undoWatched()`
   - Shows contributor avatars who suggested each movie

**Routing**: Netlify `_redirects:2` → `/v2/* /v2/index.html 200`

**CSS**: `/v2/app-shell.css` (iOS-style tab bar, safe area insets)

---

### MagicPatterns Prototype Summary

**Status**: **NOT IN REPOSITORY**

The user mentioned files like `App.tsx`, `pages/RoomsScreen.tsx`, but these do not exist in the current repo. The `/src/` directory contains only TypeScript utilities (`src/lib/dom.ts`, `src/types/index.ts`), not React components.

**Assumption for this plan**: We need to **build** a React + Tailwind UI from scratch that replicates the v2 vanilla JS screens.

**Expected UI Patterns** (based on modern React + Tailwind):
- File-based routing (React Router) or single-page routing
- Component hierarchy: `App` → `RoomsScreen`, `PoolScreen`, `TonightScreen`, `WatchedScreen`
- Tailwind utility classes instead of inline `<style>` tags
- Hooks for state (`useState`, `useEffect`, `useContext`)
- DataAdapter access via React Context

---

## B) TARGET STATE (TO-BE)

### Deployment Model

**Decision**: **Embed React at `/v2/` (progressive enhancement)**

**Rationale**:
- Preserves existing `/v2/` route structure (no Netlify redirect changes)
- Allows side-by-side vanilla JS + React during migration
- Can test React screens incrementally without breaking v2 deployment
- Keeps v1 at `/` untouched
- Minimal risk: `/v2/` already exists and is deployed

**Directory Structure**:
```
/v2/
  index.html (v2 React entry point)
  /legacy/ (move current vanilla screens here during migration)
    legacy.html
    app-shell.js
    screens/*.js
  /src/ (React app)
    main.tsx (React entry point)
    App.tsx (router + context providers)
    /screens/
      RoomsScreen.tsx
      PoolScreen.tsx
      TonightScreen.tsx
      WatchedScreen.tsx
    /components/ (shared UI)
      TabBar.tsx
      MovieCard.tsx
      ContributorAvatar.tsx
      Modal.tsx
      BottomSheet.tsx
    /context/
      AdapterContext.tsx (wraps DataAdapter)
    /hooks/
      useRoom.ts (subscribeRoom wrapper)
      useTMDB.ts
    /lib/
      adapter.ts (typed wrapper for data-adapter.js)
  /dist/ (Vite build output, git-ignored)
```

**Build Strategy**: **Vite** (fast, minimal config, TypeScript + Tailwind out-of-box)
- Dev: `npm run dev:v2` → `vite serve v2/`
- Build: `npm run build:v2` → `vite build v2/` → outputs to `/v2/dist/`
- Netlify: `publish = "v2/dist"` (update netlify.toml)

---

### Final Routing & Navigation

**Routes** (React Router v6):
- `/v2/` → `<RoomsScreen />` (default)
- `/v2/pool` → `<PoolScreen />` (requires room joined)
- `/v2/tonight` → `<TonightScreen />` (requires room joined)
- `/v2/watched` → `<WatchedScreen />` (requires room joined)

**Navigation**: Bottom tab bar (iOS-style, same as current v2)
- Tabs: Rooms 🏠 | Pool 🎬 | Tonight 🍿 | Watched ✓
- Active state: Red highlight (`#e50914`)
- Safe area aware (iPhone notch/home indicator)

**Modal Routes** (rendered via `<Modal>` component, not route-based):
- Create Room (triggered from Rooms screen empty state)
- Join Room (triggered from Rooms screen)
- Add Contributor (triggered from Pool screen)
- Add Movie (triggered from Pool screen)

---

### State Management Approach

**Architecture**: **React Context + DataAdapter** (minimal, pragmatic)

**Why NOT Redux/Zustand**:
- DataAdapter already handles state + Firebase sync
- No complex client-side mutations (all writes go through adapter → Firebase)
- Real-time listeners naturally trigger re-renders via `useState` in hooks

**AdapterContext** (`v2/src/context/AdapterContext.tsx`):
```tsx
interface AdapterContextValue {
  adapter: DataAdapter | null;
  isReady: boolean;
}

export const AdapterProvider: FC = ({ children }) => {
  const [adapter, setAdapter] = useState<DataAdapter | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for window.v2Adapter (created by data-adapter.js)
    const checkReady = async () => {
      if (window.v2Adapter) {
        await window.v2Adapter.readyPromise;
        setAdapter(window.v2Adapter);
        setIsReady(true);
      }
    };
    checkReady();
  }, []);

  return <AdapterContext.Provider value={{ adapter, isReady }}>{children}</AdapterContext.Provider>;
};

export const useAdapter = () => useContext(AdapterContext);
```

**useRoom Hook** (wraps `subscribeRoom` with auto-cleanup):
```tsx
export function useRoom(roomCode: string | null) {
  const { adapter } = useAdapter();
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    if (!adapter || !roomCode) return;

    const unsubscribe = adapter.subscribeRoom(roomCode, (data) => {
      setRoomData(data);
    });

    return () => unsubscribe(); // Cleanup on unmount or roomCode change
  }, [adapter, roomCode]);

  return roomData;
}
```

**Data Flow**:
1. User action (click "Add Movie") → Component calls `adapter.addMovie()`
2. Adapter → AppState → Firebase RTDB write
3. Firebase RTDB → `subscribeRoom` listener callback
4. Callback → `setRoomData()` → React re-render

**Cleanup**: React `useEffect` cleanup functions will call adapter unsubscribe functions automatically.

---

## C) MIGRATION STRATEGY (INCREMENTAL, LOW-RISK)

### Phase 0: Setup React Infrastructure (1 PR, ~2 hours)

**Goal**: Get Vite + React + Tailwind building without breaking existing v2

**Changes**:
1. Add to `/package.json`:
   ```json
   "scripts": {
     "dev:v2": "vite serve v2 --port 3001",
     "build:v2": "vite build v2 --outDir dist",
     "preview:v2": "vite preview v2"
   },
   "devDependencies": {
     "vite": "^5.0.0",
     "@vitejs/plugin-react": "^4.2.0",
     "typescript": "^5.3.0",
     "tailwindcss": "^3.4.0",
     "autoprefixer": "^10.4.0",
     "postcss": "^8.4.0"
   },
   "dependencies": {
     "react": "^18.2.0",
     "react-dom": "^18.2.0",
     "react-router-dom": "^6.20.0"
   }
   ```

2. Create `/v2/vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     root: '.',
     publicDir: 'public',
     build: {
       outDir: 'dist',
       emptyOutDir: true
     }
   });
   ```

3. Create `/v2/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["ES2020", "DOM"],
       "module": "ESNext",
       "jsx": "react-jsx",
       "strict": true,
       "moduleResolution": "bundler",
       "esModuleInterop": true,
       "skipLibCheck": true
     },
     "include": ["src"]
   }
   ```

4. Create `/v2/tailwind.config.js`:
   ```js
   export default {
     content: ['./src/**/*.{ts,tsx}'],
     theme: {
       extend: {
         colors: {
           'netflix-red': '#e50914',
           'netflix-black': '#141414'
         }
       }
     }
   };
   ```

5. Create `/v2/src/main.tsx` (minimal):
   ```tsx
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import './index.css';

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <div className="text-white">React + Vite works!</div>
     </React.StrictMode>
   );
   ```

6. Rename current `/v2/index.html` → `/v2/legacy.html`

7. Create new `/v2/index.html` (Vite entry):
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Rec-It-Ralph v2</title>

       <!-- V2 MODE FLAG -->
       <script>window.RECITRALPH_V2_MODE = true;</script>

       <!-- Firebase SDK (same as legacy v2) -->
       <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>
       <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js"></script>
       <script>
         // Initialize Firebase
         const firebaseConfig = { /* same as legacy */ };
         if (typeof firebase !== 'undefined') {
           firebase.initializeApp(firebaseConfig);
           window.database = firebase.database();
         }
       </script>

       <!-- Load v1 core (AppState, TMDBService) -->
       <script src="/app.js"></script>

       <!-- Load DataAdapter (reuse existing) -->
       <script src="/v2/data-adapter.js"></script>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

8. Update `/netlify.toml`:
   ```toml
   [build]
     publish = "."  # Keep root for now (v1 still at /)
     command = "npm run build:v2"

   # Serve React build for /v2/* (will update after Phase 3)
   [[redirects]]
     from = "/v2/*"
     to = "/v2/dist/index.html"
     status = 200
   ```

**Validation**:
- `npm install`
- `npm run dev:v2` → Browser shows "React + Vite works!" at `http://localhost:3001/v2/`
- `/v2/legacy.html` still works (vanilla v2 untouched)
- `/` (v1) still works

**Rollback**: Delete `/v2/src/`, revert `/v2/index.html` → `/v2/legacy.html`, revert netlify.toml

---

### Phase 1: AdapterContext + Routing Shell (1 PR, ~3 hours)

**Goal**: Get React Router + AdapterContext working with a minimal shell

**Changes**:
1. Create `/v2/src/context/AdapterContext.tsx` (see Target State above)

2. Create `/v2/src/App.tsx`:
   ```tsx
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
   import { AdapterProvider } from './context/AdapterContext';
   import { TabBar } from './components/TabBar';
   import { RoomsScreen } from './screens/RoomsScreen';

   export function App() {
     return (
       <AdapterProvider>
         <BrowserRouter basename="/v2">
           <div className="flex flex-col h-screen bg-black text-white">
             <main className="flex-1 overflow-y-auto pb-16">
               <Routes>
                 <Route path="/" element={<RoomsScreen />} />
                 <Route path="/pool" element={<div>Pool (TODO)</div>} />
                 <Route path="/tonight" element={<div>Tonight (TODO)</div>} />
                 <Route path="/watched" element={<div>Watched (TODO)</div>} />
                 <Route path="*" element={<Navigate to="/" replace />} />
               </Routes>
             </main>
             <TabBar />
           </div>
         </BrowserRouter>
       </AdapterProvider>
     );
   }
   ```

3. Create `/v2/src/components/TabBar.tsx`:
   ```tsx
   import { Link, useLocation } from 'react-router-dom';

   const tabs = [
     { path: '/', icon: '🏠', label: 'Rooms' },
     { path: '/pool', icon: '🎬', label: 'Pool' },
     { path: '/tonight', icon: '🍿', label: 'Tonight' },
     { path: '/watched', icon: '✓', label: 'Watched' }
   ];

   export function TabBar() {
     const location = useLocation();

     return (
       <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 safe-area-inset-bottom">
         <div className="flex justify-around">
           {tabs.map(tab => (
             <Link
               key={tab.path}
               to={tab.path}
               className={`flex-1 flex flex-col items-center py-2 ${
                 location.pathname === tab.path ? 'text-netflix-red' : 'text-gray-400'
               }`}
             >
               <span className="text-2xl">{tab.icon}</span>
               <span className="text-xs mt-1">{tab.label}</span>
             </Link>
           ))}
         </div>
       </nav>
     );
   }
   ```

4. Create `/v2/src/screens/RoomsScreen.tsx` (minimal):
   ```tsx
   import { useAdapter } from '../context/AdapterContext';

   export function RoomsScreen() {
     const { adapter, isReady } = useAdapter();

     if (!isReady) return <div className="p-4">Loading...</div>;

     const rooms = adapter!.getRoomHistory();

     return (
       <div className="p-4">
         <h1 className="text-2xl font-bold mb-4">Your Rooms</h1>
         {rooms.length === 0 ? (
           <p className="text-gray-400">No rooms yet</p>
         ) : (
           <div className="space-y-2">
             {rooms.map(r => (
               <div key={r.roomCode} className="p-4 bg-zinc-900 rounded">
                 <div className="font-semibold">{r.theme}</div>
                 <div className="text-sm text-gray-400">{r.roomCode}</div>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   }
   ```

5. Update `/v2/src/main.tsx`:
   ```tsx
   import { App } from './App';
   // ... render <App />
   ```

**Validation**:
- `npm run dev:v2`
- Navigate between tabs → URL changes, active tab highlighted
- Rooms screen shows room history from adapter
- `console.log(window.v2Adapter.getDiagnostics())` → shows ready state

**Rollback**: Revert to Phase 0 (React stub)

---

### Phase 2: Migrate RoomsScreen (1 PR, ~4 hours)

**Goal**: Fully functional RoomsScreen with Create/Join modals

**Implementation**:
1. Create `/v2/src/components/Modal.tsx`:
   - Reusable modal with overlay, backdrop click to close
   - Tailwind: `fixed inset-0 z-50 flex items-center justify-center bg-black/80`

2. Create `/v2/src/screens/RoomsScreen.tsx` (full version):
   - **Empty state**: Icon, title, "Create Room" / "Join Room" buttons
   - **Room list**: Map over `adapter.getRoomHistory()`, display cards with theme, code, last visited
   - **Current room indicator**: Highlight active room (compare `adapter.getRoomCode()`)
   - **Create modal**: Input for theme, "Create" button → `adapter.createRoom(theme)`, navigate to `/pool`
   - **Join modal**: Input for room code, "Join" button → `adapter.joinRoom(code)`, navigate to `/pool`
   - **Error handling**: Display error toast if join fails

**Testing Checklist**:
- [ ] Empty state shows correct CTA buttons
- [ ] Create room → generates code, adds to history, navigates to /pool
- [ ] Join room (valid code) → joins, adds to history, navigates to /pool
- [ ] Join room (invalid code) → shows error
- [ ] Room history persists across page reload
- [ ] Current room highlighted in list
- [ ] Click room card → joins that room, navigates to /pool

**Rollback**: Revert to Phase 1 (minimal RoomsScreen)

---

### Phase 3: Migrate PoolScreen (1 PR, ~6 hours)

**Goal**: Contributors + Movie grid with add flows

**Implementation**:
1. Create `/v2/src/hooks/useRoom.ts` (see Target State above)

2. Create `/v2/src/components/ContributorAvatar.tsx`:
   - Circle with initials, color from `getAvatarColor(name)` (reuse v1 logic)
   - Tailwind: `w-14 h-14 rounded-full flex items-center justify-center`

3. Create `/v2/src/components/MovieCard.tsx`:
   - TMDB poster or placeholder
   - Movie title, contributor avatars
   - Remove button (trash icon)

4. Create `/v2/src/components/BottomSheet.tsx`:
   - Slide-up modal from bottom (iOS-style)
   - Tailwind: `fixed inset-x-0 bottom-0 bg-zinc-900 rounded-t-xl`
   - Backdrop + close on backdrop click

5. Create `/v2/src/screens/PoolScreen.tsx`:
   - **No room state**: "Join a room first" message, link to Rooms
   - **Header**: Theme banner, "Add Contributor" button
   - **Contributors section**: Horizontal scroll of avatars
   - **Movies section**: Grid of MovieCards, "Add Movie" button
   - **Add Contributor sheet**: Input for name, "Add" button → `adapter.addContributor(name)`
   - **Add Movie sheet**:
     - Dropdown to select contributor (if >0 contributors)
     - Input for movie title
     - "Add" button → `adapter.addMovie(contributorId, title)`
     - Show loading spinner during TMDB fetch
   - **useRoom hook**: Subscribe to room data, auto-update on changes

**Data Flow**:
```tsx
const PoolScreen = () => {
  const { adapter } = useAdapter();
  const roomCode = adapter?.getRoomCode();
  const roomData = useRoom(roomCode); // Auto-subscribes + cleanup

  const handleAddMovie = async (contributorId, title) => {
    setLoading(true);
    try {
      await adapter.addMovie(contributorId, title);
      closeSheet();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!roomCode) return <NoRoomState />;
  if (!roomData) return <LoadingState />;

  return (
    <div>
      <ThemeBanner theme={roomData.theme} />
      <Contributors contributors={roomData.contributors} onAdd={() => openAddContributor()} />
      <MovieGrid movies={roomData.moviePool} onRemove={(idx) => adapter.removeMovie(idx)} />
      <AddMovieButton onClick={() => openAddMovie()} />
    </div>
  );
};
```

**Testing Checklist**:
- [ ] No room → shows prompt to join room
- [ ] Room joined → displays theme, contributors, movies
- [ ] Add contributor → appears in list immediately (via live update)
- [ ] Add movie → TMDB fetch works, movie appears in grid
- [ ] Add movie (TMDB fails) → still adds movie with placeholder poster
- [ ] Remove movie → disappears from grid
- [ ] Cross-tab sync: Add movie in v1 → appears in v2 React pool instantly
- [ ] Cross-tab sync: Add movie in v2 React → appears in v1 instantly
- [ ] Cleanup: Navigate away from Pool → `useRoom` unsubscribes (no memory leak)
- [ ] Listener verification: `adapter.getDiagnostics().hasActiveListener === true` while on Pool

**Rollback**: Revert to Phase 2 (Rooms only)

---

### Phase 4: Migrate TonightScreen (1 PR, ~4 hours)

**Goal**: Tonight pick flow with state machine

**Implementation**:
1. Create `/v2/src/screens/TonightScreen.tsx`:
   - **State A** (No room): "Join a room first"
   - **State B** (Empty pool): "Add movies to your pool first"
   - **State C** (No pick): "Pick tonight's movie" button → `adapter.pickTonightMovie()`
   - **State D** (Picked): Large poster, title, overview, metadata, "Mark Watched" / "Pick Another" buttons
   - Use `useRoom()` hook to subscribe to `roomData.tonightPick`

**Testing Checklist**:
- [ ] State A → shows "Join a room" prompt
- [ ] State B → shows "Add movies" prompt, links to Pool
- [ ] State C → "Pick tonight's movie" button works, transitions to State D
- [ ] State D → displays picked movie with poster, overview
- [ ] "Mark Watched" → calls `adapter.markWatched()`, movie disappears from pick
- [ ] "Pick Another" → calls `adapter.clearTonightPick()` then `adapter.pickTonightMovie()`, new movie appears
- [ ] Cross-tab sync: Pick movie in v1 → appears in v2 Tonight instantly
- [ ] Cross-tab sync: Mark watched in v2 → updates v1 instantly

**Rollback**: Revert to Phase 3 (Rooms + Pool only)

---

### Phase 5: Migrate WatchedScreen (1 PR, ~3 hours)

**Goal**: Watched history with undo

**Implementation**:
1. Create `/v2/src/screens/WatchedScreen.tsx`:
   - List of watched movies with timestamps (`new Date(movie.watchedAt).toLocaleDateString()`)
   - Contributor avatars for each movie
   - Undo button (only enabled if < 24 hours) → `adapter.undoWatched(movie)`
   - Empty state: "No watched movies yet"

**Testing Checklist**:
- [ ] Empty state shows correctly
- [ ] Watched movies display with timestamps, avatars
- [ ] Undo (< 24h) → movie returns to pool, disappears from watched
- [ ] Undo (> 24h) → button disabled or shows error
- [ ] Cross-tab sync: Mark watched in v1 → appears in v2 Watched instantly
- [ ] Cross-tab sync: Undo in v2 → disappears from v1 Watched instantly

**Rollback**: Revert to Phase 4 (Rooms + Pool + Tonight only)

---

### Phase 6: Polish & Production (1 PR, ~4 hours)

**Goal**: Ship React v2 to production, deprecate legacy v2

**Changes**:
1. **Loading states**: Add skeleton loaders for all screens (Tailwind `animate-pulse`)
2. **Error boundaries**: Wrap routes in `<ErrorBoundary>` to catch React errors
3. **Accessibility**: Add ARIA labels to buttons, keyboard nav for modals
4. **Mobile polish**: Test on iPhone Safari, ensure safe area insets work
5. **Remove legacy v2**: Delete `/v2/legacy.html`, `/v2/screens/`, `/v2/app-shell.js`, `/v2/app-shell.css`
6. **Update Netlify**:
   ```toml
   [build]
     publish = "v2/dist"  # Now serve React build
     command = "npm run build:v2"

   [[redirects]]
     from = "/v2/*"
     to = "/v2/dist/index.html"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
7. **Update README.md**: Document React architecture, how to run dev server

**Validation**:
- Manual QA on all screens (Rooms, Pool, Tonight, Watched)
- Cross-tab v1↔v2 sync tests (open `/` in one tab, `/v2/` in another, perform actions, verify sync)
- Mobile Safari test (iPhone, iPad)
- `adapter.getDiagnostics()` → verify no listener leaks

**Rollback**: Restore `/v2/legacy.html` redirect in Netlify, redeploy

---

## D) DATA LAYER PLAN

### Required DataAdapter API Additions

**Current adapter is sufficient** for React migration. No breaking changes required.

**Optional enhancements** (can defer to post-migration):

1. **TypeScript typings** (`v2/data-adapter.d.ts`):
   ```ts
   export interface RoomData {
     theme: string;
     contributors: Contributor[];
     moviePool: Movie[];
     watchedMovies: WatchedMovie[];
     tonightPick?: Movie;
   }

   export class DataAdapter {
     readyPromise: Promise<void>;
     subscribeRoom(roomCode: string, callback: (data: RoomData) => void): () => void;
     createRoom(theme: string): Promise<string>;
     // ... all existing methods
   }
   ```

2. **Optimistic updates** (future enhancement):
   - `addMovie()` could return a temp ID immediately, then replace on Firebase confirm
   - Requires more complex adapter state management
   - **Defer to v3** (not needed for initial React migration)

---

### TMDB Enrichment

**Current approach (keep as-is)**:
- `adapter.addMovie(contributorId, title)` → calls `AppState.addMovieToPool()` → internally calls `TMDBService.searchMovie()`
- TMDB enrichment happens **before** Firebase write
- Movie object stored in Firebase includes `tmdbData: { poster_path, overview, vote_average, ... }`

**No changes needed**. React components just consume `movie.tmdbData.poster_path` from room data.

**Error handling**:
- If TMDB fails (network error, quota), `AppState.addMovieToPool()` still succeeds with placeholder poster
- React UI should handle `!movie.tmdbData` gracefully (show "🎬" icon)

---

### "Tonight Pick" Storage

**Current Firebase schema** (already implemented in v1 AppState + v2 adapter):
```
rooms/{roomCode}/
  tonightPick: {
    title: "Inception",
    tmdbData: { ... },
    suggestedBy: ["contributor-id-1"],
    addedAt: 1234567890,
    pickedAt: 1234567891
  }
```

**AppState methods**:
- `pickAndSetTonightMovie()` (app.js:~900): Picks random movie, sets `data.tonightPick`, persists to Firebase
- `clearTonightPick()` (app.js:~950): Sets `data.tonightPick = null`, persists

**DataAdapter wrappers**:
- `adapter.pickTonightMovie()` (data-adapter.js:456)
- `adapter.getTonightPick()` (data-adapter.js:471)
- `adapter.clearTonightPick()` (data-adapter.js:478)

**Migration notes**:
- **Existing rooms**: If `tonightPick` field missing, `AppState.mergeWithDefaults()` returns `tonightPick: null` → React shows "No pick" state
- **No migration needed**: Field is optional, gracefully handled

**UX when absent**:
- TonightScreen State C: "No movie selected, pick one" button

---

### v1/v2 Interoperability

**Current state**: **Fully interoperable** (tested in v2 vanilla JS)

**How it works**:
1. v1 writes to Firebase → v2 `subscribeRoom` listeners fire → React re-renders
2. v2 writes via adapter → AppState writes to Firebase → v1 `AppState.firebaseRef.on('value')` fires → v1 UI updates

**Testing strategy**:
- Open `/` in Tab A, `/v2/` in Tab B
- Join same room in both
- Perform actions in each tab, verify real-time sync:
  - Add contributor in v1 → appears in v2 Pool instantly
  - Add movie in v2 → appears in v1 grid instantly
  - Pick tonight in v1 → appears in v2 Tonight instantly
  - Mark watched in v2 → updates v1 Watched list instantly

**Caveat**: v1 uses `window.ui.tmdbService`, v2 uses `adapter.tmdb`. Both are instances of `TMDBService` with same cache, so TMDB quota is shared.

---

## E) SCREEN-BY-SCREEN IMPLEMENTATION PLAN

### RoomsScreen

**Data Requirements**:
- `adapter.getRoomHistory()` → `[{roomCode, theme, lastVisited}]`
- `adapter.getRoomCode()` → current room (for highlighting)

**Subscriptions**: None (room history is localStorage, read once on render)

**UI Behaviors**:
- Click room card → `adapter.joinRoom(roomCode)` → navigate to `/pool`
- "Create Room" button → open modal
- "Join Room" button → open modal
- Create modal submit → `adapter.createRoom(theme)` → navigate to `/pool`
- Join modal submit → `adapter.joinRoom(code)` → navigate to `/pool` if success, show error if fail

**Edge Cases**:
- Empty history: Show empty state with large CTA buttons
- Join invalid room: Display error toast "Room not found", keep modal open
- Create with empty theme: Disable submit button or show validation error
- Network offline: Join/Create should fail gracefully (Firebase offline queue)

**Loading States**:
- Modal submit → disable button, show spinner while `createRoom()` / `joinRoom()` pending

**Error States**:
- Join failure: Toast notification "Room {code} not found"
- Create failure: Toast "Failed to create room, try again"

**Event Flows**:
```
Create Flow:
1. Click "Create Room" → open modal
2. Type theme → enable submit
3. Click "Create" → setLoading(true), adapter.createRoom(theme)
4. Success → navigate('/pool')
5. Failure → setError(), show toast

Join Flow:
1. Click "Join Room" → open modal
2. Type room code → enable submit
3. Click "Join" → setLoading(true), adapter.joinRoom(code)
4. Success (true) → navigate('/pool')
5. Failure (false) → setError("Room not found"), keep modal open
```

**Testing Checklist**:
- [ ] Empty state renders correctly
- [ ] Room list displays all history items
- [ ] Current room highlighted
- [ ] Click room → joins + navigates
- [ ] Create room → modal opens, submit works, navigates
- [ ] Join room (valid) → works
- [ ] Join room (invalid) → shows error
- [ ] Room history persists after reload
- [ ] Mobile: safe area insets respected

---

### PoolScreen

**Data Requirements**:
- `adapter.getRoomCode()` → current room (null check)
- `useRoom(roomCode)` → `{ theme, contributors, moviePool }` (live subscription)

**Subscriptions**:
- `useRoom(roomCode)` → calls `adapter.subscribeRoom(roomCode, callback)`
- Auto-cleanup via `useEffect` return

**UI Behaviors**:
- **No room**: Show "Join a room first" message, link to Rooms
- **Add contributor**: Open bottom sheet, input name, submit → `adapter.addContributor(name)`, close sheet
- **Add movie**:
  - Open bottom sheet
  - If no contributors: Show "Add a contributor first" message
  - Else: Dropdown to select contributor, input movie title, submit → `adapter.addMovie(contributorId, title)`, close sheet
- **Remove movie**: Click trash icon → confirm dialog → `adapter.removeMovie(movieIndex)`

**Edge Cases**:
- No contributors: "Add Movie" button should prompt to add contributor first
- Empty pool: Show empty state "No movies yet, add some!"
- TMDB fetch slow: Show loading spinner in "Add Movie" sheet, disable submit until complete
- TMDB fetch fails: Still add movie, show placeholder poster
- Duplicate movie: AppState handles deduplication (merges contributors), just adds to existing movie's `suggestedBy`

**Loading States**:
- Add movie sheet: Spinner while `adapter.addMovie()` pending
- Remove movie: Optimistic removal (disappears immediately, undo if Firebase fails)

**Error States**:
- Add movie TMDB fail: Toast "Could not fetch poster, but movie was added"
- Remove movie Firebase fail: Toast "Failed to remove movie", re-add to UI

**Event Flows**:
```
Add Contributor:
1. Click "Add Contributor" → open sheet
2. Type name → enable submit
3. Submit → adapter.addContributor(name)
4. Close sheet
5. Contributor appears in list (via subscribeRoom callback)

Add Movie:
1. Click "Add Movie" → open sheet
2. Select contributor from dropdown
3. Type movie title
4. Submit → setLoading(true), adapter.addMovie(contributorId, title)
5. TMDB fetch happens in adapter
6. Success → close sheet, movie appears in grid (via subscribeRoom callback)
7. TMDB failure → movie still added with placeholder, toast notification

Remove Movie:
1. Click trash icon on MovieCard
2. Confirm dialog "Remove {title}?"
3. Confirm → adapter.removeMovie(movieIndex)
4. Movie disappears from grid (via subscribeRoom callback)
```

**Testing Checklist**:
- [ ] No room → shows prompt
- [ ] Room with no contributors → shows empty state
- [ ] Add contributor → appears in avatar list instantly
- [ ] Add movie (TMDB success) → appears with poster
- [ ] Add movie (TMDB fail) → appears with placeholder
- [ ] Remove movie → disappears
- [ ] Cross-tab: Add movie in v1 → appears in v2 grid
- [ ] Cross-tab: Remove movie in v2 → disappears from v1
- [ ] Mobile: bottom sheet slides up smoothly, backdrop dismisses

---

### TonightScreen

**Data Requirements**:
- `adapter.getRoomCode()` → current room
- `useRoom(roomCode)` → `{ tonightPick, moviePool, contributors }` (live subscription)

**Subscriptions**:
- `useRoom(roomCode)` → auto-subscribes

**UI Behaviors**:
- **State A** (No room): "Join a room first" message, link to Rooms
- **State B** (Room, empty pool): "Add movies to your pool first" message, link to Pool
- **State C** (Room, pool not empty, no pick): "Pick tonight's movie" button → `adapter.pickTonightMovie()`, transition to State D
- **State D** (Picked movie):
  - Display poster, title, overview, metadata
  - "Mark Watched" button → confirm dialog → `adapter.markWatched(tonightPick)`, clear pick
  - "Pick Another" button → `adapter.clearTonightPick()` then `adapter.pickTonightMovie()`

**Edge Cases**:
- Pool has 1 movie: "Pick Another" re-picks the same movie (warn user?)
- Tonight pick movie deleted from pool (edge case): State D still shows it (okay, it's a pick)
- Mark watched → pick cleared, Tonight shows State C again

**Loading States**:
- "Pick tonight's movie" button: Show spinner while `pickTonightMovie()` pending (TMDB enrichment may take time)

**Error States**:
- Pick movie fails: Toast "Failed to pick movie", stay in State C
- Mark watched fails: Toast "Failed to mark watched", stay in State D

**Event Flows**:
```
Pick Movie:
1. Click "Pick tonight's movie" (State C)
2. setLoading(true), adapter.pickTonightMovie()
3. Success → tonightPick set in Firebase → subscribeRoom callback → State D
4. Failure → toast error, stay in State C

Mark Watched:
1. Click "Mark Watched" (State D)
2. Confirm dialog "Mark {title} as watched?"
3. Confirm → adapter.markWatched(tonightPick)
4. tonightPick cleared, movie moved to watchedMovies → State C (or State B if pool now empty)

Pick Another:
1. Click "Pick Another" (State D)
2. adapter.clearTonightPick() → State C
3. Immediately adapter.pickTonightMovie() → State D with new movie
```

**Testing Checklist**:
- [ ] State A → shows join room prompt
- [ ] State B → shows add movies prompt
- [ ] State C → "Pick tonight's movie" button works
- [ ] State D → displays movie correctly
- [ ] "Mark Watched" → movie moves to Watched, pick cleared
- [ ] "Pick Another" → new movie picked
- [ ] Cross-tab: Pick movie in v1 → appears in v2 Tonight
- [ ] Cross-tab: Mark watched in v2 → updates v1 Tonight

---

### WatchedScreen

**Data Requirements**:
- `adapter.getRoomCode()` → current room
- `useRoom(roomCode)` → `{ watchedMovies, contributors }` (live subscription)

**Subscriptions**:
- `useRoom(roomCode)` → auto-subscribes

**UI Behaviors**:
- **No room**: "Join a room first" message
- **Empty watched list**: "No watched movies yet" empty state
- **Watched list**: Display movies with:
  - Title, poster (if available)
  - Watched timestamp (`new Date(movie.watchedAt).toLocaleDateString()`)
  - Contributor avatars who suggested it
  - Undo button (enabled if < 24 hours)
- **Undo button**: Click → confirm → `adapter.undoWatched(movie)`, movie returns to pool

**Edge Cases**:
- Undo > 24 hours: Button disabled or shows tooltip "Can only undo within 24 hours"
- Undo last movie: Watched list becomes empty (show empty state)

**Loading States**:
- Undo button: Show spinner while `undoWatched()` pending

**Error States**:
- Undo fails (>24h): Toast "Cannot undo, more than 24 hours have passed"
- Undo fails (other): Toast "Failed to undo"

**Event Flows**:
```
Undo Watched:
1. Click "Undo" button on watched movie
2. Confirm dialog "Move {title} back to pool?"
3. Confirm → success = adapter.undoWatched(movie)
4. If success (true) → movie disappears from watched, appears in pool (via subscribeRoom)
5. If failure (false) → toast "Cannot undo (24-hour limit exceeded)"
```

**Testing Checklist**:
- [ ] No room → shows prompt
- [ ] Empty watched → shows empty state
- [ ] Watched movies display correctly
- [ ] Undo (< 24h) → works, movie returns to pool
- [ ] Undo (> 24h) → button disabled or fails with error
- [ ] Cross-tab: Mark watched in v1 → appears in v2 Watched
- [ ] Cross-tab: Undo in v2 → disappears from v1 Watched, reappears in v1 pool

---

## F) TESTING & QA

### Dev Test Plan

**Local Testing** (before each PR):
1. **Single tab v2 smoke test**:
   - Start fresh (clear localStorage, clear Firebase test room)
   - `/v2/` → Create room → Add contributor → Add movie → Pick tonight → Mark watched → Verify in Watched
   - `/v2/` → Join existing room → Add movie → Verify pool updates

2. **Cross-tab v1↔v2 sync test**:
   - Open `/` in Tab A (v1)
   - Open `/v2/` in Tab B (React)
   - Create room in Tab B → Join same room in Tab A
   - Add contributor in Tab A → verify appears in Tab B instantly
   - Add movie in Tab B → verify appears in Tab A instantly
   - Pick tonight in Tab A → verify appears in Tab B Tonight screen
   - Mark watched in Tab B → verify updates Tab A watched list
   - Close Tab B → verify Tab A still works (no listener leaks)

3. **Listener duplication check**:
   - Open `/v2/` → join room → `console.log(adapter.getDiagnostics())`
   - Verify: `hasActiveListener: true`, `subscriberCount: 1` (or appropriate count based on active screens)
   - Navigate between tabs (Rooms → Pool → Tonight → Watched)
   - After each navigation, check diagnostics → old screen should unsubscribe, new screen subscribes
   - Final check: Only current screen should have active listener

4. **Persistence check**:
   - Create room, add data
   - Reload page → verify room history persists
   - Join room → verify data loads correctly
   - Close browser, reopen → verify room history still there

5. **Mobile Safari test** (iPhone, iPad):
   - Test all screens on real device or simulator
   - Verify safe area insets (no content behind notch/home indicator)
   - Verify bottom sheets slide smoothly
   - Verify tab bar is accessible

---

### Automated Test Strategy

**Current state**: No automated tests in repo

**Recommendation**: **Minimal testing** (pragmatic, not over-engineered)

**Phase 1** (MVP, can ship without this):
- None (manual QA sufficient for initial launch)

**Phase 2** (post-migration, optional):
1. **Unit tests** (Vitest):
   - `useRoom` hook: Mock adapter, verify subscribe/unsubscribe lifecycle
   - `AdapterContext`: Verify ready state management

2. **Smoke tests** (Playwright or Cypress):
   - Visit `/v2/` → verify "Create Room" button exists
   - Create room → verify redirects to `/pool`
   - Add movie → verify appears in grid

**Why minimal**:
- Firebase integration is hard to mock (prefer manual cross-tab tests)
- UI is simple (no complex state machines beyond Tonight screen)
- DataAdapter already has implicit tests via v2 vanilla JS (working in production)

---

### Logging & Diagnostics Strategy

**What to keep**:
- DataAdapter initialization logs (data-adapter.js:42-66) → **Keep** (helps debug Firebase issues)
- Listener attach/detach logs (data-adapter.js:295, 311) → **Keep** (helps debug listener leaks)
- Room create/join logs (data-adapter.js:153, 178) → **Keep**

**What to remove** (post-migration):
- v2 checkpoint logs (v2/index.html:46, 84, 94, etc.) → **Remove** (were for initial v2 debugging)
- "BEFORE/AFTER addMovieToPool" debug logs (data-adapter.js:385-398) → **Remove** (fixed bug, no longer needed)

**Add for React**:
- React ErrorBoundary with Sentry integration (optional, post-launch)
- `console.warn` for undo >24h failures (user-facing errors)

**Dev mode diagnostics**:
- Expose `window.__ADAPTER_DIAGNOSTICS = () => adapter.getDiagnostics()` in dev builds
- Add to Vite config: `define: { __DEV__: JSON.stringify(process.env.NODE_ENV === 'development') }`

---

## G) OPEN QUESTIONS / RISKS

### Top Risks

1. **Risk: MagicPatterns prototype expectations mismatch**
   - **Issue**: User mentioned "App.tsx, pages/RoomsScreen.tsx" but these don't exist in repo
   - **Question**: Is there a separate MagicPatterns prototype in a different repo/branch that I should reference? Or should I design the React UI from scratch based on v2 vanilla JS?
   - **Mitigation**: This plan assumes **building from scratch** based on existing v2 vanilla JS. If a prototype exists, please share it for review.
   - **Experiment**: User to confirm prototype location or approve building from current v2 design

2. **Risk: React bundling breaks DataAdapter**
   - **Issue**: DataAdapter is global (`window.v2Adapter`), loaded via `<script>` tag. Vite may bundle differently.
   - **Question**: Should we keep DataAdapter as plain JS `<script>` (current plan), or refactor to ES module imported by React?
   - **Mitigation**: Current plan keeps it as `<script>` (minimal risk, proven to work)
   - **Experiment**: Phase 0 will test this immediately (Vite + global adapter)

3. **Risk: Tailwind CSS specificity conflicts with v1 styles**
   - **Issue**: `/styles.css` (v1) is global, Tailwind may conflict
   - **Question**: Should React v2 be fully isolated (separate CSS), or can we share base styles?
   - **Mitigation**: React v2 loads only Tailwind, no `/styles.css` imported (full isolation)
   - **Experiment**: Phase 1 will test CSS isolation

4. **Risk: Firebase quota limits during dev/QA**
   - **Issue**: TMDB API has quota (probably generous), but excessive testing may hit limits
   - **Question**: Do we have TMDB API rate limits to worry about?
   - **Mitigation**: TMDBService already has 1-hour cache, should be fine
   - **Experiment**: Monitor TMDB console during Phase 3 (Pool screen testing)

5. **Risk: Cross-tab listener leaks**
   - **Issue**: If React components don't clean up `subscribeRoom()` properly, duplicate listeners accumulate
   - **Question**: None, just a testing focus area
   - **Mitigation**: `useEffect` cleanup + manual diagnostics checks each phase
   - **Experiment**: Phase 3 (Pool migration) must include listener leak test

6. **Risk: Mobile Safari issues (iOS safe area, viewport)**
   - **Issue**: iOS has notch, home indicator, bounce scrolling quirks
   - **Question**: None, standard issue for mobile web
   - **Mitigation**: Tailwind `safe-area-inset-*` utilities + testing on real device
   - **Experiment**: Phase 6 includes mandatory iPhone Safari test

7. **Risk: Netlify build/deploy changes break v1**
   - **Issue**: Changing `netlify.toml` to build React could break v1 deployment
   - **Question**: None, will test carefully
   - **Mitigation**: Phase 0-5 keep `publish = "."` (root), only Phase 6 changes to `publish = "v2/dist"` after full testing
   - **Experiment**: Each phase deploys to Netlify preview before merging

---

### Explicit Questions Needing Answers

1. **MagicPatterns Prototype**: Where is it? Should I reference it or build from scratch?
   - **Answer needed from**: User
   - **Impact if unknown**: Low (plan assumes building from scratch, which works)

2. **React Router vs other routing**: Should I use React Router v6, or prefer a different solution (TanStack Router, Wouter)?
   - **Answer needed from**: User preference
   - **Default assumption**: React Router v6 (industry standard, most docs)

3. **TypeScript strict mode**: Should React code use `strict: true` or be more lenient?
   - **Answer needed from**: User preference
   - **Default assumption**: `strict: true` (better long-term)

4. **Bundle analyzer**: Should we monitor bundle size from the start?
   - **Answer needed from**: User preference
   - **Default assumption**: No (defer to post-launch optimization)

5. **Analytics/monitoring**: Should React v2 include analytics (Plausible, Google Analytics) or error tracking (Sentry)?
   - **Answer needed from**: User preference
   - **Default assumption**: No (defer to post-launch)

6. **Design system**: Should we use a component library (Radix, Headless UI) or build from scratch?
   - **Answer needed from**: User preference
   - **Default assumption**: Build from scratch (screens are simple, less dependencies)

7. **Tonight pick UX**: If pool has 1 movie, should "Pick Another" warn user or just re-pick the same movie?
   - **Answer needed from**: Product decision
   - **Default assumption**: Re-pick same movie (simpler, v1 behavior)

---

### De-Risking Experiments

**Experiment 1: Vite + Global DataAdapter** (Phase 0)
- **Hypothesis**: Vite can bundle React while keeping `window.v2Adapter` global via `<script>`
- **Test**: Load v2/index.html with React entry point, verify `useAdapter()` sees global adapter
- **Success criteria**: `console.log(window.v2Adapter)` in React component logs adapter instance
- **Fallback**: Refactor DataAdapter to ES module, import in React

**Experiment 2: Cross-tab v1↔v2 Sync** (Phase 3)
- **Hypothesis**: React `useRoom` hook will receive Firebase updates from v1 in real-time
- **Test**: Open `/` and `/v2/pool` in separate tabs, add movie in v1, verify appears in v2 grid within 1 second
- **Success criteria**: < 1s latency for cross-tab updates
- **Fallback**: Debug Firebase listener setup, verify `subscribeRoom` is attached correctly

**Experiment 3: Mobile Safari Safe Area** (Phase 6)
- **Hypothesis**: Tailwind `pb-safe` will prevent tab bar from being obscured by iPhone home indicator
- **Test**: Open `/v2/` on iPhone 14 Pro, verify bottom tab bar is fully visible
- **Success criteria**: No content hidden behind home indicator
- **Fallback**: Use `env(safe-area-inset-bottom)` CSS custom property directly

---

## PROPOSED PHASED DELIVERY TABLE

| Phase | Deliverable | Acceptance Criteria | Est. Effort | PR Count |
|-------|-------------|---------------------|-------------|----------|
| **Phase 0** | React + Vite + Tailwind setup | - `npm run dev:v2` works<br>- React renders "Hello World"<br>- `/v2/legacy.html` still works<br>- v1 (`/`) unchanged | ~2 hours | 1 PR |
| **Phase 1** | AdapterContext + Routing shell | - React Router working<br>- Tab navigation functional<br>- Minimal RoomsScreen shows room history<br>- `useAdapter()` hook accesses global adapter | ~3 hours | 1 PR |
| **Phase 2** | Full RoomsScreen | - Create room works<br>- Join room works<br>- Room history displays<br>- Modals functional<br>- Error handling (invalid room code) | ~4 hours | 1 PR |
| **Phase 3** | PoolScreen | - Theme banner displays<br>- Contributors list works<br>- Add contributor functional<br>- Movie grid displays with posters<br>- Add movie with TMDB fetch works<br>- Remove movie works<br>- **Cross-tab v1↔v2 sync verified**<br>- **Listener leak test passed** | ~6 hours | 1 PR |
| **Phase 4** | TonightScreen | - State machine works (A/B/C/D)<br>- Pick tonight movie functional<br>- Mark watched works<br>- Pick another works<br>- **Cross-tab sync verified** | ~4 hours | 1 PR |
| **Phase 5** | WatchedScreen | - Watched list displays<br>- Undo works (< 24h)<br>- Undo disabled (> 24h)<br>- **Cross-tab sync verified** | ~3 hours | 1 PR |
| **Phase 6** | Production polish + legacy cleanup | - Loading states added<br>- Error boundaries added<br>- Mobile Safari tested<br>- Legacy v2 removed<br>- Netlify deploy updated<br>- README updated<br>- **Full manual QA passed** | ~4 hours | 1 PR |
| **TOTAL** | Fully migrated React v2 | - All v2 features migrated<br>- v1 untouched<br>- Cross-tab sync working<br>- Deployed to production | **~26 hours** | **7 PRs** |

---

### Rollback Strategy Per Phase

- **Phase 0**: Delete `/v2/src/`, restore `/v2/index.html` → `/v2/legacy.html`, revert package.json
- **Phase 1-5**: Revert PR, redeploy previous version (legacy v2 still works)
- **Phase 6**: Restore `/v2/legacy.html`, update Netlify redirect, redeploy (1-hour rollback)

---

### Success Metrics

1. **Feature parity**: All v2 vanilla JS features work in React
2. **Performance**: < 1s Firebase update latency for cross-tab sync
3. **No regressions**: v1 still works, no listener leaks
4. **Mobile UX**: Passes iPhone Safari manual test
5. **Developer experience**: `npm run dev:v2` → hot reload works, Tailwind autocomplete works

---

**END OF TECHNICAL PLAN**
