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
        this.isFirebaseMode = window.database !== null;
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
        
        this.data.contributors.push(contributor);
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
        const normalizedTitle = this.normalizeTitle(title);
        const originalTitle = title.trim();
        
        // Check if movie already exists in pool
        let existingMovie = this.data.moviePool.find(m => 
            this.normalizeTitle(m.title) === normalizedTitle
        );
        
        if (existingMovie) {
            // Add contributor to existing movie if not already there
            if (!existingMovie.suggestedBy.includes(contributorId)) {
                existingMovie.suggestedBy.push(contributorId);
            }
            // Move existing movie to top of pool
            const movieIndex = this.data.moviePool.indexOf(existingMovie);
            if (movieIndex > 0) {
                this.data.moviePool.splice(movieIndex, 1);
                this.data.moviePool.unshift(existingMovie);
            }
        } else {
            // Create new movie and add to top of pool
            const movie = {
                title: originalTitle,
                originalTitle: originalTitle,
                suggestedBy: [contributorId],
                isAutoAdded: false,
                addedAt: Date.now(),
                tmdbData: null
            };
            
            this.data.moviePool.unshift(movie); // Add to beginning instead of end
            
            // Fetch TMDB data asynchronously
            if (window.ui && window.ui.tmdbService) {
                window.ui.tmdbService.getMovieData(originalTitle).then(tmdbData => {
                    if (tmdbData) {
                        console.log('TMDB: Adding tmdbData to movie:', originalTitle, tmdbData);
                        
                        // Find the movie in the pool and update it directly
                        const movieInPool = this.data.moviePool.find(m => m.title === movie.title && m.addedAt === movie.addedAt);
                        console.log('TMDB: Movie found in pool:', movieInPool ? 'YES' : 'NO');
                        
                        if (movieInPool) {
                            movieInPool.tmdbData = tmdbData;
                            console.log('TMDB: Updated movie in pool with tmdbData');
                            console.log('TMDB: Movie in pool now has tmdbData:', movieInPool.tmdbData ? 'YES' : 'NO');
                            
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
            }
        }
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
                this.setupFirebaseListener(false);
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
                this.setupFirebaseListener(false);
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
        
        // Move back to pool
        const movie = {
            title: watchedMovie.title,
            originalTitle: watchedMovie.title,
            suggestedBy: watchedMovie.suggestedBy,
            isAutoAdded: false,
            addedAt: Date.now()
        };
        
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
        this.setupFirebaseListener();
        
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
            this.setupFirebaseListener();
            
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
        if (this.firebaseRef && this.isFirebaseMode) {
            this.data.lastModified = Date.now();
            
            // Debug: Check if TMDB data exists in what we're saving
            const moviesWithTmdb = this.data.moviePool.filter(m => m.tmdbData);
            console.log('TMDB: Saving to Firebase -', moviesWithTmdb.length, 'movies have TMDB data');
            if (moviesWithTmdb.length > 0) {
                console.log('TMDB: Movies with TMDB data:', moviesWithTmdb.map(m => m.title));
            }
            
            this.firebaseRef.set(this.data).catch(error => {
                console.error('Failed to save to Firebase:', error);
            });
        }
    }

    // Override save method to use Firebase when available
    save() {
        if (this.isFirebaseMode) {
            this.saveToFirebase();
        } else {
            // Use debounced save for localStorage
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveToStorage(), 1000);
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
        document.getElementById('pickRandomBtn').addEventListener('click', () => this.pickRandomMovie());
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
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
        const movieList = document.getElementById('movieList');
        const pickBtn = document.getElementById('pickRandomBtn');
        
        pickBtn.disabled = this.state.data.moviePool.length === 0;
        
        if (this.state.data.moviePool.length === 0) {
            movieList.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; color: #999; text-align: center; padding: 4rem 2rem;">No movies in pool. Add some movies to get started!</div>';
            return;
        }
        
        movieList.innerHTML = this.state.data.moviePool.map((movie, index) => {
            // Get contributor chips
            const contributorChips = movie.suggestedBy.map(contributorId => {
                const contributor = this.state.data.contributors.find(c => c.id === contributorId);
                return contributor ? contributor.name : 'System';
            }).slice(0, 3); // Limit to 3 contributors
            
            // Generate poster URL
            const posterUrl = movie.tmdbData?.posterPath ? tmdbPoster(movie.tmdbData.posterPath, 'w342') : null;
            
            const contributorChipsHtml = contributorChips.map(name => 
                `<span class="movie-chip">${name}</span>`
            ).join('');
            
            return `
                <div class="movie-thumbnail-container">
                    <button class="movie-thumbnail" onclick="ui.handleMovieThumbnailClick(${index})" aria-label="View ${movie.title}">
                        ${posterUrl ? 
                            `<img src="${posterUrl}" alt="" class="movie-poster-img">` :
                            `<div class="movie-title-overlay">${movie.title}</div>`
                        }
                        <div class="movie-chips">${contributorChipsHtml}</div>
                    </button>
                    <button class="movie-remove-btn" onclick="ui.removeMovieFromPool(${index})" aria-label="Remove ${movie.title}" title="Remove movie">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderWatchedMovies() {
        const watchedList = document.getElementById('watchedList');
        
        if (this.state.data.watchedMovies.length === 0) {
            watchedList.innerHTML = '';
            // Hide the entire section if no watched movies
            watchedList.parentElement.style.display = 'none';
            return;
        } else {
            watchedList.parentElement.style.display = 'block';
        }
        
        watchedList.innerHTML = this.state.data.watchedMovies.map((movie, index) => {
            const posterUrl = movie.tmdbData?.posterPath ? tmdbPoster(movie.tmdbData.posterPath, 'w342') : null;
            
            return `
                <div class="watched-item">
                    <button class="movie-thumbnail" onclick="ui.showWatchedMovieDetails(${index})" aria-label="View ${movie.title}">
                        ${posterUrl ? 
                            `<img src="${posterUrl}" alt="" class="movie-poster-img">` :
                            `<div class="movie-title-overlay">${movie.title}</div>`
                        }
                    </button>
                </div>
            `;
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
        const newRoomCode = this.generateRoomCode();
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
        const movie = this.state.pickRandomMovie();
        if (movie) {
            this.showSuggestionModal(movie);
        }
    }

    async showSuggestionModal(movie) {
        document.getElementById('suggestedMovie').textContent = movie.title;
        
        const contributorNames = movie.suggestedBy.map(id => {
            const contributor = this.state.data.contributors.find(c => c.id === id);
            return contributor ? contributor.name : 'Unknown';
        }).join(', ');
        
        // Display contributors as chips
        const contributorChips = movie.suggestedBy.map(id => {
            const contributor = this.state.data.contributors.find(c => c.id === id);
            const name = contributor ? contributor.name : 'Unknown';
            return `<span class="text-[11px] uppercase tracking-wide bg-white/90 text-black px-2 py-0.5 rounded">${name}</span>`;
        }).join('');
        
        document.getElementById('suggestedBy').innerHTML = contributorChips ? 
            `<div class="flex flex-wrap gap-2">${contributorChips}</div>` : '';
        
        // Display movie poster
        const posterElement = document.getElementById('moviePoster');
        if (movie.tmdbData?.posterPath) {
            const posterUrl = tmdbPoster(movie.tmdbData.posterPath, 'w500');
            posterElement.innerHTML = `<img src="${posterUrl}" alt="" class="w-full h-full object-cover">`;
        } else {
            posterElement.innerHTML = `<div class="w-full h-full grid place-items-center text-neutral-300 text-sm p-3">${movie.title}</div>`;
        }
        
        // Show loading state for streaming providers
        this.showStreamingProviders({ loading: true });
        
        // Sequel detection
        const sequelCheck = this.sequelDetector.detectSequel(movie.title);
        this.setupSequelWarning(sequelCheck, movie);
        
        // Set up modal buttons
        document.getElementById('acceptBtn').onclick = () => {
            this.state.acceptMovie(movie);
            this.render();
            this.hideSuggestionModal();
        };
        
        document.getElementById('rerollBtn').onclick = () => {
            this.hideSuggestionModal();
            setTimeout(() => this.pickRandomMovie(), 100);
        };
        
        document.getElementById('rejectBtn').onclick = () => {
            this.hideSuggestionModal();
        };
        
        document.getElementById('suggestionModal').classList.add('active');
        
        // Add ESC key handler
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                this.hideSuggestionModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
        // Fetch streaming providers asynchronously
        try {
            const tmdbData = await this.tmdbService.getMovieWithProviders(movie.title);
            this.showStreamingProviders(tmdbData);
        } catch (error) {
            console.error('Failed to fetch streaming providers:', error);
            this.showStreamingProviders({ error: true });
        }
    }

    showStreamingProviders(tmdbData) {
        const streamingContainer = document.getElementById('streamingProviders');
        if (!streamingContainer) return;
        
        if (tmdbData?.loading) {
            streamingContainer.innerHTML = `
                <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                    <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-3">🎬 Where to Watch</h4>
                    <div class="text-center py-2 text-neutral-400 text-sm">Loading streaming options...</div>
                </div>
            `;
            return;
        }
        
        if (tmdbData?.error || !tmdbData) {
            streamingContainer.innerHTML = `
                <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                    <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-3">🎬 Where to Watch</h4>
                    <div class="text-center py-2 text-red-400 text-sm">Unable to fetch streaming information</div>
                </div>
            `;
            return;
        }
        
        const { movie, providers } = tmdbData;
        
        // Focus on US providers (can be made configurable later)
        const usProviders = providers.US;
        
        if (!usProviders || (!usProviders.flatrate && !usProviders.buy && !usProviders.rent)) {
            streamingContainer.innerHTML = `
                <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                    <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-3">🎬 Where to Watch</h4>
                    <div class="text-center py-2 text-neutral-400 text-sm">No streaming options found in the US</div>
                    <div class="text-center pt-2 border-t border-white/10 text-xs text-neutral-500">Data provided by <strong>JustWatch</strong></div>
                </div>
            `;
            return;
        }
        
        let providersHtml = '';
        
        // Streaming services (free with subscription)
        if (usProviders.flatrate && usProviders.flatrate.length > 0) {
            const streamingHtml = usProviders.flatrate.map(provider => `
                <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm" title="${provider.provider_name}">
                    <img src="${TMDB_CONFIG.imageBaseUrl}${provider.logo_path}" 
                         alt="${provider.provider_name}" 
                         class="w-5 h-5 rounded object-cover">
                    <span class="text-white font-medium">${provider.provider_name}</span>
                </div>
            `).join('');
            
            providersHtml += `
                <div class="mb-3">
                    <div class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">📺 Stream</div>
                    <div class="flex flex-wrap gap-2">${streamingHtml}</div>
                </div>
            `;
        }
        
        // Rental services
        if (usProviders.rent && usProviders.rent.length > 0) {
            const rentalHtml = usProviders.rent.slice(0, 4).map(provider => `
                <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm" title="${provider.provider_name}">
                    <img src="${TMDB_CONFIG.imageBaseUrl}${provider.logo_path}" 
                         alt="${provider.provider_name}" 
                         class="w-5 h-5 rounded object-cover">
                    <span class="text-white font-medium">${provider.provider_name}</span>
                </div>
            `).join('');
            
            providersHtml += `
                <div class="mb-3">
                    <div class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">💰 Rent</div>
                    <div class="flex flex-wrap gap-2">${rentalHtml}</div>
                </div>
            `;
        }
        
        // Purchase services
        if (usProviders.buy && usProviders.buy.length > 0) {
            const buyHtml = usProviders.buy.slice(0, 4).map(provider => `
                <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm" title="${provider.provider_name}">
                    <img src="${TMDB_CONFIG.imageBaseUrl}${provider.logo_path}" 
                         alt="${provider.provider_name}" 
                         class="w-5 h-5 rounded object-cover">
                    <span class="text-white font-medium">${provider.provider_name}</span>
                </div>
            `).join('');
            
            providersHtml += `
                <div class="mb-3">
                    <div class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">🛒 Buy</div>
                    <div class="flex flex-wrap gap-2">${buyHtml}</div>
                </div>
            `;
        }
        
        streamingContainer.innerHTML = `
            <div class="rounded-xl bg-white/5 border border-white/10 p-3">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-3">🎬 Where to Watch</h4>
                <div class="space-y-1">
                    ${providersHtml}
                </div>
                <div class="text-center pt-2 mt-3 border-t border-white/10 text-xs text-neutral-500">Data provided by <strong>JustWatch</strong></div>
            </div>
        `;
    }

    setupSequelWarning(sequelCheck, originalMovie) {
        const sequelWarning = document.getElementById('sequelWarning');
        const suggestionFooter = document.getElementById('suggestionFooter');
        const sequelFooter = document.getElementById('sequelFooter');
        
        if (sequelCheck.isSequel) {
            // Show sequel warning
            sequelWarning.innerHTML = `
                <div class="mt-1 p-3 bg-amber-900/30 border border-amber-600/40 rounded-lg">
                    <h4 class="text-amber-300 font-semibold mb-2">⚠️ Sequel Warning</h4>
                    <p class="text-sm text-amber-100 mb-1">This looks like a sequel: <strong>${originalMovie.title}</strong></p>
                    <p class="text-xs text-amber-200">Start with <strong>${sequelCheck.suggestedTitle}</strong> instead?</p>
                </div>
            `;
            sequelWarning.style.display = 'block';
            suggestionFooter.style.display = 'none';
            sequelFooter.style.display = 'flex';
            
            // Set up sequel buttons
            document.getElementById('watchFirstBtn').onclick = () => {
                this.watchFirst(sequelCheck.suggestedTitle, originalMovie);
            };
            
            document.getElementById('proceedAnywayBtn').onclick = () => {
                this.state.acceptMovie(originalMovie);
                this.render();
                this.hideSuggestionModal();
            };
            
            document.getElementById('cancelSequelBtn').onclick = () => {
                this.hideSuggestionModal();
            };
        } else {
            // No sequel detected, show normal buttons
            sequelWarning.style.display = 'none';
            suggestionFooter.style.display = 'flex';
            sequelFooter.style.display = 'none';
        }
    }

    watchFirst(firstMovieTitle, originalMovie) {
        // Check if first movie is already in pool or watched
        const firstMovieInPool = this.state.data.moviePool.find(movie => 
            this.state.normalizeTitle(movie.title) === this.state.normalizeTitle(firstMovieTitle)
        );
        
        const firstMovieWatched = this.state.data.watchedMovies.find(movie =>
            this.state.normalizeTitle(movie.title) === this.state.normalizeTitle(firstMovieTitle)
        );
        
        if (firstMovieWatched) {
            // First movie already watched, proceed with sequel
            alert(`You've already watched "${firstMovieTitle}". Proceeding with the sequel.`);
            this.state.acceptMovie(originalMovie);
            this.render();
            this.hideSuggestionModal();
        } else if (firstMovieInPool) {
            // First movie is in pool, suggest it instead
            this.hideSuggestionModal();
            setTimeout(() => this.showSuggestionModal(firstMovieInPool), 100);
        } else {
            // Add first movie to pool and suggest it
            const autoMovie = {
                title: firstMovieTitle,
                originalTitle: firstMovieTitle,
                suggestedBy: ['System'],
                isAutoAdded: true,
                addedAt: Date.now(),
                tmdbData: null
            };
            
            // Add movie first, then fetch TMDB data
            this.state.data.moviePool.push(autoMovie);
            this.state.save();
            
            // Fetch TMDB data asynchronously
            this.tmdbService.getMovieData(firstMovieTitle).then(tmdbData => {
                if (tmdbData) {
                    autoMovie.tmdbData = tmdbData;
                    this.state.save();
                    this.render();
                }
            }).catch(error => {
                console.warn('Failed to fetch TMDB data for auto-added movie:', firstMovieTitle, error);
            });
            
            this.render();
            this.hideSuggestionModal();
            setTimeout(() => this.showSuggestionModal(autoMovie), 100);
        }
    }

    hideSuggestionModal() {
        document.getElementById('suggestionModal').classList.remove('active');
        // Reset footer display
        document.getElementById('suggestionFooter').style.display = 'flex';
        document.getElementById('sequelFooter').style.display = 'none';
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
        
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-character room code.');
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