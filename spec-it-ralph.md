# Rec-It-Ralph: Movie Recommender App Specification

## Project Overview

**App Name:** Rec-It-Ralph  
**Purpose:** A collaborative movie recommendation app for friend groups to pick movies together  
**Target Users:** Small groups of friends (2-6 people) who want to choose movies democratically  
**Platform:** Web application (frontend-only, no backend required)

### Core User Story
A group of 4 friends picks a theme (e.g., "Animated"). Each person adds 3–5 movies. From the combined pool (12–20 total), the app randomly suggests a movie. If they accept, it moves to a "Watched" list and is removed from the pool for next time. If the suggestion is a sequel, the app warns and suggests starting with the first in the series.

## Technical Architecture

### Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (vanilla or lightweight framework)
- **Storage:** Browser localStorage (no server required)
- **Sharing:** URL-based state serialization
- **Deployment:** Static hosting (Netlify, Vercel, GitHub Pages)

### Key Design Principles
- **Offline-first:** Works without internet after initial load
- **No registration:** Anonymous usage with direct URL sharing
- **Mobile-responsive:** Works on phones and tablets
- **Instant sync:** Real-time updates via URL sharing

## Data Models

### AppState
```javascript
{
  theme: string,        // e.g., "Animated Movies"
  contributors: Contributor[],
  moviePool: Movie[],
  watchedMovies: WatchedMovie[],
  themeHistory: ThemeEntry[],  // Past themes for reference
  createdAt: timestamp,
  lastModified: timestamp
}
```

### ThemeEntry
```javascript
{
  theme: string,
  startedAt: timestamp,
  endedAt: timestamp,     // When theme was changed
  moviesWatched: number   // Count of movies watched in this theme
}
```

### Contributor
```javascript
{
  id: string,           // Auto-generated UUID
  name: string,         // Display name
  movies: string[],     // Movie titles (3-5 items)
  color: string         // Badge color for UI
}
```

### Movie
```javascript
{
  title: string,        // Normalized title
  originalTitle: string, // As entered by user
  suggestedBy: string[], // Contributor IDs
  isAutoAdded: boolean,  // Added by sequel detection
  addedAt: timestamp
}
```

### WatchedMovie
```javascript
{
  title: string,
  suggestedBy: string[], // Original contributors
  watchedAt: timestamp,
  pickedBy: string       // Who accepted the suggestion
}
```

### Series Mapping
```javascript
{
  "Toy Story": [
    "Toy Story",
    "Toy Story 2", 
    "Toy Story 3",
    "Toy Story 4"
  ],
  "Shrek": [
    "Shrek",
    "Shrek 2",
    "Shrek the Third",
    "Shrek Forever After"
  ]
  // ... more series
}
```

## Core Features Specification

### 1. State Management & Sharing

#### App State
- **Single persistent state:** All data stored in one localStorage entry
- **Storage key:** `rec-it-ralph-state`
- **Auto-save:** Every user action triggers save

#### State Sharing
- **Share link button:** Generates URL with serialized state
- **URL format:** `https://app.com/?state={base64EncodedStateData}`
- **Import prompt:** When opening shared link, show preview and confirm import
- **Conflict resolution:** Option to merge contributors/movies or replace entire state

#### Theme Management
- **Current theme:** Editable at any time
- **Theme switching:** Option to clear pool when changing themes
- **Theme history:** Track past themes and stats (optional feature)

### 2. Theme & Contributors

#### Theme Setting
- **Single text input:** Free-form theme description
- **Examples shown:** "80s Movies", "Animated Films", "Sci-Fi Classics"
- **Character limit:** 50 characters
- **Theme switching:** 
  - "Clear Pool" checkbox when changing themes
  - Confirmation dialog: "Changing theme will clear your current movie pool. Continue?"
  - Option to archive current theme to history

#### Contributor Management
- **Add contributor:** Name input + auto-assigned color
- **Edit contributor:** Change name, reassign movies
- **Remove contributor:** Move their movies to "Unassigned" pool
- **Color coding:** 8 predefined colors, cycle through for new contributors

#### Movie Input
- **Per-contributor movie list:** 3-5 movies required
- **Text input validation:** 
  - No empty titles
  - Trim whitespace
  - Max 100 characters per title
- **Real-time counter:** Show "2/5 movies added"
- **Duplicate warning:** Highlight if same movie added by multiple people

### 3. Movie Pool & Deduplication

#### Deduplication Algorithm
```javascript
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')                    // Multiple spaces → single space
    .replace(/[^\w\s]/g, '')                 // Remove punctuation
    .replace(/\b(the|a|an)\b/g, '')          // Remove articles
    .replace(/\b\d{4}\b/g, '')               // Remove years
    .replace(/\s+/g, ' ')                    // Clean up again
    .trim();
}
```

#### Pool Display
- **List view:** Title + contributor badges
- **Sort options:** Alphabetical, Recently Added, By Contributor
- **Filter options:** By contributor, Show duplicates only
- **Pool statistics:** Total movies, unique movies, duplicates found

### 4. Random Suggestion System

#### Suggestion Algorithm
- **Random selection:** Equal weight for all movies in pool
- **Exclusion logic:** Skip movies already watched
- **Sequel check:** Run before displaying suggestion

#### Suggestion Modal
- **Movie title:** Large, prominent display
- **Suggested by:** Show contributor badges
- **Sequel warning:** If applicable (see Sequel Guard section)
- **Action buttons:**
  - **Accept:** Move to watched, remove from pool
  - **Re-roll:** Pick different movie (exclude current pick)
  - **Reject:** Close modal, return to pool

#### Edge Cases
- **Empty pool:** Show message "Add some movies first!"
- **All movies watched:** Options to:
  - Reset watched list (start over with same pool)
  - Change theme and add new movies
  - Import more movies from friends
- **Single movie left:** No re-roll option

### 5. Sequel Guard

#### Detection Heuristics
```javascript
const sequelPatterns = [
  /\b(2|3|4|5|6|7|8|9|10)\b/,              // Numbers
  /\b(II|III|IV|V|VI|VII|VIII|IX|X)\b/,     // Roman numerals
  /\bPart\s+\d+/i,                          // Part X
  /\bChapter\s+\d+/i,                       // Chapter X
  /\bVolume\s+\d+/i,                        // Volume X
  /:.+/,                                     // Colon with subtitle
  /\bSequel\b/i,                            // Contains "sequel"
  /\bReturns?\b/i,                          // Contains "returns"
];
```

#### Series Detection
1. **Check series mapping:** Look up movie in predefined series list
2. **Apply heuristics:** If not in series map, use pattern matching
3. **Find first movie:** Identify likely first entry in series
4. **Check availability:** See if first movie is in current pool or watched

#### Sequel Warning Modal
- **Warning message:** "This looks like a sequel: {Movie Title}"
- **Suggestion:** "Start with {First Movie} instead?"
- **Options:**
  - **Watch First:** Replace suggestion with first movie
  - **Add First:** Add first movie to pool (if not present) and suggest it
  - **Proceed Anyway:** Continue with sequel
  - **Cancel:** Return to pool without picking

### 6. Watched History

#### Watched List Display
- **Chronological order:** Most recent first
- **Movie details:** Title, watched date, who suggested, who picked
- **Undo action:** Move movie back to pool (within 24 hours)
- **Statistics:** Total movies watched, favorite contributors

#### Undo Functionality
- **Time limit:** 24 hours after watching
- **Undo button:** Next to each recent watched movie
- **Confirmation:** "Move {movie} back to pool?"
- **State restoration:** Restore original contributors who suggested it

### 7. Data Persistence

#### Auto-save
- **Trigger events:** Every user action (add movie, accept suggestion, etc.)
- **Storage key:** `rec-it-ralph-state`
- **Debounced saves:** Max one save per second to avoid performance issues

#### Manual Backup
- **Export JSON:** Download complete app state as .json file
- **Import JSON:** Upload and parse state data file
- **Validation:** Check data structure before importing
- **Filename format:** `rec-it-ralph-backup-{timestamp}.json`

#### URL State Sharing
- **Serialization:** JSON → gzip → base64 → URL parameter
- **Size limit:** 2000 characters (URL length limit)
- **Compression:** Use gzip to handle larger state data
- **Error handling:** Graceful fallback if URL too long
- **Share scope:** Entire app state (contributors, pool, history, current theme)

## User Interface Design

### Main Screen Layout
```
┌─────────────────────────────────────┐
│ 🎬 Rec-It-Ralph     [Share Link]    │
├─────────────────────────────────────┤
│ Theme: Animated Movies [Change]     │
├─────────────────────────────────────┤
│ Contributors (4)                    │
│ • Alice (5 movies) [Edit]           │
│ • Bob (4 movies) [Edit]             │
│ • Carol (3 movies) [Edit]           │
│ • Dave (5 movies) [Edit]            │
│ [+ Add Contributor]                 │
├─────────────────────────────────────┤
│ Movie Pool (15 movies)              │
│ [🎲 Pick Random Movie]              │
│                                     │
│ • Toy Story [Alice, Bob]            │
│ • Shrek [Carol]                     │
│ • Finding Nemo [Alice, Dave]        │
│ ...                                 │
├─────────────────────────────────────┤
│ Watched Movies (3)                  │
│ • Moana (2 days ago) [Undo]         │
│ • Wall-E (1 week ago)               │
│ • Up (2 weeks ago)                  │
└─────────────────────────────────────┘
```

### Modal Designs

#### Movie Suggestion Modal
```
┌─────────────────────┐
│    🎬 Suggestion    │
├─────────────────────┤
│                     │
│    TOY STORY 2      │
│                     │
│ Suggested by: Alice │
│                     │
│ ⚠️  Sequel Warning   │
│ Start with Toy Story│
│ instead?            │
│                     │
│ [Watch First]       │
│ [Proceed Anyway]    │
│ [Re-roll] [Cancel]  │
└─────────────────────┘
```

### Mobile Responsive Design
- **Breakpoints:** 
  - Mobile: < 768px
  - Tablet: 768px - 1024px  
  - Desktop: > 1024px
- **Touch targets:** Minimum 44px for buttons
- **Scrollable lists:** Movie pool and watched list
- **Modal sizing:** Full-screen on mobile

## Validation Rules

### Input Validation
- **Contributor names:** 1-30 characters, no special characters except spaces
- **Movie titles:** 1-100 characters, trim whitespace
- **Theme:** 1-50 characters

### Business Rules
- **Contributors:** Minimum 1, maximum 8
- **Movies per contributor:** 3-5 movies (soft warning, not enforced)
- **Pool size:** Minimum 1 movie to enable random selection
- **Duplicate handling:** Show warning but allow (user choice)

### Error Handling
- **localStorage failures:** Graceful degradation, show warning
- **Import errors:** Validate JSON structure, show specific error messages
- **URL sharing errors:** Handle malformed state parameters
- **Empty states:** Helpful messages and suggested actions

## Implementation Details

### Sequel Detection Implementation
```javascript
class SequelDetector {
  constructor(seriesMap) {
    this.seriesMap = seriesMap;
  }
  
  detectSequel(title) {
    // 1. Check series mapping first
    for (let [series, movies] of Object.entries(this.seriesMap)) {
      let index = this.findMovieInSeries(title, movies);
      if (index > 0) { // Not the first movie
        return {
          isSequel: true,
          series: series,
          position: index,
          firstMovie: movies[0]
        };
      }
    }
    
    // 2. Apply heuristic patterns
    for (let pattern of this.sequelPatterns) {
      if (pattern.test(title)) {
        return {
          isSequel: true,
          series: this.inferSeries(title),
          firstMovie: this.inferFirstMovie(title)
        };
      }
    }
    
    return { isSequel: false };
  }
}
```

### State Management
```javascript
class AppState {
  constructor() {
    this.data = this.loadFromStorage() || this.createDefault();
    this.setupAutoSave();
  }
  
  saveToStorage() {
    localStorage.setItem('rec-it-ralph-state', JSON.stringify(this.data));
  }
  
  exportToURL() {
    const json = JSON.stringify(this.data);
    const compressed = pako.gzip(json, { to: 'string' });
    const encoded = btoa(compressed);
    return `${window.location.origin}?state=${encoded}`;
  }
  
  changeTheme(newTheme, clearPool = false) {
    // Archive current theme if it had activity
    if (this.data.theme && this.data.watchedMovies.length > 0) {
      this.data.themeHistory.push({
        theme: this.data.theme,
        startedAt: this.data.themeStartedAt,
        endedAt: Date.now(),
        moviesWatched: this.data.watchedMovies.length
      });
    }
    
    this.data.theme = newTheme;
    this.data.themeStartedAt = Date.now();
    
    if (clearPool) {
      this.data.moviePool = [];
      // Reset contributor movie lists
      this.data.contributors.forEach(c => c.movies = []);
    }
  }
}
```

## Future Enhancements (Post-MVP)

### Enhanced Features
- **Voting system:** Rate suggested movies 1-5 stars before accepting
- **Watch later list:** Queue movies for future sessions
- **Movie details:** Integration with TMDB API for posters, ratings, descriptions
- **Smart suggestions:** Weight by contributor preferences and previous choices
- **Group preferences:** Tag movies by genre, mood, runtime
- **Streaming options:** Suggest where to watch the movie based on what streaming service movie is available to stream/rent

### Social Features
- **Watch history sharing:** Export watched list to social media
- **Achievement badges:** "Sequel Spotter", "Random Picker", "Series Completionist"
- **Statistics dashboard:** Most active contributor, favorite genres, watching streaks

### Technical Improvements
- **PWA support:** Install as mobile app, offline caching
- **Real-time sync:** WebRTC for live collaboration
- **Cloud backup:** Optional account system for cross-device sync
- **Advanced deduplication:** Fuzzy matching, alternative titles
- **Accessibility:** Screen reader support, keyboard navigation, high contrast mode

## Success Metrics

### User Engagement
- **Session duration:** Time spent in app per session
- **Movies per session:** Number of movies added/watched
- **Return usage:** Groups that use app multiple times
- **Feature adoption:** Usage of sequel detection, undo, sharing

### Technical Performance
- **Load time:** < 2 seconds on mobile
- **Storage efficiency:** < 1MB localStorage usage total
- **URL sharing success:** Successful state imports from shared links
- **Cross-device compatibility:** Works on iOS, Android, desktop browsers

---

*This specification serves as the comprehensive blueprint for developing Rec-It-Ralph. All features should be implemented to support the core user story while maintaining simplicity and ease of use.*