# TECHNICAL PLAN (REVISED): MagicPatterns React UI + v1 Firebase Backend

**Current State v1**: https://github.com/visakanj/rec-it-ralph (functional, Firebase RTDB)
**MagicPatterns Prototype**: https://github.com/visakanj/movie-night-recs-app (React UI design)
**Goal**: Implement MagicPatterns UI/UX on top of v1's DataAdapter + Firebase backend

**Created**: 2025-12-30 (Revised after discovering MagicPatterns repo)

---

## A) CURRENT STATE (AS-IS)

### v1 Backend (rec-it-ralph)

**Location**: `/Users/visakanjayakumar/Desktop/projects/rec-it-ralph`

**Core Architecture**:
- `app.js` (2,464 lines): AppState, TMDBService, UIController
- Firebase RTDB schema: `rooms/{roomCode}/{theme, contributors, moviePool, watchedMovies, tonightPick}`
- DataAdapter (`v2/data-adapter.js`): Clean API wrapper with event-driven Firebase listeners
- Vanilla JS v2 screens: Rooms, Pool, Tonight, Watched

**Existing Features**:
- ✅ Room create/join with 6-char codes
- ✅ Contributor management (add/remove with color avatars)
- ✅ Movie pool with TMDB enrichment (posters, metadata)
- ✅ Tonight pick (single movie selection)
- ✅ Watched history with 24-hour undo
- ✅ Cross-tab v1↔v2 sync via Firebase listeners
- ✅ localStorage room history (namespaced: `recitralph:v2:rooms`)

**NOT in v1**:
- ❌ Invite codes/links
- ❌ Pending invites tracking
- ❌ Member management (only contributors)
- ❌ Streaming service filters
- ❌ Interactive "spin to pick" animation

---

### MagicPatterns Prototype (movie-night-recs-app)

**Tech Stack**:
- React 18.3.1 + TypeScript 5.5.4
- React Router 6.26.2
- Tailwind CSS 3.4.17 (custom dark theme)
- Framer Motion 11.5.4 (animations)
- Lucide React (icons)
- Vite 5.2.0

**Custom Design System** (tailwind.config.js):
```js
colors: {
  background: { DEFAULT: '#0A0A0B', elevated: '#121214' },
  surface: { DEFAULT: '#1A1A1D', elevated: '#1F1F23' },
  accent: { DEFAULT: '#3B82F6', hover: '#2563EB' },
  text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A' },
  border: { DEFAULT: 'rgba(255,255,255,0.08)', highlight: 'rgba(255,255,255,0.12)' }
}
```

**Components**:
1. **AppBar** - Fixed header with back button, title, optional action
2. **BottomNav** - 4-tab navigation (Rooms/Pool/Tonight/Watched) with active state
3. **ActionSheet** - Bottom drawer modal for actions
4. **RoomCard** - Room list item with status indicator, member count
5. **MoviePosterTile** - 2:3 aspect ratio poster with title, year, rating, selection state
6. **ContributorChip** - Contributor filter chips (horizontal scroll)
7. **InviteCodeCard** - Share room code card
8. **InviteLinkCard** - Share link card
9. **MembersList** - Current members display
10. **PendingInvitesList** - Pending invites with resend/cancel

**Pages/Screens**:
1. **RoomsScreen** (`/`) - Room list + ActionSheet for create/join
2. **CreateRoomScreen** (`/create-room`) - Form with room name + streaming services checkboxes
3. **JoinRoomScreen** (`/join-room`) - Form with room code input
4. **PoolScreen** (`/pool`) - Contributors filter chips + movie grid
5. **PickScreen** (route unknown) - Interactive "hold to spin" picker with confetti
6. **TonightScreen** (`/tonight`) - Displays tonight's pick with details, streaming info
7. **WatchedScreen** (`/watched`) - 3-column grid of watched movies
8. **InviteScreen** (`/room/:id/invite`) - Invite management (code, link, members, pending)

**Mock Data Patterns**:
```typescript
// Room
{ id, name, memberCount, active: boolean, lastActive: timestamp }

// Movie
{ id, title, year, imageUrl, rating }

// Member
{ id, name, role: 'host' | 'member' }

// Pending Invite
{ id, email, sentAt: timestamp }
```

**Key UI/UX Patterns**:
- Dark theme (#0A0A0B background)
- Glass panel effects (`.glass-panel` class)
- Fade-in animations on page load
- Horizontal scrolling contributor chips
- 2-column movie grid (PoolScreen), 3-column (WatchedScreen)
- Confetti particle effects on pick selection
- Hold-to-spin interaction (3-second progress ring)
- Safe area insets for mobile (pb-safe)

---

## B) TARGET STATE (TO-BE)

### Architecture Decision

**Strategy**: **Progressive Enhancement - Keep MagicPatterns UI, Wire to v1 DataAdapter**

**Location**: `/v2/` (embed React at existing v2 path)

**What We Keep from MagicPatterns**:
- ✅ All React components (AppBar, BottomNav, MoviePosterTile, etc.)
- ✅ Tailwind theme + design system
- ✅ Page layouts and navigation structure
- ✅ Framer Motion animations
- ✅ PickScreen interactive "hold to spin" flow

**What We Adapt**:
- 🔄 Replace mock data with `adapter.getRoomData()`, `useRoom()` hook
- 🔄 Replace localStorage with Firebase RTDB via DataAdapter
- 🔄 Map MagicPatterns routes to v1 data model
- 🔄 Add missing backend features (streaming services, invites - see Phase Plan)

**What We Add to v1 Backend** (NEW features):
- 🆕 Streaming services field in room schema (optional, for filtering)
- 🆕 Invite system (room codes already exist, just expose better + add link generation)
- 🆕 Member roles (host vs member) - extend contributors schema
- 🆕 Pending invites tracking (optional - can defer to post-MVP)

---

### Final Directory Structure

```
/v2/
  index.html (React entry point)
  vite.config.ts
  tsconfig.json
  tailwind.config.js (copy from MagicPatterns)
  postcss.config.js

  /src/
    main.tsx
    App.tsx (React Router setup)
    index.css (Tailwind + custom animations from MagicPatterns)

    /components/ (from MagicPatterns)
      AppBar.tsx
      BottomNav.tsx
      ActionSheet.tsx
      RoomCard.tsx
      MoviePosterTile.tsx
      ContributorChip.tsx
      InviteCodeCard.tsx
      InviteLinkCard.tsx
      MembersList.tsx
      PendingInvitesList.tsx

    /pages/ (from MagicPatterns, adapted to DataAdapter)
      RoomsScreen.tsx
      CreateRoomScreen.tsx
      JoinRoomScreen.tsx
      PoolScreen.tsx
      PickScreen.tsx
      TonightScreen.tsx
      WatchedScreen.tsx
      InviteScreen.tsx

    /context/
      AdapterContext.tsx (provides window.v2Adapter to React)

    /hooks/
      useRoom.ts (wraps adapter.subscribeRoom)
      useAdapter.ts (access adapter from context)

    /lib/
      utils.ts (helper functions)
      confetti.ts (confetti particle logic from PickScreen)

  /legacy/ (move current vanilla v2 here during migration)
    legacy.html
    app-shell.js
    screens/*.js

  /dist/ (Vite build output, git-ignored)
```

---

### Routing & Navigation

**Routes** (React Router v6):
```tsx
<Routes>
  <Route path="/" element={<RoomsScreen />} />
  <Route path="/create-room" element={<CreateRoomScreen />} />
  <Route path="/join-room" element={<JoinRoomScreen />} />
  <Route path="/pool" element={<PoolScreen />} />
  <Route path="/pick" element={<PickScreen />} />
  <Route path="/tonight" element={<TonightScreen />} />
  <Route path="/watched" element={<WatchedScreen />} />
  <Route path="/room/:id/invite" element={<InviteScreen />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

**Bottom Navigation** (matches MagicPatterns BottomNav):
- Rooms 🏠 → `/`
- Pool 🎬 → `/pool`
- Tonight 🍿 → `/tonight`
- Watched 🕒 → `/watched`

---

### State Management

**Same as original plan**: React Context + DataAdapter (no Redux/Zustand)

**AdapterContext** provides `window.v2Adapter` to all components:
```tsx
const { adapter, isReady } = useAdapter();
```

**useRoom Hook** for real-time Firebase sync:
```tsx
const roomData = useRoom(roomCode); // Auto-subscribes + cleanup
// roomData: { theme, contributors, moviePool, watchedMovies, tonightPick }
```

---

## C) MIGRATION STRATEGY (INCREMENTAL, LOW-RISK)

### Phase 0: Setup MagicPatterns Codebase (1 PR, ~2 hours)

**Goal**: Copy MagicPatterns code into `/v2/src/`, get Vite building

**Changes**:
1. Copy from `movie-night-recs-app` to `rec-it-ralph/v2/`:
   - All `/src/` files (components, pages, App.tsx, main.tsx, index.css)
   - Config files (vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js)

2. Update `/v2/package.json` (add MagicPatterns dependencies):
   ```json
   "dependencies": {
     "react": "^18.3.1",
     "react-dom": "^18.3.1",
     "react-router-dom": "^6.26.2",
     "framer-motion": "^11.5.4",
     "lucide-react": "latest"
   },
   "devDependencies": {
     "vite": "^5.2.0",
     "@vitejs/plugin-react": "^4.2.0",
     "typescript": "^5.5.4",
     "tailwindcss": "^3.4.17",
     "autoprefixer": "^10.4.0",
     "postcss": "^8.4.0"
   },
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

3. Rename current `/v2/index.html` → `/v2/legacy.html`

4. Create new `/v2/index.html` (Vite entry with Firebase + DataAdapter):
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
       <title>Rec-It-Ralph</title>

       <!-- V2 MODE FLAG -->
       <script>window.RECITRALPH_V2_MODE = true;</script>

       <!-- Firebase SDK 9.17.1 (same as v1) -->
       <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>
       <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js"></script>
       <script>
         const firebaseConfig = {
           apiKey: "AIzaSyATWPODhqbeIpGrpbwYeTJG-m2LFAD0yEY",
           authDomain: "rec-it-ralph-f086b.firebaseapp.com",
           databaseURL: "https://rec-it-ralph-f086b-default-rtdb.firebaseio.com",
           projectId: "rec-it-ralph-f086b",
           storageBucket: "rec-it-ralph-f086b.firebasestorage.app",
           messagingSenderId: "59142094523",
           appId: "1:59142094523:web:fd8d6c899125f62b23739e",
           measurementId: "G-F8VYDHN758"
         };
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

5. Update `/v2/src/main.tsx` to use React 18 root API (might already be correct)

**Validation**:
- `cd /v2 && npm install`
- `npm run dev` → Browser shows MagicPatterns UI at `http://localhost:5173`
- Navigation between screens works (mock data still showing)
- `/v2/legacy.html` still works (vanilla v2 untouched)
- v1 (`/`) still works

**Rollback**: Delete `/v2/src/`, restore `/v2/index.html`, revert package.json

---

### Phase 1: AdapterContext + Wire RoomsScreen (1 PR, ~4 hours)

**Goal**: Connect MagicPatterns RoomsScreen to real Firebase data

**Changes**:

1. Create `/v2/src/context/AdapterContext.tsx`:
   ```tsx
   import { createContext, useContext, useEffect, useState } from 'react';

   interface AdapterContextValue {
     adapter: any; // TODO: Type this properly
     isReady: boolean;
   }

   const AdapterContext = createContext<AdapterContextValue>({ adapter: null, isReady: false });

   export function AdapterProvider({ children }: { children: React.ReactNode }) {
     const [adapter, setAdapter] = useState<any>(null);
     const [isReady, setIsReady] = useState(false);

     useEffect(() => {
       const checkReady = async () => {
         if ((window as any).v2Adapter) {
           await (window as any).v2Adapter.readyPromise;
           setAdapter((window as any).v2Adapter);
           setIsReady(true);
         }
       };
       checkReady();
     }, []);

     return (
       <AdapterContext.Provider value={{ adapter, isReady }}>
         {children}
       </AdapterContext.Provider>
     );
   }

   export const useAdapter = () => useContext(AdapterContext);
   ```

2. Create `/v2/src/hooks/useRoom.ts`:
   ```tsx
   import { useEffect, useState } from 'react';
   import { useAdapter } from '../context/AdapterContext';

   export function useRoom(roomCode: string | null) {
     const { adapter } = useAdapter();
     const [roomData, setRoomData] = useState<any>(null);

     useEffect(() => {
       if (!adapter || !roomCode) return;

       const unsubscribe = adapter.subscribeRoom(roomCode, (data: any) => {
         setRoomData(data);
       });

       return () => unsubscribe();
     }, [adapter, roomCode]);

     return roomData;
   }
   ```

3. Update `/v2/src/App.tsx` to wrap with AdapterProvider:
   ```tsx
   import { BrowserRouter, Routes, Route } from 'react-router-dom';
   import { AdapterProvider } from './context/AdapterContext';
   // ... import all screens

   export default function App() {
     return (
       <AdapterProvider>
         <BrowserRouter basename="/v2">
           <div className="min-h-screen bg-background text-text-primary font-sans">
             <Routes>
               {/* MagicPatterns routes */}
             </Routes>
           </div>
         </BrowserRouter>
       </AdapterProvider>
     );
   }
   ```

4. Update `/v2/src/pages/RoomsScreen.tsx` to use real data:
   ```tsx
   import { useAdapter } from '../context/AdapterContext';
   import { useNavigate } from 'react-router-dom';

   export default function RoomsScreen() {
     const { adapter, isReady } = useAdapter();
     const navigate = useNavigate();
     const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

     if (!isReady) {
       return <div className="p-4 text-center">Loading...</div>;
     }

     // Replace mock data with real room history
     const rooms = adapter.getRoomHistory().map(r => ({
       id: r.roomCode,
       name: r.theme,
       memberCount: 0, // TODO: track this in Firebase
       active: false,
       lastActive: r.lastVisited
     }));

     const handleRoomClick = async (roomCode: string) => {
       await adapter.joinRoom(roomCode);
       navigate('/pool');
     };

     // Keep MagicPatterns UI, wire to adapter
     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar
           title="Rooms"
           action={
             <button onClick={() => setIsActionSheetOpen(true)}>
               <Plus className="w-6 h-6" />
             </button>
           }
         />

         {/* ... rest of MagicPatterns UI */}
         {rooms.map(room => (
           <RoomCard
             key={room.id}
             {...room}
             onClick={() => handleRoomClick(room.id)}
           />
         ))}

         <ActionSheet
           isOpen={isActionSheetOpen}
           onClose={() => setIsActionSheetOpen(false)}
         >
           <button onClick={() => navigate('/create-room')}>Create New Room</button>
           <button onClick={() => navigate('/join-room')}>Join Existing Room</button>
         </ActionSheet>

         <BottomNav />
       </div>
     );
   }
   ```

**Validation**:
- RoomsScreen displays actual room history from `adapter.getRoomHistory()`
- Click room → joins room, navigates to /pool
- ActionSheet opens/closes correctly
- Bottom nav tabs switch between screens (Pool/Tonight/Watched show "TODO" for now)

**Rollback**: Revert to Phase 0 (mock data only)

---

### Phase 2: Wire CreateRoomScreen + JoinRoomScreen (1 PR, ~3 hours)

**Goal**: Implement room create/join flows with real Firebase

**Changes**:

1. Update `/v2/src/pages/CreateRoomScreen.tsx`:
   ```tsx
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAdapter } from '../context/AdapterContext';

   export default function CreateRoomScreen() {
     const { adapter } = useAdapter();
     const navigate = useNavigate();
     const [roomName, setRoomName] = useState('');
     const [streamingServices, setStreamingServices] = useState<string[]>([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');

     const handleCreate = async () => {
       if (!roomName.trim()) {
         setError('Room name is required');
         return;
       }

       setLoading(true);
       try {
         const roomCode = await adapter.createRoom(roomName);

         // TODO: Save streaming services to Firebase (Phase 4)
         // For now, just ignore them

         navigate('/pool');
       } catch (err) {
         setError('Failed to create room');
       } finally {
         setLoading(false);
       }
     };

     // Keep MagicPatterns UI, add state management
     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar showBack title="Create Room" />

         <div className="p-6 max-w-md mx-auto">
           <input
             type="text"
             value={roomName}
             onChange={(e) => setRoomName(e.target.value)}
             placeholder="e.g. Friday Movie Night"
             className="..." // Keep MagicPatterns styling
           />

           {/* Streaming services checkboxes - wire to state */}
           <div className="grid grid-cols-2 gap-3 mt-4">
             {['Netflix', 'HBO Max', 'Disney+', 'Prime', 'Hulu', 'Apple TV+'].map(service => (
               <label key={service}>
                 <input
                   type="checkbox"
                   checked={streamingServices.includes(service)}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setStreamingServices([...streamingServices, service]);
                     } else {
                       setStreamingServices(streamingServices.filter(s => s !== service));
                     }
                   }}
                 />
                 {service}
               </label>
             ))}
           </div>

           {error && <p className="text-red-500 mt-2">{error}</p>}

           <button
             onClick={handleCreate}
             disabled={loading}
             className="..." // Keep MagicPatterns styling
           >
             {loading ? 'Creating...' : 'Create Room'}
           </button>
         </div>
       </div>
     );
   }
   ```

2. Update `/v2/src/pages/JoinRoomScreen.tsx`:
   ```tsx
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAdapter } from '../context/AdapterContext';

   export default function JoinRoomScreen() {
     const { adapter } = useAdapter();
     const navigate = useNavigate();
     const [roomCode, setRoomCode] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');

     const handleJoin = async () => {
       if (!roomCode.trim()) {
         setError('Room code is required');
         return;
       }

       setLoading(true);
       try {
         const success = await adapter.joinRoom(roomCode.toUpperCase());
         if (success) {
           navigate('/pool');
         } else {
           setError('Room not found');
         }
       } catch (err) {
         setError('Failed to join room');
       } finally {
         setLoading(false);
       }
     };

     // Keep MagicPatterns UI, add state management
     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar showBack title="Join Room" />

         <div className="p-6 max-w-md mx-auto">
           <input
             type="text"
             value={roomCode}
             onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
             placeholder="Enter room code (e.g. ABC123)"
             maxLength={6}
             className="..." // Keep MagicPatterns styling
           />

           {error && <p className="text-red-500 mt-2">{error}</p>}

           <button
             onClick={handleJoin}
             disabled={loading}
             className="..." // Keep MagicPatterns styling
           >
             {loading ? 'Joining...' : 'Join Room'}
           </button>
         </div>
       </div>
     );
   }
   ```

**Validation**:
- Create room → generates code, saves to Firebase, navigates to /pool
- Join room (valid code) → joins, navigates to /pool
- Join room (invalid code) → shows error
- Streaming services checkboxes work (stored in local state, not saved to Firebase yet)

**Rollback**: Revert to Phase 1

---

### Phase 3: Wire PoolScreen (1 PR, ~6 hours)

**Goal**: Connect movie pool + contributors to Firebase

**Changes**:

1. Update `/v2/src/pages/PoolScreen.tsx`:
   ```tsx
   import { useState } from 'react';
   import { useAdapter } from '../context/AdapterContext';
   import { useRoom } from '../hooks/useRoom';
   import { Plus } from 'lucide-react';

   export default function PoolScreen() {
     const { adapter } = useAdapter();
     const roomCode = adapter?.getRoomCode();
     const roomData = useRoom(roomCode); // Real-time Firebase sync

     const [selectedContributor, setSelectedContributor] = useState<string>('all');
     const [isAddMovieOpen, setIsAddMovieOpen] = useState(false);
     const [isAddContributorOpen, setIsAddContributorOpen] = useState(false);

     if (!roomCode) {
       return <div>Please join a room first</div>;
     }

     if (!roomData) {
       return <div>Loading...</div>;
     }

     const { theme, contributors, moviePool } = roomData;

     // Filter movies by contributor
     const filteredMovies = selectedContributor === 'all'
       ? moviePool
       : moviePool.filter(m => m.suggestedBy.includes(selectedContributor));

     // Map v1 movie shape to MagicPatterns shape
     const movies = filteredMovies.map(movie => ({
       id: movie.title, // Use title as ID for now
       title: movie.title,
       year: movie.tmdbData?.release_date?.substring(0, 4) || '',
       imageUrl: movie.tmdbData?.poster_path
         ? `https://image.tmdb.org/t/p/w342${movie.tmdbData.poster_path}`
         : '',
       rating: movie.tmdbData?.vote_average?.toFixed(1) || ''
     }));

     const handleAddMovie = async (contributorId: string, title: string) => {
       await adapter.addMovie(contributorId, title);
       setIsAddMovieOpen(false);
     };

     const handleAddContributor = async (name: string) => {
       adapter.addContributor(name);
       setIsAddContributorOpen(false);
     };

     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar
           title={theme || 'Movie Pool'}
           action={
             <button onClick={() => setIsAddMovieOpen(true)}>
               <Plus className="w-6 h-6" />
             </button>
           }
         />

         {/* Contributor chips */}
         <div className="flex gap-2 overflow-x-auto p-4">
           <ContributorChip
             name="All"
             active={selectedContributor === 'all'}
             onClick={() => setSelectedContributor('all')}
           />
           {contributors.map(c => (
             <ContributorChip
               key={c.id}
               name={c.name}
               active={selectedContributor === c.id}
               onClick={() => setSelectedContributor(c.id)}
             />
           ))}
           <button
             onClick={() => setIsAddContributorOpen(true)}
             className="..." // Keep MagicPatterns styling
           >
             + Add
           </button>
         </div>

         {/* Movie grid */}
         <div className="grid grid-cols-2 gap-3 p-4">
           {movies.map(movie => (
             <MoviePosterTile key={movie.id} {...movie} />
           ))}
         </div>

         {/* Add Movie ActionSheet */}
         <ActionSheet isOpen={isAddMovieOpen} onClose={() => setIsAddMovieOpen(false)}>
           {/* Add movie form with contributor dropdown + title input */}
         </ActionSheet>

         {/* Add Contributor ActionSheet */}
         <ActionSheet isOpen={isAddContributorOpen} onClose={() => setIsAddContributorOpen(false)}>
           {/* Add contributor form with name input */}
         </ActionSheet>

         <BottomNav />
       </div>
     );
   }
   ```

2. Update `/v2/src/components/MoviePosterTile.tsx` to accept v1 movie shape

**Testing Checklist**:
- [ ] Pool displays real movies from Firebase
- [ ] Contributor filter chips work
- [ ] Add contributor → appears in chips immediately (via useRoom subscription)
- [ ] Add movie → TMDB fetch works, appears in grid
- [ ] Cross-tab sync: Add movie in v1 → appears in v2 pool
- [ ] Listener cleanup: Navigate away → unsubscribe called

**Rollback**: Revert to Phase 2

---

### Phase 4: Wire PickScreen (Interactive Picker) (1 PR, ~5 hours)

**Goal**: Implement MagicPatterns "hold to spin" picker that calls `adapter.pickTonightMovie()`

**Changes**:

1. Keep all PickScreen UI/animations from MagicPatterns
2. Replace mock movies with `roomData.moviePool`
3. On spin complete, call `adapter.pickTonightMovie()` instead of localStorage
4. Navigate to `/tonight` after pick

**Implementation**:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdapter } from '../context/AdapterContext';
import { useRoom } from '../hooks/useRoom';
import { confetti } from '../lib/confetti';

export default function PickScreen() {
  const { adapter } = useAdapter();
  const navigate = useNavigate();
  const roomCode = adapter?.getRoomCode();
  const roomData = useRoom(roomCode);

  const [state, setState] = useState('idle');
  const [holdProgress, setHoldProgress] = useState(0);
  const [winningIndex, setWinningIndex] = useState(0);

  if (!roomData || !roomData.moviePool.length) {
    return <div>Add movies to your pool first</div>;
  }

  const movies = roomData.moviePool.map(m => ({
    id: m.title,
    title: m.title,
    imageUrl: m.tmdbData?.poster_path
      ? `https://image.tmdb.org/t/p/w342${m.tmdbData.poster_path}`
      : ''
  }));

  const handleSpinComplete = async () => {
    // Pick the movie that was selected by animation
    const picked = await adapter.pickTonightMovie();

    // Trigger confetti
    confetti();

    // Navigate to tonight screen after animation
    setTimeout(() => navigate('/tonight'), 2000);
  };

  // Keep all MagicPatterns animations and UI
  return (
    <div className="min-h-screen bg-background">
      {/* Hold-to-spin button, carousel, animations... */}
      {/* On spin complete, call handleSpinComplete */}
    </div>
  );
}
```

**Validation**:
- Hold to spin works with real movies from Firebase
- Spin animation completes, calls `adapter.pickTonightMovie()`
- Tonight pick saved to Firebase
- Navigates to /tonight after pick
- Cross-tab sync: Pick in v2 → appears in v1 Tonight instantly

**Rollback**: Revert to Phase 3

---

### Phase 5: Wire TonightScreen (1 PR, ~4 hours)

**Goal**: Display tonight's pick from Firebase with MagicPatterns UI

**Changes**:

1. Update `/v2/src/pages/TonightScreen.tsx`:
   ```tsx
   import { useAdapter } from '../context/AdapterContext';
   import { useRoom } from '../hooks/useRoom';
   import { useNavigate } from 'react-router-dom';

   export default function TonightScreen() {
     const { adapter } = useAdapter();
     const navigate = useNavigate();
     const roomCode = adapter?.getRoomCode();
     const roomData = useRoom(roomCode);

     if (!roomCode) {
       return <div>Join a room first</div>;
     }

     if (!roomData) {
       return <div>Loading...</div>;
     }

     const { tonightPick, moviePool } = roomData;

     // State machine: No pick / Has pick
     if (!tonightPick) {
       return (
         <div className="min-h-screen bg-background pb-28 animate-fade-in">
           <AppBar title="Tonight" />
           <div className="text-center p-8">
             <h2>No movie selected</h2>
             <p>Pick tonight's movie from your pool</p>
             {moviePool.length > 0 ? (
               <button onClick={() => navigate('/pick')}>
                 Pick Tonight's Movie
               </button>
             ) : (
               <button onClick={() => navigate('/pool')}>
                 Add Movies First
               </button>
             )}
           </div>
           <BottomNav />
         </div>
       );
     }

     // Has pick - display with MagicPatterns UI
     const movie = {
       title: tonightPick.title,
       imageUrl: tonightPick.tmdbData?.poster_path
         ? `https://image.tmdb.org/t/p/w500${tonightPick.tmdbData.poster_path}`
         : '',
       year: tonightPick.tmdbData?.release_date?.substring(0, 4),
       overview: tonightPick.tmdbData?.overview,
       rating: tonightPick.tmdbData?.vote_average?.toFixed(1)
     };

     const handleMarkWatched = async () => {
       await adapter.markWatched(tonightPick);
       // tonightPick will be cleared automatically via Firebase listener
     };

     const handlePickAnother = async () => {
       adapter.clearTonightPick();
       navigate('/pick');
     };

     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar title="Tonight" />

         {/* Large poster with gradient overlay */}
         <div className="relative h-96">
           <img src={movie.imageUrl} alt={movie.title} className="..." />
           <div className="absolute inset-0 bg-gradient-to-t from-background" />
         </div>

         {/* Movie details */}
         <div className="p-6">
           <h1 className="text-3xl font-bold">{movie.title}</h1>
           <div className="flex gap-2 mt-2">
             <span className="badge">{movie.year}</span>
             <span className="badge">⭐ {movie.rating}</span>
           </div>
           <p className="mt-4 text-text-secondary">{movie.overview}</p>

           {/* Actions */}
           <div className="mt-6 space-y-3">
             <button onClick={handleMarkWatched} className="btn-primary w-full">
               ✓ Mark as Watched
             </button>
             <button onClick={handlePickAnother} className="btn-secondary w-full">
               Pick Another
             </button>
           </div>
         </div>

         <BottomNav />
       </div>
     );
   }
   ```

**Validation**:
- No pick state shows correct prompt
- Has pick displays movie with MagicPatterns UI
- Mark watched → moves to watched list, clears tonight pick
- Pick another → clears pick, navigates to /pick
- Cross-tab sync verified

**Rollback**: Revert to Phase 4

---

### Phase 6: Wire WatchedScreen (1 PR, ~3 hours)

**Goal**: Display watched history with undo functionality

**Changes**:

1. Update `/v2/src/pages/WatchedScreen.tsx`:
   ```tsx
   import { useAdapter } from '../context/AdapterContext';
   import { useRoom } from '../hooks/useRoom';

   export default function WatchedScreen() {
     const { adapter } = useAdapter();
     const roomCode = adapter?.getRoomCode();
     const roomData = useRoom(roomCode);

     if (!roomCode) {
       return <div>Join a room first</div>;
     }

     if (!roomData) {
       return <div>Loading...</div>;
     }

     const { watchedMovies } = roomData;

     const movies = watchedMovies.map(m => ({
       id: m.title,
       title: m.title,
       year: m.tmdbData?.release_date?.substring(0, 4),
       imageUrl: m.tmdbData?.poster_path
         ? `https://image.tmdb.org/t/p/w342${m.tmdbData.poster_path}`
         : '',
       rating: m.tmdbData?.vote_average?.toFixed(1),
       watchedAt: m.watchedAt,
       canUndo: Date.now() - m.watchedAt < 24 * 60 * 60 * 1000 // 24 hours
     }));

     const handleUndo = async (movie: any) => {
       const watchedMovie = watchedMovies.find(m => m.title === movie.title);
       if (watchedMovie) {
         const success = adapter.undoWatched(watchedMovie);
         if (!success) {
           alert('Cannot undo - more than 24 hours have passed');
         }
       }
     };

     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar title="Watched" />

         <div className="p-6">
           <h2 className="text-xl font-bold mb-2">Previously Watched</h2>
           <p className="text-text-secondary mb-6">Movies your group has finished.</p>

           {movies.length === 0 ? (
             <p className="text-center text-text-tertiary">No watched movies yet.</p>
           ) : (
             <div className="grid grid-cols-3 gap-3">
               {movies.map(movie => (
                 <div key={movie.id} className="relative">
                   <MoviePosterTile {...movie} />
                   {movie.canUndo && (
                     <button
                       onClick={() => handleUndo(movie)}
                       className="absolute top-2 right-2 bg-surface p-2 rounded-full"
                     >
                       ↶ Undo
                     </button>
                   )}
                 </div>
               ))}
             </div>
           )}
         </div>

         <BottomNav />
       </div>
     );
   }
   ```

**Validation**:
- Watched movies display in 3-column grid
- Undo button appears for movies < 24 hours
- Undo works → movie returns to pool
- Undo disabled for movies > 24 hours
- Cross-tab sync verified

**Rollback**: Revert to Phase 5

---

### Phase 7: Wire InviteScreen (Optional - NEW Feature) (1 PR, ~6 hours)

**Goal**: Implement invite management (room code sharing + link generation)

**Backend Changes Required**:

1. Add to DataAdapter:
   ```js
   /**
    * Generate shareable invite link
    * @returns {string} - Full URL like "https://yourapp.netlify.app/v2/join-room?code=ABC123"
    */
   getInviteLink() {
     const roomCode = this.getRoomCode();
     const baseUrl = window.location.origin;
     return `${baseUrl}/v2/join-room?code=${roomCode}`;
   }

   /**
    * Copy invite code or link to clipboard
    */
   async copyToClipboard(text) {
     await navigator.clipboard.writeText(text);
   }
   ```

2. Update `/v2/src/pages/InviteScreen.tsx`:
   ```tsx
   import { useAdapter } from '../context/AdapterContext';
   import { useParams } from 'react-router-dom';
   import { InviteCodeCard } from '../components/InviteCodeCard';
   import { InviteLinkCard } from '../components/InviteLinkCard';

   export default function InviteScreen() {
     const { adapter } = useAdapter();
     const { id } = useParams(); // Room ID from route
     const roomCode = adapter?.getRoomCode();

     const inviteLink = adapter?.getInviteLink();

     const handleCopyCode = async () => {
       await adapter.copyToClipboard(roomCode);
       alert('Room code copied!');
     };

     const handleCopyLink = async () => {
       await adapter.copyToClipboard(inviteLink);
       alert('Invite link copied!');
     };

     return (
       <div className="min-h-screen bg-background pb-28 animate-fade-in">
         <AppBar showBack title="Invite" />

         <div className="p-6 max-w-md mx-auto">
           <h2 className="text-2xl font-bold mb-2">Grow your circle</h2>
           <p className="text-text-secondary mb-6">Share this room with friends</p>

           <InviteCodeCard code={roomCode} onCopy={handleCopyCode} />
           <InviteLinkCard link={inviteLink} onCopy={handleCopyLink} />

           {/* MembersList - show current contributors */}
           {/* PendingInvitesList - optional, needs backend tracking */}
         </div>
       </div>
     );
   }
   ```

3. Update `/v2/src/pages/JoinRoomScreen.tsx` to auto-fill code from URL params:
   ```tsx
   const [searchParams] = useSearchParams();
   const codeParam = searchParams.get('code');

   useEffect(() => {
     if (codeParam) {
       setRoomCode(codeParam);
     }
   }, [codeParam]);
   ```

**Note**: Pending invites tracking (email invites) requires Firebase schema extension - can defer to post-MVP

**Validation**:
- Copy room code works
- Copy invite link works
- Invite link auto-fills join form when clicked
- Members list shows current contributors

**Rollback**: Revert to Phase 6

---

### Phase 8: Polish & Production (1 PR, ~4 hours)

**Goal**: Ship to production, clean up legacy v2

**Changes**:
1. Add loading skeletons (Tailwind `animate-pulse`)
2. Add error boundaries
3. Test on iPhone Safari (safe area insets)
4. Remove legacy v2 files (`/v2/legacy.html`, `/v2/screens/`, `/v2/app-shell.js`)
5. Update Netlify to serve React build
6. Add TypeScript types for DataAdapter
7. Clean up console logs
8. Update README

**Validation**:
- Full manual QA on all screens
- Cross-tab v1↔v2 sync tests
- Mobile Safari test
- Listener leak verification

**Rollback**: Restore `/v2/legacy.html`, redeploy

---

## D) DATA LAYER PLAN

### DataAdapter API Changes

**No breaking changes required**. Existing adapter API is sufficient for MagicPatterns migration.

**Optional additions** (Phase 7):
```ts
// Invite support
getInviteLink(): string
copyToClipboard(text: string): Promise<void>

// Streaming services (Phase 4 - optional)
updateRoomServices(services: string[]): Promise<void>
getRoomServices(): string[]
```

**TypeScript typings** (`v2/data-adapter.d.ts`):
```typescript
export interface Contributor {
  id: string;
  name: string;
  color: string;
  movies: string[];
}

export interface Movie {
  title: string;
  tmdbData: {
    poster_path?: string;
    backdrop_path?: string;
    overview?: string;
    release_date?: string;
    vote_average?: number;
    runtime?: number;
  };
  suggestedBy: string[];
  addedAt: number;
}

export interface WatchedMovie extends Movie {
  watchedAt: number;
}

export interface RoomData {
  theme: string;
  contributors: Contributor[];
  moviePool: Movie[];
  watchedMovies: WatchedMovie[];
  tonightPick?: Movie;
  streamingServices?: string[]; // NEW - optional
}

export class DataAdapter {
  readyPromise: Promise<void>;

  // Room management
  createRoom(theme: string): Promise<string>;
  joinRoom(roomCode: string): Promise<boolean>;
  subscribeRoom(roomCode: string, callback: (data: RoomData) => void): () => void;
  getRoomCode(): string | null;
  getRoomData(): RoomData | null;
  getTheme(): string;

  // Contributors
  addContributor(name: string): Contributor;
  getContributors(): Contributor[];
  removeContributor(contributorId: string): void;

  // Movies
  addMovie(contributorId: string, title: string): Promise<Movie>;
  getMoviePool(): Movie[];
  removeMovie(movieIndex: number): void;

  // Tonight pick
  pickTonightMovie(): Movie | null;
  getTonightPick(): Movie | null;
  clearTonightPick(): void;

  // Watched
  markWatched(movie: Movie): Promise<void>;
  getWatchedMovies(): WatchedMovie[];
  undoWatched(movie: WatchedMovie): boolean;

  // Room history
  getRoomHistory(): Array<{roomCode: string, theme: string, lastVisited: number}>;
  clearRoomHistory(): void;

  // NEW - Invite support
  getInviteLink(): string;
  copyToClipboard(text: string): Promise<void>;

  // Diagnostics
  getDiagnostics(): any;
  isReady(): boolean;
}
```

---

### MagicPatterns Features → v1 Mapping

| MagicPatterns Feature | v1 Backend Support | Action Required |
|----------------------|-------------------|-----------------|
| RoomsScreen room list | ✅ `getRoomHistory()` | None - already exists |
| CreateRoomScreen theme input | ✅ `createRoom(theme)` | None - already exists |
| CreateRoomScreen streaming services | ❌ Not in schema | **Phase 4**: Add `streamingServices` field to Firebase (optional) |
| JoinRoomScreen code input | ✅ `joinRoom(code)` | None - already exists |
| PoolScreen contributors | ✅ `getContributors()` | None - already exists |
| PoolScreen movie grid | ✅ `getMoviePool()` | None - already exists |
| PickScreen interactive picker | ✅ `pickTonightMovie()` | None - wire to existing method |
| TonightScreen pick display | ✅ `getTonightPick()` | None - already exists |
| TonightScreen mark watched | ✅ `markWatched()` | None - already exists |
| WatchedScreen history | ✅ `getWatchedMovies()` | None - already exists |
| WatchedScreen undo | ✅ `undoWatched()` (24h limit) | None - already exists |
| InviteScreen room code | ✅ Room code exists | **Phase 7**: Add `getInviteLink()` helper |
| InviteScreen invite link | ⚠️ Need URL generation | **Phase 7**: Add link generation method |
| InviteScreen members list | ✅ `getContributors()` | Map contributors → members |
| InviteScreen pending invites | ❌ Not tracked | **Post-MVP**: Add pending invites to Firebase (optional) |

---

### Firebase Schema Extensions (Optional)

**Current schema** (already works):
```
rooms/{roomCode}/
  theme: string
  contributors: [{id, name, color, movies}]
  moviePool: [{title, tmdbData, suggestedBy, addedAt}]
  watchedMovies: [{title, tmdbData, watchedAt}]
  tonightPick: {title, tmdbData, suggestedBy, pickedAt}
```

**Optional extensions** (can defer):
```
rooms/{roomCode}/
  streamingServices: string[] // ["Netflix", "HBO Max", ...]
  members: [{id, name, role: "host"|"member"}] // Distinguish host from contributors
  pendingInvites: [{email, sentAt, sentBy}] // Track email invites
```

**Migration**: All optional fields. Existing rooms work without them. `mergeWithDefaults()` handles missing fields.

---

## E) COMPONENT MAPPING

### MagicPatterns → v1 DataAdapter

| Component | Props (MagicPatterns) | Data Source (v1 DataAdapter) |
|-----------|----------------------|------------------------------|
| **AppBar** | `title`, `showBack`, `action` | Static (no data binding) |
| **BottomNav** | None | Static (navigation only) |
| **RoomCard** | `id, name, memberCount, active, lastActive` | `adapter.getRoomHistory()` |
| **MoviePosterTile** | `title, year, imageUrl, rating` | `roomData.moviePool[i].tmdbData` |
| **ContributorChip** | `name, active` | `roomData.contributors` |
| **ActionSheet** | `isOpen, onClose, children` | State-driven (no data) |
| **InviteCodeCard** | `code` | `adapter.getRoomCode()` |
| **InviteLinkCard** | `link` | `adapter.getInviteLink()` (new method) |
| **MembersList** | `members: [{name, role}]` | `roomData.contributors` (map to members) |
| **PendingInvitesList** | `invites: [{email, sentAt}]` | NOT SUPPORTED (post-MVP) |

---

## F) TESTING & QA

### Testing Strategy (same as original plan)

**Manual Testing**:
1. Single tab smoke test (create → add → pick → watch → undo)
2. Cross-tab v1↔v2 sync test (verify Firebase real-time updates)
3. Listener cleanup test (navigate between screens, check diagnostics)
4. Persistence test (reload, verify room history)
5. Mobile Safari test (safe area insets, animations)

**Automated Testing** (optional, post-launch):
- Unit tests: `useRoom` hook, `AdapterContext`
- Smoke tests: Create room, join room, add movie

---

## G) OPEN QUESTIONS / RISKS

### Critical Questions

1. **Streaming Services**: Should we implement streaming service filtering in Phase 4, or defer to post-MVP?
   - **Recommendation**: Defer to post-MVP. Let users create rooms without it for now.
   - **Impact**: CreateRoomScreen checkboxes will be non-functional initially (cosmetic only)

2. **Pending Invites**: Should we implement email invite tracking, or just do code/link sharing?
   - **Recommendation**: Just code/link sharing for MVP. Email tracking is complex (needs backend).
   - **Impact**: InviteScreen will not show pending invites section

3. **Member Roles**: Should we distinguish "host" from "member" in contributors?
   - **Recommendation**: Not needed for MVP. All contributors are equal for now.
   - **Impact**: MembersList will not show "host" badge

4. **PickScreen vs Tonight Pick**: MagicPatterns has both PickScreen (interactive) and TonightScreen (display). Should we keep both or merge?
   - **Recommendation**: Keep both. PickScreen is the fun game-like picker, TonightScreen is the result display.
   - **Impact**: Need route for `/pick` in addition to `/tonight`

5. **Undo UI**: MagicPatterns WatchedScreen doesn't show undo. Should we add it?
   - **Recommendation**: Yes, add undo button with 24-hour check (v1 has this functionality).
   - **Impact**: Need to enhance MoviePosterTile or add overlay button

### Top Risks

1. **Framer Motion Bundle Size**: Framer Motion is large (~70KB gzipped). Should we use it?
   - **Mitigation**: Yes, keep it for PickScreen confetti. Consider code-splitting per route.
   - **Experiment**: Phase 0 will test bundle size

2. **Confetti Performance**: PickScreen generates 40 particles. Will this lag on mobile?
   - **Mitigation**: Test on real iPhone during Phase 4. Reduce particle count if needed.
   - **Experiment**: Phase 4 mobile test

3. **TMDB Poster Loading**: MagicPatterns assumes instant image load. Firebase TMDB may be slow.
   - **Mitigation**: Add loading skeleton for MoviePosterTile
   - **Experiment**: Phase 3 will test with real TMDB calls

4. **TypeScript Strictness**: MagicPatterns code may have type errors when wiring to DataAdapter
   - **Mitigation**: Use `any` types initially, refine in Phase 8
   - **Experiment**: Phase 0 will test TypeScript compilation

---

## PROPOSED PHASED DELIVERY TABLE

| Phase | Deliverable | Acceptance Criteria | Est. Effort | PR Count |
|-------|-------------|---------------------|-------------|----------|
| **Phase 0** | Copy MagicPatterns code, setup Vite | - MagicPatterns UI renders<br>- Navigation works (mock data)<br>- Vite dev server runs<br>- v1 untouched | ~2 hours | 1 PR |
| **Phase 1** | AdapterContext + wire RoomsScreen | - RoomsScreen shows real room history<br>- Click room joins + navigates<br>- `useAdapter()` works | ~4 hours | 1 PR |
| **Phase 2** | Wire CreateRoom + JoinRoom | - Create room works<br>- Join room works<br>- Error handling (invalid code) | ~3 hours | 1 PR |
| **Phase 3** | Wire PoolScreen | - Movie grid displays Firebase data<br>- Contributor filter works<br>- Add movie/contributor functional<br>- **Cross-tab sync verified** | ~6 hours | 1 PR |
| **Phase 4** | Wire PickScreen | - Interactive picker works<br>- Calls `pickTonightMovie()`<br>- Confetti + animations work<br>- Navigates to /tonight | ~5 hours | 1 PR |
| **Phase 5** | Wire TonightScreen | - Displays tonight pick<br>- Mark watched works<br>- Pick another works<br>- **Cross-tab sync verified** | ~4 hours | 1 PR |
| **Phase 6** | Wire WatchedScreen | - Watched grid displays<br>- Undo works (< 24h)<br>- **Cross-tab sync verified** | ~3 hours | 1 PR |
| **Phase 7** | Wire InviteScreen (optional) | - Copy code/link works<br>- Invite link auto-fills join form<br>- Members list displays | ~6 hours | 1 PR |
| **Phase 8** | Production polish | - Loading states<br>- Error boundaries<br>- Mobile Safari tested<br>- Legacy v2 removed<br>- Deployed | ~4 hours | 1 PR |
| **TOTAL** | MagicPatterns UI + v1 backend | - Feature parity with v2 vanilla<br>- MagicPatterns UI fully functional<br>- Cross-tab sync working | **~37 hours** | **9 PRs** |

---

### Success Metrics

1. **Visual parity**: MagicPatterns UI design preserved
2. **Feature parity**: All v2 vanilla features work in React
3. **Performance**: < 1s Firebase update latency, smooth animations
4. **No regressions**: v1 untouched, no listener leaks
5. **Mobile UX**: Passes iPhone Safari test, safe area insets work
6. **Developer experience**: Hot reload works, Tailwind autocomplete works

---

**END OF REVISED TECHNICAL PLAN**
