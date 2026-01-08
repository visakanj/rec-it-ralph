// Rec-It-Ralph - Movie Recommender App

// Color palette for contributors
const CONTRIBUTOR_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
];

// TMDB API Configuration
const TMDB_CONFIG = {
    apiKey: 'd226d9cc9623055bff481d969e31c343',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w92', // For provider logos
    posterBaseUrl: 'https://image.tmdb.org/t/p/w342', // For movie posters
    largePosterBaseUrl: 'https://image.tmdb.org/t/p/w500', // For larger movie posters
    backdropBaseUrl: 'https://image.tmdb.org/t/p/w780' // For backdrops
};

// TMDB Image Helper Utility
function tmdbPoster(path, size = 'w342') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

// Netflix-style contributor avatar color generator
function getAvatarColor(name) {
    const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-fuchsia-600', 'bg-amber-600', 'bg-cyan-600', 'bg-violet-600'];
    const colorValues = ['#dc2626', '#2563eb', '#059669', '#c026d3', '#d97706', '#0891b2', '#7c3aed'];
    const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = Math.abs(hash) % colorValues.length;
    return colorValues[index];
}

// TMDB Service for movie search and watch providers
class TMDBService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    }
    
    async searchMovie(title) {
        const cacheKey = `search_${title}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log('TMDB: Using cached result for', title);
            return cached.data;
        }
        
        try {
            const url = `${TMDB_CONFIG.baseUrl}/search/movie?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(title)}`;
            console.log('TMDB: Searching for', title, 'URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('TMDB: Response not ok:', response.status, response.statusText);
                throw new Error('Failed to search movie');
            }
            
            const data = await response.json();
            console.log('TMDB: Search response for', title, ':', data);
            
            const result = data.results && data.results.length > 0 ? data.results[0] : null;
            
            if (result) {
                console.log('TMDB: Found movie:', result.title, 'Poster:', result.poster_path);
            } else {
                console.log('TMDB: No results found for', title);
            }
            
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        } catch (error) {
            console.error('TMDB search error:', error);
            return null;
        }
    }
    
    async getWatchProviders(movieId) {
        const cacheKey = `providers_${movieId}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        try {
            const response = await fetch(
                `${TMDB_CONFIG.baseUrl}/movie/${movieId}/watch/providers?api_key=${TMDB_CONFIG.apiKey}`
            );
            
            if (!response.ok) throw new Error('Failed to get watch providers');
            
            const data = await response.json();
            this.cache.set(cacheKey, { data: data.results, timestamp: Date.now() });
            return data.results;
        } catch (error) {
            console.error('TMDB watch providers error:', error);
            return null;
        }
    }
    
    async getMovieWithProviders(title) {
        if (!TMDB_CONFIG.apiKey) {
            console.warn('TMDB API key not configured');
            return null;
        }
        
        const movie = await this.searchMovie(title);
        if (!movie) return null;
        
        const providers = await this.getWatchProviders(movie.id);
        return {
            movie,
            providers: providers || {}
        };
    }
    
    async getMovieData(title) {
        if (!TMDB_CONFIG.apiKey) {
            console.warn('TMDB API key not configured');
            return null;
        }
        
        console.log('TMDB: Getting movie data for', title);
        const movie = await this.searchMovie(title);
        if (!movie) {
            console.warn('TMDB: No movie found for', title);
            return null;
        }
        
        const movieData = {
            id: movie.id,
            title: movie.title,
            originalTitle: movie.original_title,
            posterPath: movie.poster_path,
            backdropPath: movie.backdrop_path,
            releaseDate: movie.release_date,
            overview: movie.overview,
            voteAverage: movie.vote_average
        };
        
        console.log('TMDB: Returning movie data:', movieData);
        return movieData;
    }
    
    getPosterUrl(posterPath) {
        const url = posterPath ? `${TMDB_CONFIG.posterBaseUrl}${posterPath}` : null;
        console.log('getPosterUrl:', posterPath, '->', url);
        return url;
    }
    
    getBackdropUrl(backdropPath) {
        return backdropPath ? `${TMDB_CONFIG.backdropBaseUrl}${backdropPath}` : null;
    }
}

// Sequel Detection System
class SequelDetector {
    constructor() {
        this.seriesMap = {};
        this.sequelPatterns = [
            /\b(2|3|4|5|6|7|8|9|10)\b/,              // Numbers
            /\b(II|III|IV|V|VI|VII|VIII|IX|X)\b/,     // Roman numerals
            /\bPart\s+\d+/i,                          // Part X
            /\bChapter\s+\d+/i,                       // Chapter X
            /\bVolume\s+\d+/i,                        // Volume X
            /:.+/,                                     // Colon with subtitle
            /\bSequel\b/i,                            // Contains "sequel"
            /\bReturns?\b/i,                          // Contains "returns"
        ];
        this.loadSeriesMap();
    }
    
    async loadSeriesMap() {
        try {
            const response = await fetch('series-map.json');
            this.seriesMap = await response.json();
        } catch (error) {
            console.warn('Could not load series map, using heuristics only:', error);
        }
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
                    firstMovie: movies[0],
                    suggestedTitle: movies[0]
                };
            }
        }
        
        // 2. Apply heuristic patterns
        for (let pattern of this.sequelPatterns) {
            if (pattern.test(title)) {
                return {
                    isSequel: true,
                    series: this.inferSeries(title),
                    firstMovie: this.inferFirstMovie(title),
                    suggestedTitle: this.inferFirstMovie(title),
                    heuristic: true
                };
            }
        }
        
        return { isSequel: false };
    }
    
    findMovieInSeries(title, movies) {
        const normalizedTitle = this.normalizeTitle(title);
        return movies.findIndex(movie => 
            this.normalizeTitle(movie) === normalizedTitle
        );
    }
    
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    inferSeries(title) {
        // Try to extract the base series name by removing sequel indicators
        return title
            .replace(/\b(2|3|4|5|6|7|8|9|10)\b.*$/i, '')
            .replace(/\b(II|III|IV|V|VI|VII|VIII|IX|X)\b.*$/i, '')
            .replace(/\bPart\s+\d+.*$/i, '')
            .replace(/\bChapter\s+\d+.*$/i, '')
            .replace(/:.+$/, '')
            .trim();
    }
    
    inferFirstMovie(title) {
        const baseName = this.inferSeries(title);
        return baseName;
    }
}

// App State Management
class AppState {
    constructor() {
        this.roomId = null;
        this.firebaseRef = null;
        this.isFirebaseMode = !!window.database;
        this.isReady = false;

        console.log('AppState initializing, Firebase mode:', this.isFirebaseMode);
        
        if (this.isFirebaseMode) {
            // Firebase mode - start with empty state, room will be joined/created
            this.data = this.createDefault();
            this.initializeRoom().then(() => {
                this.isReady = true;
                if (window.ui) {
                    window.ui.updateRoomCode(this.roomId);
                    window.ui.render();
                } else {
                    // UI not ready yet, store room code for later
                    this.pendingRoomCodeUpdate = this.roomId;
                }
            });
        } else {
            // Fallback to localStorage mode
            this.data = this.loadFromStorage() || this.createDefault();
            this.setupAutoSave();
            this.loadFromURL();
            this.isReady = true;
        }
    }

    createDefault() {
        return {
            theme: '',
            contributors: [],
            moviePool: [],
            watchedMovies: [],
            themeHistory: [],
            tonightPick: null, // v2: Current movie picked for tonight (full movie object)
            createdAt: Date.now(),
            lastModified: Date.now()
        };
    }
    
    mergeWithDefaults(firebaseData) {
        const defaults = this.createDefault();
        if (!firebaseData) return defaults;

        // Merge objects but ensure arrays are never null/undefined
        const merged = { ...defaults, ...firebaseData };

        // Force arrays to be actual arrays
        merged.contributors = Array.isArray(firebaseData.contributors) ? firebaseData.contributors : [];
        merged.moviePool = Array.isArray(firebaseData.moviePool) ? firebaseData.moviePool : [];
        merged.watchedMovies = Array.isArray(firebaseData.watchedMovies) ? firebaseData.watchedMovies : [];
        merged.themeHistory = Array.isArray(firebaseData.themeHistory) ? firebaseData.themeHistory : [];

        // Ensure tonightPick is either null or an object (backwards compatible)
        merged.tonightPick = firebaseData.tonightPick || null;
        
        // Ensure each contributor has a movies array
        merged.contributors = merged.contributors.map(contributor => ({
            ...contributor,
            movies: Array.isArray(contributor.movies) ? contributor.movies : []
        }));
        
        return merged;
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('rec-it-ralph-state');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return null;
        }
    }

    saveToStorage() {
        try {
            this.data.lastModified = Date.now();
            localStorage.setItem('rec-it-ralph-state', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    }

    setupAutoSave() {
        // Debounced save - max one save per second
        this.saveTimeout = null;
        this.save = () => {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveToStorage(), 1000);
        };
    }

    loadFromURL() {
        // Try multiple methods to get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let stateParam = urlParams.get('state');
        const compressed = urlParams.get('c') === '1';
        
        // Fallback: Parse URL manually if URLSearchParams fails
        if (!stateParam && window.location.search) {
            const urlMatch = window.location.search.match(/[?&]state=([^&]+)/);
            if (urlMatch) {
                stateParam = urlMatch[1];
            }
        }
        
        // Another fallback: Check the full URL
        if (!stateParam && window.location.href.includes('state=')) {
            const urlMatch = window.location.href.match(/state=([^&]+)/);
            if (urlMatch) {
                stateParam = urlMatch[1];
            }
        }
        
        console.log('Full URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Loading from URL - stateParam exists:', !!stateParam);
        console.log('State param value (first 50 chars):', stateParam ? stateParam.substring(0, 50) + '...' : 'none');
        console.log('Compressed flag:', compressed);
        
        if (stateParam) {
            try {
                let decodedState;
                
                if (compressed && typeof pako !== 'undefined') {
                    console.log('Using compressed decompression');
                    // Decompress gzipped data
                    const binaryString = atob(stateParam);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const decompressed = pako.ungzip(bytes, { to: 'string' });
                    decodedState = JSON.parse(decompressed);
                } else {
                    console.log('Using uncompressed base64');
                    // Handle uncompressed base64 (backwards compatibility)
                    decodedState = JSON.parse(atob(stateParam));
                }
                
                console.log('Successfully decoded state:', decodedState);
                
                // TODO: Show import confirmation modal
                // For now, just replace the state
                this.data = { ...this.createDefault(), ...decodedState };
                this.saveToStorage();
                
                console.log('State loaded from URL successfully');
                console.log('New state data:', this.data);
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Force UI refresh after state load
                setTimeout(() => {
                    if (window.ui) {
                        console.log('Forcing UI refresh after URL load');
                        window.ui.render();
                    }
                }, 100);
            } catch (error) {
                console.error('Failed to load state from URL:', error);
                console.error('Error details:', error.message);
                console.error('State parameter length:', stateParam.length);
            }
        } else {
            console.log('No state parameter found in URL');
        }
    }

    generateShareURL() {
        try {
            const jsonString = JSON.stringify(this.data);
            console.log('Generating share URL with data:', this.data);
            
            // TEMPORARY: Force uncompressed for debugging
            const encoded = btoa(jsonString);
            console.log('Generated URL:', `${window.location.origin}${window.location.pathname}?state=${encoded}`);
            return `${window.location.origin}${window.location.pathname}?state=${encoded}`;
            
            /* COMMENTED OUT COMPRESSION FOR DEBUGGING
            // Use gzip compression if available, fallback to base64
            if (typeof pako !== 'undefined') {
                const compressed = pako.gzip(jsonString);
                const encoded = btoa(String.fromCharCode.apply(null, compressed));
                return `${window.location.origin}${window.location.pathname}?state=${encoded}&c=1`;
            } else {
                // Fallback to uncompressed base64
                const encoded = btoa(jsonString);
                return `${window.location.origin}${window.location.pathname}?state=${encoded}`;
            }
            */
        } catch (error) {
            console.error('Failed to generate share URL:', error);
            return window.location.href;
        }
    }

    // Contributor methods
    addContributor(name) {
        const contributor = {
            id: this.generateId(),
            name: name.trim(),
            movies: [],
            color: CONTRIBUTOR_COLORS[this.data.contributors.length % CONTRIBUTOR_COLORS.length]
        };

        this.data.contributors.unshift(contributor);
        this.save();
        return contributor;
    }

    removeContributor(contributorId) {
        this.data.contributors = this.data.contributors.filter(c => c.id !== contributorId);
        // Remove movies suggested by this contributor from pool
        this.data.moviePool = this.data.moviePool.filter(movie => 
            !movie.suggestedBy.includes(contributorId)
        );
        this.save();
    }

    updateContributor(contributorId, updates) {
        const contributor = this.data.contributors.find(c => c.id === contributorId);
        if (contributor) {
            Object.assign(contributor, updates);
            this.save();
        }
    }

    // Movie methods (legacy - use addMovieToPool instead)
    async addMovie(contributorId, title) {
        return await this.addMovieToPool(contributorId, title);
    }

    async addContributorMovies(contributorId, movies) {
        const contributor = this.data.contributors.find(c => c.id === contributorId);
        if (!contributor) return;
        
        // Add new movies to contributor's list (avoid duplicates)
        const cleanMovies = movies.filter(m => m.trim()).map(m => m.trim());
        for (const title of cleanMovies) {
            if (title && !contributor.movies.includes(title)) {
                contributor.movies.push(title);
                // Add to pool
                await this.addMovieToPool(contributorId, title);
            }
        }
        
        this.save();
    }

    async addMovieToPool(contributorId, title) {
        console.log('[AppState DEBUG] ═══ addMovieToPool ENTRY ═══');
        console.log('[AppState DEBUG] contributorId:', contributorId);
        console.log('[AppState DEBUG] title:', title);
        console.log('[AppState DEBUG] moviePool length BEFORE:', this.data.moviePool.length);

        const normalizedTitle = this.normalizeTitle(title);
        const originalTitle = title.trim();

        // Check if movie already exists in pool
        let existingMovie = this.data.moviePool.find(m =>
            this.normalizeTitle(m.title) === normalizedTitle
        );

        if (existingMovie) {
            console.log('[AppState DEBUG] ✓ Movie already exists in pool, updating');
            console.log('[AppState DEBUG] Existing movie:', existingMovie.title);

            // Add contributor to existing movie if not already there
            if (!existingMovie.suggestedBy.includes(contributorId)) {
                existingMovie.suggestedBy.push(contributorId);
                console.log('[AppState DEBUG] Added contributor to existing movie');
            }
            // Move existing movie to top of pool
            const movieIndex = this.data.moviePool.indexOf(existingMovie);
            if (movieIndex > 0) {
                this.data.moviePool.splice(movieIndex, 1);
                this.data.moviePool.unshift(existingMovie);
                console.log('[AppState DEBUG] Moved existing movie to top (was at index', movieIndex, ')');
            }

            console.log('[AppState DEBUG] moviePool length AFTER update:', this.data.moviePool.length);
            console.log('[AppState DEBUG] Calling save() after updating existing movie');

            // IMPORTANT: Persist immediately. In v2 there is no window.ui/tmdbService, so we must save outside TMDB enrichment.
            // TODO(v2): Decouple TMDB enrichment from persistence; use shared tmdb service (window.ui?.tmdbService or v2Adapter.tmdb).
            this.save();

            // TODO(v2): Standardize AppState return values - some methods return objects, others return undefined. For consistency and v2 adapter needs, mutation methods should return the affected object.
            return existingMovie;
        } else {
            console.log('[AppState DEBUG] ✓ Movie does NOT exist, creating new');

            // Create new movie and add to top of pool
            const movie = {
                title: originalTitle,
                originalTitle: originalTitle,
                suggestedBy: [contributorId],
                isAutoAdded: false,
                addedAt: Date.now(),
                tmdbData: null
            };

            console.log('[AppState DEBUG] Created movie object:', movie);
            this.data.moviePool.unshift(movie); // Add to beginning instead of end
            console.log('[AppState DEBUG] moviePool length AFTER insert:', this.data.moviePool.length);
            console.log('[AppState DEBUG] Calling save() after adding new movie');

            // IMPORTANT: Persist immediately. In v2 there is no window.ui/tmdbService, so we must save outside TMDB enrichment.
            // TODO(v2): Decouple TMDB enrichment from persistence; use shared tmdb service (window.ui?.tmdbService or v2Adapter.tmdb).
            this.save();

            // Fetch TMDB data asynchronously (enrichment happens after save, doesn't block return)
            // Check for TMDB service in both v1 and v2 modes
            const tmdbService = window.ui?.tmdbService || window.tmdbService;
            console.log('[AppState DEBUG] Checking TMDB: window.ui exists?', !!window.ui, 'tmdbService exists?', !!tmdbService);
            if (tmdbService) {
                console.log('[AppState DEBUG] ✓ TMDB available, fetching asynchronously');
                tmdbService.getMovieData(originalTitle).then(tmdbData => {
                    if (tmdbData) {
                        console.log('TMDB: Adding tmdbData to movie:', originalTitle, tmdbData);

                        // Find the movie in the pool and update it directly
                        const movieInPool = this.data.moviePool.find(m => m.title === movie.title && m.addedAt === movie.addedAt);
                        console.log('TMDB: Movie found in pool:', movieInPool ? 'YES' : 'NO');

                        if (movieInPool) {
                            movieInPool.tmdbData = tmdbData;
                            console.log('TMDB: Updated movie in pool with tmdbData');
                            console.log('TMDB: Movie in pool now has tmdbData:', movieInPool.tmdbData ? 'YES' : 'NO');
                            console.log('[AppState DEBUG] Calling save() after TMDB enrichment');

                            this.save();
                            console.log('TMDB: Saved to Firebase');

                            // Trigger UI refresh to show the thumbnail
                            if (window.ui) {
                                window.ui.render();
                            }
                        } else {
                            console.warn('TMDB: Could not find movie in pool to update');
                        }
                    }
                }).catch(error => {
                    console.warn('Failed to fetch TMDB data for:', originalTitle, error);
                });
            } else {
                console.log('[AppState DEBUG] ✗ TMDB NOT available (expected in v2 mode)');
            }

            // TODO(v2): Standardize AppState return values - some methods return objects, others return undefined. For consistency and v2 adapter needs, mutation methods should return the affected object.
            return movie;
        }

        console.log('[AppState DEBUG] ═══ addMovieToPool EXIT ═══');
    }

    normalizeTitle(title) {
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

    // Theme methods
    setTheme(theme, clearPool = false) {
        if (this.data.theme && this.data.watchedMovies.length > 0) {
            // Archive current theme
            this.data.themeHistory.push({
                theme: this.data.theme,
                startedAt: this.data.themeStartedAt || this.data.createdAt,
                endedAt: Date.now(),
                moviesWatched: this.data.watchedMovies.length
            });
        }
        
        this.data.theme = theme;
        this.data.themeStartedAt = Date.now();
        
        if (clearPool) {
            this.data.moviePool = [];
            this.data.contributors.forEach(c => c.movies = []);
        }
        
        this.save();
    }
    
    // Room isolation and cleanup methods
    clearAllRoomState() {
        console.log('Clearing all room state for clean room switch');
        
        // Clear all data arrays
        this.data = this.createDefault();
        
        // Clear any pending UI state
        if (window.ui) {
            // Close all modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            
            // Clear any form inputs that might have old room data
            document.querySelectorAll('input[type="text"], textarea').forEach(input => {
                if (!input.readOnly) {
                    input.value = '';
                }
            });
        }
    }
    
    // Atomic room creation with proper isolation
    async createRoomAtomic(roomCode, theme, contributorsToTransfer = []) {
        console.log('Creating new room atomically:', roomCode);
        
        if (!this.isFirebaseMode) {
            throw new Error('Atomic room creation requires Firebase mode');
        }
        
        try {
            // Create completely fresh room data
            const newRoomData = this.createDefault();
            newRoomData.theme = theme;
            newRoomData.themeStartedAt = Date.now();
            
            // Add contributors if transferring
            if (contributorsToTransfer.length > 0) {
                newRoomData.contributors = contributorsToTransfer.map(contributor => ({
                    id: this.generateContributorId(),
                    name: contributor.name,
                    color: contributor.color,
                    movies: [], // Explicitly empty
                    addedAt: Date.now()
                }));
            }
            
            // Disconnect from current room cleanly
            if (this.firebaseRef) {
                this.firebaseRef.off();
                console.log('Disconnected from previous Firebase room');
            }
            
            // Clear all local state before switching
            this.clearAllRoomState();
            
            // Set up new room reference
            this.roomId = roomCode;
            this.firebaseRef = window.database.ref(`rooms/${roomCode}`);
            
            // Atomic write - set the entire room data at once
            await this.firebaseRef.set(newRoomData);
            console.log('Successfully wrote new room data to Firebase');
            
            // Update local state to match what we just wrote
            this.data = newRoomData;
            
            // Update browser URL
            window.history.pushState({}, '', `?room=${roomCode}`);
            
            // Set up listener for future changes
            setTimeout(() => {
                console.log('Setting up Firebase listener after atomic room creation');
                if (!window.RECITRALPH_V2_MODE) {
                    this.setupFirebaseListener(false);
                } else {
                    console.log('[AppState] Skipping Firebase listener setup (v2 mode)');
                }
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error('Failed to create room atomically:', error);
            throw error;
        }
    }

    // Room management methods
    createNewRoom(roomCode, theme, contributorsToTransfer = []) {
        console.log('Creating new room:', roomCode, 'with theme:', theme);
        console.log('Contributors to transfer:', contributorsToTransfer);
        console.log('Current data before room creation:', this.data);
        
        // Create completely fresh room data first
        const newData = this.createDefault();
        newData.theme = theme;
        newData.themeStartedAt = Date.now();
        
        // Transfer contributors if specified - with completely empty movie lists
        if (contributorsToTransfer.length > 0) {
            newData.contributors = contributorsToTransfer.map(contributor => ({
                id: this.generateContributorId(),
                name: contributor.name,
                color: contributor.color,
                movies: [], // Explicitly empty movies array
                addedAt: Date.now()
            }));
        }
        
        console.log('New room data created:', newData);
        
        // Replace current data with new room data BEFORE setting up Firebase
        this.data = newData;
        
        // If we're in Firebase mode, set up the new room
        if (this.isFirebaseMode) {
            // Disconnect from current room
            if (this.firebaseRef) {
                this.firebaseRef.off();
                console.log('Disconnected from previous Firebase room');
            }
            
            // Set new room ID and reference
            this.roomId = roomCode;
            this.firebaseRef = window.database.ref(`rooms/${roomCode}`);
            
            // Update URL in browser
            window.history.pushState({}, '', `?room=${roomCode}`);
        }
        
        // Save the fresh room data first
        this.save();
        
        // Now set up Firebase listener for future changes (after our data is saved)
        if (this.isFirebaseMode) {
            // Set up listener normally after the save is complete
            setTimeout(() => {
                console.log('Setting up Firebase listener after new room creation');
                if (!window.RECITRALPH_V2_MODE) {
                    this.setupFirebaseListener(false);
                } else {
                    console.log('[AppState] Skipping Firebase listener setup (v2 mode)');
                }
            }, 100);
        }
        
        // Update UI room code display if available
        if (window.ui) {
            window.ui.updateRoomCode(roomCode);
        }
        
        console.log(`Successfully created new room: ${roomCode} with theme: ${theme}`);
        console.log('Final room data:', this.data);
    }
    
    generateContributorId() {
        return Math.random().toString(36).substring(2, 15);
    }

    // Random selection
    pickRandomMovie() {
        if (this.data.moviePool.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * this.data.moviePool.length);
        return this.data.moviePool[randomIndex];
    }

    /**
     * Set tonight's pick and persist to Firebase (v2 feature)
     * @param {Object} movie - Movie object to set as tonight's pick
     */
    setTonightPick(movie) {
        if (!movie) {
            console.warn('[AppState] setTonightPick called with null/undefined movie');
            return;
        }

        // Store a copy of the full movie object (including tmdbData if present)
        this.data.tonightPick = { ...movie };

        console.log('[AppState] Tonight pick set:', movie.title);
        this.save();
    }

    /**
     * Clear tonight's pick (v2 feature)
     */
    clearTonightPick() {
        this.data.tonightPick = null;
        console.log('[AppState] Tonight pick cleared');
        this.save();
    }

    /**
     * Pick a random movie and set it as tonight's pick (v2 convenience method)
     * @returns {Object|null} The picked movie, or null if pool is empty
     */
    pickAndSetTonightMovie() {
        const movie = this.pickRandomMovie();
        if (movie) {
            this.setTonightPick(movie);
        }
        return movie;
    }

    acceptMovie(movie) {
        // Move to watched
        const watchedMovie = {
            title: movie.title,
            suggestedBy: movie.suggestedBy,
            watchedAt: Date.now(),
            pickedBy: 'User' // TODO: Add user identification
        };
        
        this.data.watchedMovies.unshift(watchedMovie);
        
        // Remove from pool
        this.data.moviePool = this.data.moviePool.filter(m => m !== movie);
        
        this.save();
    }

    undoWatched(watchedMovie) {
        // Check if within 24 hours
        const timeDiff = Date.now() - watchedMovie.watchedAt;
        if (timeDiff > 24 * 60 * 60 * 1000) return false; // More than 24 hours

        // Move back to pool - PRESERVE ALL ORIGINAL DATA including tmdbData and addedAt
        const movie = {
            ...watchedMovie,  // Preserve ALL fields (title, tmdbData, etc.)
            originalTitle: watchedMovie.originalTitle || watchedMovie.title,
            suggestedBy: watchedMovie.suggestedBy,
            isAutoAdded: watchedMovie.isAutoAdded || false,
            addedAt: watchedMovie.originalAddedAt || watchedMovie.addedAt  // Use original timestamp!
        };

        // Remove watched-specific fields
        delete movie.watchedAt;
        delete movie.originalAddedAt;

        this.data.moviePool.push(movie);

        // Remove from watched
        this.data.watchedMovies = this.data.watchedMovies.filter(m => m !== watchedMovie);

        this.save();
        return true;
    }

    removeMovieFromPool(movieIndex) {
        if (movieIndex >= 0 && movieIndex < this.data.moviePool.length) {
            const movie = this.data.moviePool[movieIndex];
            
            // Remove movie from contributor's lists
            movie.suggestedBy.forEach(contributorId => {
                const contributor = this.data.contributors.find(c => c.id === contributorId);
                if (contributor) {
                    contributor.movies = contributor.movies.filter(title => 
                        this.normalizeTitle(title) !== this.normalizeTitle(movie.title)
                    );
                }
            });
            
            // Remove from pool
            this.data.moviePool.splice(movieIndex, 1);
            this.save();
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Refresh TMDB data for all movies in pool that don't have it
    async refreshAllMovieThumbnails() {
        if (!window.ui || !window.ui.tmdbService) {
            console.warn('TMDB service not available');
            return;
        }

        const moviesWithoutTmdb = this.data.moviePool.filter(movie => !movie.tmdbData);
        
        if (moviesWithoutTmdb.length === 0) {
            console.log('All movies already have TMDB data');
            return;
        }

        console.log(`TMDB: Refreshing thumbnails for ${moviesWithoutTmdb.length} movies`);

        // Process movies in batches to avoid overwhelming the API
        const batchSize = 3;
        for (let i = 0; i < moviesWithoutTmdb.length; i += batchSize) {
            const batch = moviesWithoutTmdb.slice(i, i + batchSize);
            
            // Process batch in parallel
            await Promise.all(batch.map(async (movie) => {
                try {
                    const tmdbData = await window.ui.tmdbService.getMovieData(movie.title);
                    if (tmdbData) {
                        movie.tmdbData = tmdbData;
                        console.log(`TMDB: Added thumbnail for ${movie.title}`);
                    }
                } catch (error) {
                    console.warn(`TMDB: Failed to fetch data for ${movie.title}:`, error);
                }
            }));

            // Small delay between batches to be nice to the API
            if (i + batchSize < moviesWithoutTmdb.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Save all updates
        this.save();
        
        // Refresh UI
        if (window.ui) {
            window.ui.render();
        }

        console.log('TMDB: Thumbnail refresh complete');
    }

    // Firebase Room Management
    generateRoomCode(length = 7) {
        // Use non-ambiguous characters (no I, L, O, 0, 1)
        const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        let result = '';
        
        // Use crypto.getRandomValues for better randomness
        const randomArray = new Uint8Array(length);
        crypto.getRandomValues(randomArray);
        
        for (let i = 0; i < length; i++) {
            result += alphabet[randomArray[i] % alphabet.length];
        }
        
        return result;
    }

    async initializeRoom() {
        // Check URL parameters first for room code
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomCode = urlParams.get('room');

        if (urlRoomCode) {
            console.log('Found room code in URL:', urlRoomCode);
            const success = await this.joinRoom(urlRoomCode);
            if (success) {
                return; // Successfully joined room from URL
            } else {
                console.log('Room from URL not found, falling back to localStorage');
            }
        }

        // Check if there's a room code in localStorage
        const savedRoomId = localStorage.getItem('rec-it-ralph-room-id');

        if (savedRoomId) {
            const success = await this.joinRoom(savedRoomId);
            if (!success) {
                await this.createNewRoom();
            }
        } else {
            await this.createNewRoom();
        }
    }

    async createNewRoom() {
        this.roomId = this.generateRoomCode();
        console.log('Creating new room:', this.roomId);
        
        // Save room ID to localStorage
        localStorage.setItem('rec-it-ralph-room-id', this.roomId);
        
        // Initialize Firebase reference
        this.firebaseRef = window.database.ref(`rooms/${this.roomId}`);
        
        // Set initial data in Firebase
        await this.firebaseRef.set(this.data);

        // Set up real-time listener
        if (!window.RECITRALPH_V2_MODE) {
            this.setupFirebaseListener();
        } else {
            console.log('[AppState] Skipping Firebase listener setup (v2 mode)');
        }

        // Update UI
        if (window.ui) {
            window.ui.updateRoomCode(this.roomId);
        }
    }

    async joinRoom(roomId) {
        try {
            const cleanRoomId = roomId.toUpperCase();
            console.log('Joining room:', cleanRoomId);
            
            // Disconnect from current room and clear state
            if (this.firebaseRef) {
                this.firebaseRef.off();
                console.log('Disconnected from previous room');
            }
            
            // Clear all local state before switching
            this.clearAllRoomState();
            
            // Set up new room
            this.roomId = cleanRoomId;
            this.firebaseRef = window.database.ref(`rooms/${this.roomId}`);
            
            // Check if room exists
            const snapshot = await this.firebaseRef.once('value');
            if (!snapshot.exists()) {
                console.log('Room does not exist:', this.roomId);
                return false;
            }
            
            console.log('Successfully joined room:', this.roomId);
            
            // Save room ID to localStorage
            localStorage.setItem('rec-it-ralph-room-id', this.roomId);
            
            // Update URL
            window.history.pushState({}, '', `?room=${this.roomId}`);
            
            // Load room data with proper defaults
            const firebaseData = snapshot.val();
            this.data = this.mergeWithDefaults(firebaseData);

            // Set up real-time listener
            if (!window.RECITRALPH_V2_MODE) {
                this.setupFirebaseListener();
            } else {
                console.log('[AppState] Skipping Firebase listener setup (v2 mode)');
            }

            // Update UI
            if (window.ui) {
                window.ui.updateRoomCode(this.roomId);
                window.ui.render();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            return false;
        }
    }

    setupFirebaseListener(isNewRoom = false) {
        if (!this.firebaseRef) return;
        
        console.log('Setting up Firebase listener for room:', this.roomId, 'isNewRoom:', isNewRoom);
        
        // For new rooms, we want to set our fresh data first, then listen for future changes
        if (isNewRoom) {
            console.log('New room: Setting fresh data to Firebase first');
            // Don't set up listener yet - save() will handle the initial Firebase write
            return;
        }
        
        this.firebaseRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const newData = snapshot.val();
                console.log('Received Firebase update:', newData);
                
                // Only update if data is different (avoid infinite loops)
                const mergedData = this.mergeWithDefaults(newData);
                
                // Preserve local TMDB data that might not be in Firebase yet
                if (this.data.moviePool && mergedData.moviePool) {
                    console.log('TMDB: Merging Firebase data, preserving local TMDB data');
                    
                    mergedData.moviePool = mergedData.moviePool.map(firebaseMovie => {
                        const localMovie = this.data.moviePool.find(m => 
                            m.title === firebaseMovie.title && 
                            m.addedAt === firebaseMovie.addedAt
                        );
                        
                        console.log('TMDB: Checking movie', firebaseMovie.title, 
                                  'Local TMDB:', localMovie?.tmdbData ? 'exists' : 'missing',
                                  'Firebase TMDB:', firebaseMovie.tmdbData ? 'exists' : 'missing');
                        
                        // If local movie has TMDB data but Firebase doesn't, keep local TMDB data
                        if (localMovie && localMovie.tmdbData && !firebaseMovie.tmdbData) {
                            console.log('TMDB: Preserving local TMDB data for', firebaseMovie.title);
                            return { ...firebaseMovie, tmdbData: localMovie.tmdbData };
                        }
                        
                        return firebaseMovie;
                    });
                }
                
                if (JSON.stringify(this.data) !== JSON.stringify(mergedData)) {
                    this.data = mergedData;
                    
                    // Update UI
                    if (window.ui) {
                        window.ui.render();
                    }
                }
            }
        });
    }

    // Firebase save method
    saveToFirebase() {
        console.log('[AppState DEBUG] ─── saveToFirebase() called ───');
        console.log('[AppState DEBUG] firebaseRef exists?', !!this.firebaseRef);
        console.log('[AppState DEBUG] isFirebaseMode?', this.isFirebaseMode);
        console.log('[AppState DEBUG] roomId:', this.roomId);

        if (this.firebaseRef && this.isFirebaseMode) {
            this.data.lastModified = Date.now();

            const firebasePath = `rooms/${this.roomId}`;
            console.log('[AppState DEBUG] ✓ Writing to Firebase path:', firebasePath);
            console.log('[AppState DEBUG] Data being written - moviePool length:', this.data.moviePool.length);
            console.log('[AppState DEBUG] Data being written - contributors count:', this.data.contributors.length);

            // Debug: Check if TMDB data exists in what we're saving
            const moviesWithTmdb = this.data.moviePool.filter(m => m.tmdbData);
            console.log('TMDB: Saving to Firebase -', moviesWithTmdb.length, 'movies have TMDB data');
            if (moviesWithTmdb.length > 0) {
                console.log('TMDB: Movies with TMDB data:', moviesWithTmdb.map(m => m.title));
            }

            this.firebaseRef.set(this.data)
                .then(() => {
                    console.log('[AppState DEBUG] ✓ Firebase write SUCCESS');
                })
                .catch(error => {
                    console.error('[AppState DEBUG] ✗ Firebase write FAILED:', error);
                    console.error('[AppState DEBUG] Error code:', error.code);
                    console.error('[AppState DEBUG] Error message:', error.message);
                });
        } else {
            console.log('[AppState DEBUG] ✗ Skipping Firebase write:');
            if (!this.firebaseRef) console.log('[AppState DEBUG]   - firebaseRef is null/undefined');
            if (!this.isFirebaseMode) console.log('[AppState DEBUG]   - isFirebaseMode is false');
        }
    }

    // Override save method to use Firebase when available
    save() {
        console.log('[AppState DEBUG] ►►► save() called ◄◄◄');
        console.log('[AppState DEBUG] isFirebaseMode:', this.isFirebaseMode);

        if (this.isFirebaseMode) {
            console.log('[AppState DEBUG] → Calling saveToFirebase()');
            this.saveToFirebase();
        } else {
            console.log('[AppState DEBUG] → Using localStorage (debounced)');
            // Use debounced save for localStorage
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveToStorage(), 1000);
        }
    }

    // Helper for modal: get movie object by ID
    getMovieById(movieId) {
        // Try to find by ID first, then by index if movieId is a number
        const movieById = this.data.moviePool.find(movie => movie.id === movieId);
        if (movieById) return movieById;

        // If movieId is numeric, treat it as an index
        const index = parseInt(movieId);
        if (!isNaN(index) && index >= 0 && index < this.data.moviePool.length) {
            return this.data.moviePool[index];
        }

        return null;
    }

    // Helper for modal: move movie from pool to watched
    async movePoolToWatched(movie) {
        const movieIndex = this.data.moviePool.findIndex(m => {
            // First try exact movie object match
            if (m === movie) return true;

            // Then try ID match
            if (m.id && movie.id && m.id === movie.id) return true;

            // Finally try title match as fallback
            return m.title === movie.title;
        });

        if (movieIndex === -1) {
            console.warn('Movie not found in pool:', movie);
            return;
        }

        // Remove from pool
        const [watchedMovie] = this.data.moviePool.splice(movieIndex, 1);

        // Preserve original addedAt timestamp for undo functionality
        watchedMovie.originalAddedAt = watchedMovie.addedAt;

        // Add watched timestamp and move to watched list
        watchedMovie.watchedAt = Date.now();
        this.data.watchedMovies.unshift(watchedMovie); // Add to front

        // Keep only last 20 watched movies
        if (this.data.watchedMovies.length > 20) {
            this.data.watchedMovies = this.data.watchedMovies.slice(0, 20);
        }

        // Clear tonight pick if this movie was the current pick (v2 feature)
        if (this.data.tonightPick) {
            const isSameMovie =
                this.data.tonightPick.title === watchedMovie.title ||
                (this.data.tonightPick.id && watchedMovie.id && this.data.tonightPick.id === watchedMovie.id);

            if (isSameMovie) {
                console.log('[AppState] Clearing tonight pick (movie was marked watched)');
                this.data.tonightPick = null;
            }
        }

        this.save();

        // Re-render both sections
        if (window.ui) {
            window.ui.renderMoviePool();
            window.ui.renderWatchedMovies();
        }
    }
}

// UI Controller
class UIController {
    constructor(appState) {
        this.state = appState;
        this.sequelDetector = new SequelDetector();
        this.tmdbService = new TMDBService();
        
        this.setupEventListeners();
        
        // Only render if state is ready (Firebase has loaded or localStorage mode)
        if (this.state.isReady) {
            this.render();
        }
    }



    async onPickRandomClick() {
        if (this._animating) return;
        this._animating = true;

        // Clear any previous winner state
        this.clearWinnerState();

        // Auto-scroll to movie pool
        document.getElementById('movie-pool-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Wait ~300ms for scroll to settle
        await this.sleep(300);

        console.log('Auto-scroll complete (Phase 1)');

        // Phase 2: Jiggle all movie tiles
        const tiles = document.querySelectorAll('#movie-pool-grid .movie-tile');
        tiles.forEach((tile, i) => {
            const inner = tile.querySelector('.tile-inner');
            if (inner) {
                inner.style.animationDelay = `${i * 20}ms`;
                inner.classList.add('is-jiggling');
            }
        });

        // Stop jiggling after 2s
        setTimeout(() => {
            tiles.forEach(tile => {
                const inner = tile.querySelector('.tile-inner');
                if (inner) {
                    inner.classList.remove('is-jiggling');
                    inner.style.animationDelay = '0ms';
                }
            });
            console.log('Jiggle animation complete (Phase 2)');

            // Next phase: spotlight winner
            this.spotlightWinner();
            this._animating = false;
        }, 2000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearWinnerState() {
        const grid = document.getElementById('movie-pool-grid');
        if (!grid) return;
        grid.querySelectorAll('.movie-tile').forEach(t => t.classList.remove('winner', 'dimmed'));
    }

    pickRandomMovieId() {
        if (this.state.data.moviePool.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.state.data.moviePool.length);
        const movie = this.state.data.moviePool[randomIndex];
        return movie.id || randomIndex;
    }

    getTileById(id) {
        return document.querySelector(`#movie-pool-grid .movie-tile[data-id="${id}"]`);
    }

    getPoolEls() {
        const grid = document.getElementById('movie-pool-grid');
        const tiles = grid ? Array.from(grid.querySelectorAll('.movie-tile')) : [];
        return { grid, tiles };
    }

    // Util: focus trap
    trapFocus(container, e) {
        if (e.key !== 'Tab') return;
        const foci = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!foci.length) return;
        const first = foci[0], last = foci[foci.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }

    // Build providers UI from TMDB watch/providers response
    renderProviders(providers) {
        // providers = { flatrate?, rent?, buy? } arrays
        const groups = [
            ['flatrate', 'Included with subscription'],
            ['rent', 'Rent'],
            ['buy', 'Buy']
        ];
        const base = 'https://image.tmdb.org/t/p/w45';
        const parts = groups.map(([key, label]) => {
            const list = providers?.[key];
            if (!Array.isArray(list) || !list.length) return '';
            const items = list.map(p => `
                <div class="provider">
                    ${p.logo_path ? `<img src="${base}${p.logo_path}" alt="${p.provider_name}">` : `<div style="width:24px;height:24px;background:#111;border-radius:4px"></div>`}
                    <span class="label">${p.provider_name}</span>
                </div>
            `).join('');
            return `<div class="provider-group"><h4>${label}</h4><div class="providers">${items}</div></div>`;
        }).join('');
        return parts || `<div class="provider-group"><h4>Availability</h4><div class="providers"><div class="provider"><span class="label">No providers found for your region.</span></div></div></div>`;
    }

    async fetchTmdbProviders(tmdbId, region = 'US') {
        const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_CONFIG.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB providers ${res.status}`);
        const data = await res.json();
        return data?.results?.[region] || {};
    }

    openWinnerModal = async (movie) => {
        // movie should include: { id, title, posterUrl, contributors[], tmdbId }
        const root = document.getElementById('modal-root');
        if (!root) return;

        document.body.classList.add('modal-open');

        // Backdrop + dialog shells
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'winner-title');

        // Initial shell with basic info (providers placeholder)
        dialog.innerHTML = `
            <div class="modal-panel" tabindex="-1">
                <div class="modal-header">
                    <div class="modal-poster">
                        ${movie.posterUrl ? `<img src="${movie.posterUrl}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover">` : ''}
                    </div>
                    <div>
                        <h3 id="winner-title" class="modal-title">${movie.title}</h3>
                        <div class="modal-sub">
                            ${Array.isArray(movie.contributors) && movie.contributors.length ? `Contributed by ${movie.contributors.join(', ')}` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <div id="providers-slot">
                        <div class="provider-group"><h4>Availability</h4><div class="providers"><div class="provider"><span class="label">Loading providers…</span></div></div></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" id="btn-cancel">Cancel</button>
                    <button class="btn btn-primary" id="btn-watch">Mark as Watched</button>
                </div>
            </div>
        `;

        // Mount
        root.appendChild(backdrop);
        root.appendChild(dialog);

        // Open transitions
        requestAnimationFrame(() => {
            backdrop.classList.add('is-open');
            dialog.classList.add('is-open');
            dialog.querySelector('.modal-panel')?.focus();
        });

        // Events: ESC to close, focus trap, backdrop click
        const keyHandler = (e) => {
            if (e.key === 'Escape') close();
            else this.trapFocus(dialog, e);
        };

        const close = () => {
            backdrop.classList.remove('is-open');
            dialog.classList.remove('is-open');
            document.removeEventListener('keydown', keyHandler);

            // Clear spotlight effect when modal closes
            this.clearWinnerState();

            setTimeout(() => {
                backdrop.remove();
                dialog.remove();
                document.body.classList.remove('modal-open');
            }, 200);
        };

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close();
        });
        document.addEventListener('keydown', keyHandler);

        // Buttons
        dialog.querySelector('#btn-cancel')?.addEventListener('click', close);
        dialog.querySelector('#btn-watch')?.addEventListener('click', async () => {
            try {
                // Write to Firebase watched list and remove from pool
                await this.state.movePoolToWatched(movie);
                // Clear spotlight/dim in grid
                this.clearWinnerState?.();
                close();
            } catch (err) {
                console.error('Mark watched failed:', err);
                close();
            }
        });

        // Load providers from TMDB
        try {
            const prov = await this.fetchTmdbProviders(movie.tmdbId || movie.id, this.currentRegion || 'US');
            const slot = dialog.querySelector('#providers-slot');
            if (slot) slot.innerHTML = this.renderProviders(prov);
        } catch (err) {
            const slot = dialog.querySelector('#providers-slot');
            if (slot) slot.innerHTML = `<div class="provider-group"><h4>Availability</h4><div class="providers"><div class="provider"><span class="label">Provider lookup failed.</span></div></div></div>`;
            console.warn(err);
        }
    };

    spotlightWinner = () => {
        try {
            // Reset any prior selection
            this.clearWinnerState();

            // 1) Pick winner from in-memory pool state
            const winnerId = this.pickRandomMovieId();
            if (winnerId === null || winnerId === undefined) {
                console.warn('spotlightWinner: no movies in pool');
                return;
            }

            // 2) Find movie object and tile in DOM
            const movie = this.state.getMovieById(winnerId);
            const winnerTile = this.getTileById(winnerId);
            const { grid, tiles } = this.getPoolEls();
            if (!movie || !winnerTile || !tiles?.length) {
                console.warn('spotlightWinner: winner tile not found', {movie, winnerTile, tilesLength: tiles?.length});
                return;
            }

            // 3) Dim everyone, then un-dim winner and mark as winner
            tiles.forEach(t => t.classList.add('dimmed'));
            winnerTile.classList.remove('dimmed');
            winnerTile.classList.add('winner');

            // 4) Make sure winner is visible (gentle center)
            winnerTile.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

            // 5) Prepare movie data for modal
            const posterUrl = movie.tmdbData?.posterPath ? tmdbPoster(movie.tmdbData.posterPath, 'w342') : null;
            const contributors = movie.suggestedBy.map(contributorId => {
                const contributor = this.state.data.contributors.find(c => c.id === contributorId);
                return contributor ? contributor.name : 'System';
            });

            const modalMovie = {
                id: movie.id || winnerId,
                title: movie.title,
                posterUrl: posterUrl,
                contributors: contributors,
                tmdbId: movie.tmdbData?.id || movie.id,
                // Include full movie object for movePoolToWatched
                ...movie
            };

            console.log('Winner spotlighted:', winnerId);

            // 6) Wait a moment for users to see the spotlight effect, then open modal
            setTimeout(() => {
                this.openWinnerModal(modalMovie);
            }, 1200); // 1.2 second delay to appreciate the spotlight effect
        } catch (e) {
            console.error('spotlightWinner error', e);
        }
    };

    setupEventListeners() {
        // Header buttons
        document.getElementById('shareBtn').addEventListener('click', () => this.shareRoomCode());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoomModal());
        
        // Join Room modal
        document.getElementById('closeJoinRoomModal').addEventListener('click', () => this.hideJoinRoomModal());
        document.getElementById('cancelJoinRoomBtn').addEventListener('click', () => this.hideJoinRoomModal());
        document.getElementById('confirmJoinRoomBtn').addEventListener('click', () => this.joinRoom());
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.hideSettingsModal());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettingsModal());
        
        // Settings actions
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportData());
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('importJsonBtn').addEventListener('click', () => this.importData());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImportFile(e));
        
        // Room management
        document.getElementById('newRoomBtn').addEventListener('click', () => this.showNewRoomModal());
        
        // Contributor management
        document.getElementById('addContributorBtn').addEventListener('click', () => this.showContributorModal());
        document.getElementById('closeContributorModal').addEventListener('click', () => this.hideContributorModal());
        document.getElementById('cancelContributorBtn').addEventListener('click', () => this.hideContributorModal());
        document.getElementById('saveContributorBtn').addEventListener('click', () => this.saveContributor());
        
        // Movie editing
        document.getElementById('closeEditMoviesModal').addEventListener('click', () => this.hideEditMoviesModal());
        document.getElementById('cancelEditMoviesBtn').addEventListener('click', () => this.hideEditMoviesModal());
        document.getElementById('saveMoviesBtn').addEventListener('click', () => this.saveMovies());
        document.getElementById('addMovieInputBtn').addEventListener('click', () => this.addMovieInput());
        
        // Movie selection
        document.getElementById('btn-pick-random').addEventListener('click', () => this.onPickRandomClick());
        
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    renderTile(movie, index) {
        const posterUrl = movie.tmdbData?.posterPath ? tmdbPoster(movie.tmdbData.posterPath, 'w342') : null;

        const contributorChips = movie.suggestedBy.map(contributorId => {
            const contributor = this.state.data.contributors.find(c => c.id === contributorId);
            return contributor ? contributor.name : 'System';
        }).slice(0, 3);

        const contributorChipsHtml = contributorChips.map(name =>
            `<span class="movie-chip">${name}</span>`
        ).join('');

        return `
            <div class="movie-thumbnail-container">
                <div class="movie-tile" data-id="${movie.id || index}" onclick="ui.handleMovieThumbnailClick(${index})">
                    <div class="tile-inner">
                        <div class="tile-front">
                            ${posterUrl
                                ? `<img src="${posterUrl}" alt="${movie.title}">`
                                : `<div class="poster-placeholder">${movie.title}</div>`}
                        </div>
                        <div class="tile-back"></div>
                    </div>
                    <div class="movie-chips">${contributorChipsHtml}</div>
                </div>
                <button class="movie-remove-btn" onclick="ui.removeMovieFromPool(${index})" aria-label="Remove ${movie.title}" title="Remove movie">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
    }

    renderWatchedMovie(movie) {
        // Get contributor names
        const contributorNames = movie.suggestedBy.map(contributorId => {
            const contributor = this.state.data.contributors.find(c => c.id === contributorId);
            return contributor ? contributor.name : 'System';
        });

        return `
            <li class="watched-movie">
                <span class="watched-title">${movie.title}</span>
                <span class="watched-meta">
                    Watched on ${new Date(movie.watchedAt).toLocaleDateString()} • Contributed by ${contributorNames.join(', ')}
                </span>
            </li>
        `;
    }

    render() {
        this.renderTheme();
        this.renderContributors();
        this.renderMoviePool();
        this.renderWatchedMovies();
    }

    renderTheme() {
        const themeTitle = document.getElementById('themeTitle');
        const themeBanner = document.getElementById('themeBanner');
        
        if (this.state.data.theme) {
            themeTitle.textContent = this.state.data.theme;
            
            // Try to add featured poster background from first movie in pool
            const firstMovieWithPoster = this.state.data.moviePool.find(movie => movie.tmdbData?.posterPath);
            if (firstMovieWithPoster) {
                const posterUrl = tmdbPoster(firstMovieWithPoster.tmdbData.posterPath, 'w780');
                themeBanner.style.backgroundImage = `url(${posterUrl})`;
                themeBanner.style.backgroundSize = 'cover';
                themeBanner.style.backgroundPosition = 'center';
            } else {
                themeBanner.style.backgroundImage = '';
            }
        } else {
            themeTitle.textContent = 'Set your theme';
            themeBanner.style.backgroundImage = '';
        }
    }

    renderContributors() {
        const contributorsList = document.getElementById('contributorsList');
        
        if (this.state.data.contributors.length === 0) {
            contributorsList.innerHTML = '<div class="empty-state" style="color: #999; text-align: center; padding: 2rem;">No contributors yet. Add some friends!</div>';
            return;
        }
        
        contributorsList.innerHTML = this.state.data.contributors.map(contributor => {
            const avatarColor = getAvatarColor(contributor.name);
            const initial = contributor.name.trim()[0]?.toUpperCase() || '?';
            const movieCount = contributor.movies.length;
            
            return `
                <div class="contributor-card" onclick="ui.editContributor('${contributor.id}')">
                    <div class="contributor-avatar" style="background-color: ${avatarColor}">${initial}</div>
                    <div class="contributor-info">
                        <div class="contributor-name">${contributor.name}</div>
                        <div class="contributor-count">${movieCount} pick${movieCount === 1 ? '' : 's'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderMoviePool() {
        const movieList = document.getElementById('movie-pool-grid');
        const pickBtn = document.getElementById('btn-pick-random');

        pickBtn.disabled = this.state.data.moviePool.length === 0;

        if (this.state.data.moviePool.length === 0) {
            movieList.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; color: #999; text-align: center; padding: 4rem 2rem;">No movies in pool. Add some movies to get started!</div>';
            return;
        }

        movieList.innerHTML = this.state.data.moviePool.map((movie, index) => {
            return this.renderTile(movie, index);
        }).join('');
    }

    renderWatchedMovies() {
        const watchedList = document.getElementById('watched-movies-list');

        if (this.state.data.watchedMovies.length === 0) {
            watchedList.innerHTML = '';
            // Hide the entire section if no watched movies
            watchedList.parentElement.style.display = 'none';
            return;
        } else {
            watchedList.parentElement.style.display = 'block';
        }

        watchedList.innerHTML = this.state.data.watchedMovies.map((movie) => {
            return this.renderWatchedMovie(movie);
        }).join('');
    }

    // Netflix-style UI helper methods
    handleMovieThumbnailClick(index) {
        // Check if we're on mobile (using a simple viewport width check)
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // On mobile, show removal confirmation modal
            this.showRemoveMovieModal(index);
        } else {
            // On desktop, show movie details
            this.showMovieDetails(index);
        }
    }
    
    showMovieDetails(index) {
        // For now, just show a simple alert - could be expanded to show a detailed modal
        const movie = this.state.data.moviePool[index];
        const contributors = movie.suggestedBy.map(contributorId => {
            const contributor = this.state.data.contributors.find(c => c.id === contributorId);
            return contributor ? contributor.name : 'System';
        }).join(', ');
        
        alert(`${movie.title}\n\nSuggested by: ${contributors}\n\n(Click "Pick Random Movie" to get a proper suggestion)`);
    }
    
    showRemoveMovieModal(index) {
        const movie = this.state.data.moviePool[index];
        
        // Set movie details in modal
        document.getElementById('removeMovieTitle').textContent = movie.title;
        
        // Set poster
        const posterElement = document.getElementById('removeMoviePoster');
        if (movie.tmdbData?.posterPath) {
            const posterUrl = tmdbPoster(movie.tmdbData.posterPath, 'w342');
            posterElement.innerHTML = `<img src="${posterUrl}" alt="${movie.title}">`;
        } else {
            posterElement.innerHTML = `<div class="no-poster">${movie.title}</div>`;
        }
        
        // Set contributors
        const contributors = movie.suggestedBy.map(contributorId => {
            const contributor = this.state.data.contributors.find(c => c.id === contributorId);
            return contributor ? contributor.name : 'System';
        });
        
        const contributorsElement = document.getElementById('removeMovieContributors');
        contributorsElement.innerHTML = contributors.map(name => 
            `<span class="remove-movie-chip">${name}</span>`
        ).join('');
        
        // Set up modal buttons
        document.getElementById('confirmRemoveBtn').onclick = () => {
            this.removeMovieFromPool(index);
            this.hideRemoveMovieModal();
        };
        
        document.getElementById('cancelRemoveBtn').onclick = () => {
            this.hideRemoveMovieModal();
        };
        
        document.getElementById('closeRemoveMovieModal').onclick = () => {
            this.hideRemoveMovieModal();
        };
        
        // Show modal
        document.getElementById('removeMovieModal').classList.add('active');
    }
    
    hideRemoveMovieModal() {
        document.getElementById('removeMovieModal').classList.remove('active');
    }
    
    showWatchedMovieDetails(index) {
        const movie = this.state.data.watchedMovies[index];
        const watchedDate = new Date(movie.watchedAt).toLocaleDateString();
        const canUndo = (Date.now() - movie.watchedAt) < 24 * 60 * 60 * 1000;
        
        const undoText = canUndo ? '\n\n(This was watched recently - you can undo it from the contributor actions)' : '';
        alert(`${movie.title}\n\nWatched on: ${watchedDate}${undoText}`);
    }

    // New Room Modal methods
    showNewRoomModal() {
        // Generate a new room code preview
        const newRoomCode = this.state.generateRoomCode();
        document.getElementById('newRoomCodePreview').textContent = newRoomCode;
        
        // Clear form
        document.getElementById('newRoomTheme').value = '';
        
        // Set up contributor transfer section
        this.renderCurrentContributorsForTransfer();
        
        // Show/hide contributor transfer section based on whether there are contributors
        const transferSection = document.getElementById('contributorTransferSection');
        const hasContributors = this.state.data.contributors.length > 0;
        
        if (hasContributors) {
            transferSection.style.display = 'block';
            document.getElementById('transferContributorsCheckbox').checked = true;
        } else {
            transferSection.style.display = 'none';
        }
        
        // Set up event listeners
        document.getElementById('closeNewRoomModal').onclick = () => this.hideNewRoomModal();
        document.getElementById('cancelNewRoomBtn').onclick = () => this.hideNewRoomModal();
        document.getElementById('createNewRoomBtn').onclick = () => this.createNewRoom();
        
        // Show modal
        document.getElementById('newRoomModal').classList.add('active');
        document.getElementById('newRoomTheme').focus();
    }
    
    hideNewRoomModal() {
        document.getElementById('newRoomModal').classList.remove('active');
    }

    renderCurrentContributorsForTransfer() {
        const contributorsList = document.getElementById('currentContributorsList');
        
        if (this.state.data.contributors.length === 0) {
            contributorsList.innerHTML = '<p style="color: #999; font-size: 0.875rem; margin: 0;">No contributors in current room</p>';
            return;
        }
        
        contributorsList.innerHTML = this.state.data.contributors.map(contributor => {
            const avatarColor = getAvatarColor(contributor.name);
            const initial = contributor.name.trim()[0]?.toUpperCase() || '?';
            
            return `
                <div class="contributor-preview-chip">
                    <div class="contributor-preview-avatar" style="background-color: ${avatarColor}">${initial}</div>
                    ${contributor.name}
                </div>
            `;
        }).join('');
    }
    
    async createNewRoom() {
        const theme = document.getElementById('newRoomTheme').value.trim();
        const transferContributors = document.getElementById('transferContributorsCheckbox').checked;
        const newRoomCode = document.getElementById('newRoomCodePreview').textContent;
        
        if (!theme) {
            alert('Please enter a theme for your new room');
            return;
        }
        
        try {
            // Show loading state
            const createBtn = document.getElementById('createNewRoomBtn');
            const originalText = createBtn.textContent;
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;
            
            // Save contributors to transfer if needed
            let contributorsToTransfer = [];
            if (transferContributors && this.state.data.contributors.length > 0) {
                contributorsToTransfer = this.state.data.contributors.map(c => ({
                    name: c.name,
                    color: getAvatarColor(c.name) // Generate new color
                }));
            }
            
            // Use atomic room creation for better isolation
            await this.state.createRoomAtomic(newRoomCode, theme, contributorsToTransfer);
            
            // Update UI after successful creation
            this.render();
            this.hideNewRoomModal();
            
            // Show success message
            alert(`New room "${theme}" created with code: ${newRoomCode}\n\nYou are now in the new room!`);
            
        } catch (error) {
            console.error('Failed to create new room:', error);
            alert('Failed to create new room. Please try again.');
            
            // Reset button state
            const createBtn = document.getElementById('createNewRoomBtn');
            createBtn.textContent = 'Create Room';
            createBtn.disabled = false;
        }
    }

    showContributorModal() {
        document.getElementById('contributorName').value = '';
        document.getElementById('contributorModal').classList.add('active');
        document.getElementById('contributorName').focus();
    }

    hideContributorModal() {
        document.getElementById('contributorModal').classList.remove('active');
    }

    saveContributor() {
        const name = document.getElementById('contributorName').value.trim();
        
        if (name && name.length <= 30) {
            this.state.addContributor(name);
            this.render();
            this.hideContributorModal();
        }
    }

    editContributor(contributorId) {
        this.currentEditingContributor = contributorId;
        const contributor = this.state.data.contributors.find(c => c.id === contributorId);
        
        if (!contributor) return;
        
        document.getElementById('editContributorName').textContent = contributor.name;
        this.renderMovieInputs(contributor.movies);
        document.getElementById('editMoviesModal').classList.add('active');
    }

    renderMovieInputs(movies = []) {
        const movieInputs = document.getElementById('movieInputs');
        const movieList = [...movies];
        
        // Ensure at least 3 inputs, max 8
        while (movieList.length < 3) movieList.push('');
        if (movieList.length > 8) movieList = movieList.slice(0, 8);
        
        movieInputs.innerHTML = movieList.map((movie, index) => `
            <div class="movie-input-item">
                <input type="text" 
                       value="${movie}" 
                       placeholder="Enter movie title" 
                       maxlength="100"
                       onkeydown="ui.handleMovieInputKeydown(event, ${index})"
                       onkeyup="ui.updateMovieCounter()">
                <button class="remove-movie-btn" onclick="ui.removeMovieInput(${index})" 
                        ${movieList.length <= 3 ? 'disabled' : ''}>×</button>
            </div>
        `).join('');
        
        this.updateMovieCounter();
    }

    addMovieInput() {
        const movieInputs = document.getElementById('movieInputs');
        const currentInputs = movieInputs.querySelectorAll('input');
        
        if (currentInputs.length >= 8) return;
        
        const newIndex = currentInputs.length;
        const newInputHtml = `
            <div class="movie-input-item">
                <input type="text" 
                       value="" 
                       placeholder="Enter movie title" 
                       maxlength="100"
                       onkeydown="ui.handleMovieInputKeydown(event, ${newIndex})"
                       onkeyup="ui.updateMovieCounter()">
                <button class="remove-movie-btn" onclick="ui.removeMovieInput(${newIndex})">×</button>
            </div>
        `;
        
        movieInputs.insertAdjacentHTML('beforeend', newInputHtml);
        this.updateMovieCounter();
        
        // Focus the new input
        const newInput = movieInputs.lastElementChild.querySelector('input');
        newInput.focus();
    }

    removeMovieInput(index) {
        const movieInputs = document.getElementById('movieInputs');
        const inputs = movieInputs.querySelectorAll('.movie-input-item');
        
        if (inputs.length <= 3) return; // Minimum 3 inputs
        
        inputs[index].remove();
        this.updateMovieCounter();
        this.reindexMovieInputs();
    }

    reindexMovieInputs() {
        const movieInputs = document.getElementById('movieInputs');
        const inputs = movieInputs.querySelectorAll('.movie-input-item');
        
        inputs.forEach((item, index) => {
            const input = item.querySelector('input');
            const button = item.querySelector('button');
            
            input.setAttribute('onkeydown', `ui.handleMovieInputKeydown(event, ${index})`);
            button.setAttribute('onclick', `ui.removeMovieInput(${index})`);
            button.disabled = inputs.length <= 3;
        });
    }

    handleMovieInputKeydown(event, index) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const movieInputs = document.getElementById('movieInputs');
            const inputs = movieInputs.querySelectorAll('input');
            
            if (index === inputs.length - 1 && inputs.length < 8) {
                // Add new input if this is the last one and we haven't hit the limit
                this.addMovieInput();
            } else if (index < inputs.length - 1) {
                // Focus next input
                inputs[index + 1].focus();
            }
        }
    }

    updateMovieCounter() {
        const movieInputs = document.getElementById('movieInputs');
        const inputs = movieInputs.querySelectorAll('input');
        const filledInputs = Array.from(inputs).filter(input => input.value.trim()).length;
        
        const counter = document.getElementById('movieCounter');
        counter.textContent = `${filledInputs} movies added`;
        
        // Update counter styling based on count
        counter.className = 'movie-counter';
        if (filledInputs < 3) {
            counter.classList.add('error');
        } else if (filledInputs > 5) {
            counter.classList.add('warning');
        }
    }

    hideEditMoviesModal() {
        document.getElementById('editMoviesModal').classList.remove('active');
        this.currentEditingContributor = null;
    }

    // Settings modal methods
    showSettingsModal() {
        document.getElementById('settingsModal').classList.add('active');
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    async saveMovies() {
        if (!this.currentEditingContributor) return;
        
        const movieInputs = document.getElementById('movieInputs');
        const inputs = movieInputs.querySelectorAll('input');
        const movies = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(title => title.length > 0);
        
        if (movies.length === 0) {
            alert('Please add at least one movie.');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveMoviesBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Adding movies...';
        saveBtn.disabled = true;
        
        try {
            // Add movies instead of replacing
            await this.state.addContributorMovies(this.currentEditingContributor, movies);
            
            this.render();
            this.hideEditMoviesModal();
        } catch (error) {
            console.error('Failed to save movies:', error);
            alert('Failed to add some movies. Please try again.');
        } finally {
            // Restore button
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    removeContributor(contributorId) {
        if (confirm('Remove this contributor and their movies?')) {
            this.state.removeContributor(contributorId);
            this.render();
        }
    }

    pickRandomMovie() {
        // This button is non-functional - clicking does nothing
        return;
    }




    undoWatched(index) {
        const movie = this.state.data.watchedMovies[index];
        if (this.state.undoWatched(movie)) {
            this.render();
        } else {
            alert('Cannot undo - more than 24 hours have passed.');
        }
    }

    removeMovieFromPool(index) {
        const movie = this.state.data.moviePool[index];
        if (movie) {
            this.state.removeMovieFromPool(index);
            this.render();
        }
    }

    shareRoomCode() {
        const roomCode = this.state.roomId || 'No room';
        const shareBtn = document.getElementById('shareBtn');
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(roomCode).then(() => {
                // Update button to show success state
                this.showShareSuccess(shareBtn, 'Room Code Copied ✅');
            }).catch(() => {
                // Fallback: show room code in prompt
                prompt('Share this room code with your friends:', roomCode);
            });
        } else {
            // Fallback: show room code in prompt
            prompt('Share this room code with your friends:', roomCode);
        }
    }

    updateRoomCode(roomId) {
        const roomCodeElement = document.getElementById('roomCode');
        if (roomCodeElement) {
            roomCodeElement.textContent = roomId || '---';
        }
    }

    showJoinRoomModal() {
        document.getElementById('roomCodeInput').value = '';
        document.getElementById('joinRoomModal').classList.add('active');
        document.getElementById('roomCodeInput').focus();
    }

    hideJoinRoomModal() {
        document.getElementById('joinRoomModal').classList.remove('active');
    }

    async joinRoom() {
        const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

        if (!roomCode || roomCode.length < 4 || roomCode.length > 7) {
            alert('Please enter a valid room code (4-7 characters).');
            return;
        }

        const success = await this.state.joinRoom(roomCode);
        
        if (success) {
            this.hideJoinRoomModal();
            // UI will be updated automatically by Firebase listener
        } else {
            alert('Room not found. Please check the room code and try again.');
        }
    }

    showShareSuccess(shareBtn, customMessage = 'Copied ✅') {
        // Store original text and update to success state
        const originalText = shareBtn.textContent;
        shareBtn.textContent = customMessage;
        shareBtn.style.background = 'rgba(39, 174, 96, 0.8)';
        
        // Reset after 2 seconds
        setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.style.background = '';
        }, 2000);
    }

    fallbackShare(url) {
        if (navigator.share) {
            navigator.share({
                title: 'Rec-It-Ralph Movie List',
                text: 'Join our movie selection!',
                url: url
            });
        } else {
            // Final fallback: show the URL in a prompt
            prompt('Share this link with your friends:', url);
        }
    }

    exportData() {
        try {
            const dataStr = JSON.stringify(this.state.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `rec-it-ralph-backup-${timestamp}.json`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    }

    exportCSV() {
        try {
            const csvData = this.generateCSVData();
            const dataBlob = new Blob([csvData], { type: 'text/csv' });
            
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const filename = `rec-it-ralph-backup-${timestamp}.csv`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('CSV export failed:', error);
            alert('Failed to export CSV. Please try again.');
        }
    }

    generateCSVData() {
        const data = this.state.data;
        const exportDate = new Date().toLocaleString();
        const csvRows = [];
        
        // Header section
        csvRows.push(`Theme,${this.escapeCSV(data.theme || 'No theme set')}`);
        csvRows.push(`Export Date,${exportDate}`);
        csvRows.push(`Total Contributors,${data.contributors.length}`);
        csvRows.push(`Total Movies in Pool,${data.moviePool.length}`);
        csvRows.push(`Total Movies Watched,${data.watchedMovies.length}`);
        csvRows.push(''); // Empty row
        
        // Contributors section
        csvRows.push('CONTRIBUTORS');
        csvRows.push('Name,Color');
        data.contributors.forEach(contributor => {
            csvRows.push(`${this.escapeCSV(contributor.name)},${contributor.color}`);
        });
        csvRows.push(''); // Empty row
        
        // Movie pool section
        csvRows.push('MOVIE POOL');
        csvRows.push('Title,Suggested By,Date Added,Status');
        data.moviePool.forEach(movie => {
            const contributors = movie.suggestedBy.map(id => {
                if (id === 'System') return 'System';
                const contributor = data.contributors.find(c => c.id === id);
                return contributor ? contributor.name : 'Unknown';
            }).join('; ');
            
            const dateAdded = new Date(movie.addedAt).toLocaleDateString();
            csvRows.push(`${this.escapeCSV(movie.title)},${this.escapeCSV(contributors)},${dateAdded},In Pool`);
        });
        csvRows.push(''); // Empty row
        
        // Watched movies section
        csvRows.push('WATCHED MOVIES');
        csvRows.push('Title,Originally Suggested By,Watched Date,Picked By');
        data.watchedMovies.forEach(movie => {
            const contributors = movie.suggestedBy.map(id => {
                if (id === 'System') return 'System';
                const contributor = data.contributors.find(c => c.id === id);
                return contributor ? contributor.name : 'Unknown';
            }).join('; ');
            
            const watchedDate = new Date(movie.watchedAt).toLocaleDateString();
            csvRows.push(`${this.escapeCSV(movie.title)},${this.escapeCSV(contributors)},${watchedDate},${this.escapeCSV(movie.pickedBy || 'User')}`);
        });
        
        return csvRows.join('\n');
    }

    escapeCSV(str) {
        if (typeof str !== 'string') return str;
        
        // If string contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    importData() {
        document.getElementById('importFile').click();
    }

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (this.validateImportData(importedData)) {
                    const proceed = confirm(
                        'Import this data? This will replace your current movie list.\n\n' +
                        `Theme: ${importedData.theme || 'None'}\n` +
                        `Contributors: ${importedData.contributors?.length || 0}\n` +
                        `Movies in pool: ${importedData.moviePool?.length || 0}\n` +
                        `Watched movies: ${importedData.watchedMovies?.length || 0}`
                    );
                    
                    if (proceed) {
                        // Merge with default structure to ensure all fields exist
                        this.state.data = { ...this.state.createDefault(), ...importedData };
                        this.state.saveToStorage();
                        this.render();
                        alert('Data imported successfully!');
                    }
                } else {
                    alert('Invalid file format. Please select a valid Rec-It-Ralph backup file.');
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import data. The file may be corrupted or invalid.');
            }
            
            // Reset file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }

    validateImportData(data) {
        // Basic validation to ensure it's a valid Rec-It-Ralph data structure
        return (
            typeof data === 'object' &&
            data !== null &&
            Array.isArray(data.contributors) &&
            Array.isArray(data.moviePool) &&
            Array.isArray(data.watchedMovies) &&
            Array.isArray(data.themeHistory)
        );
    }

    hexToRgb(hex) {
        // Convert hex color to RGB values
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

}

// Initialize the app
let appState, ui;

document.addEventListener('DOMContentLoaded', () => {
    // Guard: Skip v1 UI initialization if running in v2 mode
    if (window.RECITRALPH_V2_MODE) return;

    appState = new AppState();
    ui = new UIController(appState);
    
    // Set window.ui immediately for Firebase callbacks
    window.ui = ui;
    
    // Make appState available globally for console access
    window.appState = appState;
    
    // Add global function to refresh thumbnails
    window.refreshThumbnails = () => {
        console.log('Starting thumbnail refresh...');
        appState.refreshAllMovieThumbnails();
    };
    
    console.log('App initialized - refreshThumbnails() function is now available');
    
    // Check if there's a pending room code update from Firebase
    if (appState.pendingRoomCodeUpdate) {
        ui.updateRoomCode(appState.pendingRoomCodeUpdate);
        appState.pendingRoomCodeUpdate = null;
    }
    
    // If Firebase already completed and set roomId, update room code
    if (appState.isReady && appState.roomId) {
        ui.updateRoomCode(appState.roomId);
        ui.render();
    }
});