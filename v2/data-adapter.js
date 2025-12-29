/**
 * Data Adapter Layer (Phase 1a - Fixed)
 * Wraps v1 AppState to provide a clean API for v2 screens
 * All v2 screens must use this adapter - DO NOT access window.appState directly
 */
class DataAdapter {
  constructor() {
    this.state = null;
    this.tmdb = null;
    this._readyResolve = null;

    // Firebase listener management (event-driven, no polling)
    this._activeListener = null; // { roomCode, ref, handler }
    this._roomCallbacks = new Map(); // roomCode -> Set of callbacks

    // Namespaced localStorage key for v2 room history
    this.V2_STORAGE_KEY = 'recitralph:v2:rooms';

    // Promise that resolves when adapter is ready
    this.readyPromise = new Promise((resolve) => {
      this._readyResolve = resolve;
    });

    this._initialize();
  }

  _initialize() {
    // Wait for DOM to be ready, then create AppState
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this._setupState();
      });
    } else {
      this._setupState();
    }
  }

  _setupState() {
    try {
      // In v2 mode, app.js won't create AppState due to guard
      // We must create it ourselves
      console.log('[V2 Adapter - checkpoint 6] Before creating AppState:', {
        hasFirebase: !!window.firebase,
        hasDatabase: !!window.database,
        firebaseType: typeof window.firebase,
        databaseType: typeof window.database,
        hasAppStateClass: typeof AppState !== 'undefined'
      });
      console.log('[V2 Adapter] Creating AppState instance');
      this.state = new AppState();

      // Create TMDB service (normally created by UIController)
      console.log('[V2 Adapter] Creating TMDBService instance');
      this.tmdb = new TMDBService();

      // CRITICAL: Clean up any v1 Firebase listeners from previous navigation
      // If user previously loaded v1 (/) then navigated to v2 (/v2/),
      // AppState may have an active firebaseRef with listeners attached
      this._cleanupV1Listeners();

      // Expose globally for debugging only
      window.appState = this.state;
      window.tmdbService = this.tmdb;

      console.log('[V2 Adapter] Initialized successfully');

      // Resolve the ready promise
      this._readyResolve();

    } catch (error) {
      console.error('[V2 Adapter] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Clean up any v1 Firebase listeners that may exist from previous navigation
   * Prevents memory leaks when navigating from v1 → v2 without page reload
   * @private
   */
  _cleanupV1Listeners() {
    if (this.state.firebaseRef) {
      console.log('[V2 Adapter] Cleaning up v1 Firebase listener from previous navigation');

      // Detach all listeners on this ref
      this.state.firebaseRef.off();

      // Null out the ref to prevent confusion
      this.state.firebaseRef = null;
      this.state.roomId = null;

      console.log('[V2 Adapter] v1 listener cleanup complete');
    } else {
      console.log('[V2 Adapter] No v1 listeners to clean up');
    }
  }

  // ============================================================
  // ROOM MANAGEMENT
  // ============================================================

  /**
   * Create a new room with a theme
   * @param {string} theme - Room theme (e.g. "Horror Movies")
   * @returns {Promise<string>} - Room code
   */
  async createRoom(theme) {
    const roomCode = this._generateRoomCode();
    let methodUsed = 'unknown';

    try {
      // Feature detection with fallback to find the right v1 method
      if (this.state.isFirebaseMode) {
        // Try atomic creation first (preferred method)
        if (typeof this.state.createRoomAtomic === 'function') {
          methodUsed = 'createRoomAtomic';
          await this.state.createRoomAtomic(roomCode, theme, []);
        }
        // Fallback to createNewRoom with parameters
        else if (typeof this.state.createNewRoom === 'function') {
          methodUsed = 'createNewRoom';
          await this.state.createNewRoom(roomCode, theme, []);
        }
        // Last resort: throw error with available methods
        else {
          const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.state))
            .filter(m => m.toLowerCase().includes('room') && typeof this.state[m] === 'function');
          throw new Error(`No valid room creation method found. Available methods: ${availableMethods.join(', ')}`);
        }
      } else {
        // Local mode fallback
        if (typeof this.state.createNewRoom === 'function') {
          methodUsed = 'createNewRoom';
          await this.state.createNewRoom(roomCode, theme, []);
        } else {
          throw new Error('createNewRoom not available in local mode');
        }
      }

      // Get the actual room code from AppState (should match our generated code)
      const actualRoomCode = this.state.roomId || roomCode;

      // Verify room was created successfully
      if (!this.state.roomId) {
        console.warn(`[V2 Adapter] Room creation may have failed - roomId not set in AppState`);
      } else if (this.state.roomId !== roomCode) {
        console.warn(`[V2 Adapter] Room code mismatch - expected ${roomCode}, got ${this.state.roomId}`);
      }

      // Add to v2 room history
      this._addToRoomHistory(actualRoomCode, theme);

      console.log(`[V2 Adapter] Created room ${actualRoomCode} theme="${theme}" via ${methodUsed}`);
      return actualRoomCode;

    } catch (error) {
      console.error('[V2 Adapter] Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Join an existing room by code
   * @param {string} roomCode - Room code to join
   * @returns {Promise<boolean>} - Success status
   */
  async joinRoom(roomCode) {
    console.log(`[V2 Adapter] Joining room: ${roomCode}`);

    try {
      const success = await this.state.joinRoom(roomCode);

      if (success) {
        // Add to v2 room history
        const theme = this.state.data.theme || 'Unknown Theme';
        this._addToRoomHistory(roomCode, theme);

        console.log(`[V2 Adapter] Joined room successfully: ${roomCode}`);
      } else {
        console.warn(`[V2 Adapter] Failed to join room: ${roomCode}`);
      }

      return success;

    } catch (error) {
      console.error('[V2 Adapter] Error joining room:', error);
      return false;
    }
  }

  /**
   * Set the current room (for switching between rooms)
   * @param {string} roomCode - Room code to switch to
   */
  async setCurrentRoom(roomCode) {
    return await this.joinRoom(roomCode);
  }

  /**
   * Subscribe to room updates (Firebase real-time listener)
   * EVENT-DRIVEN - No polling, uses Firebase RTDB listeners directly
   *
   * @param {string} roomCode - Room code to subscribe to
   * @param {Function} callback - Called with room data on updates: callback(roomData)
   * @returns {Function} - Unsubscribe function
   */
  subscribeRoom(roomCode, callback) {
    console.log(`[V2 Adapter] Subscribing to room: ${roomCode}`);

    // Add callback to the set for this room
    if (!this._roomCallbacks.has(roomCode)) {
      this._roomCallbacks.set(roomCode, new Set());
    }
    this._roomCallbacks.get(roomCode).add(callback);

    // Set up Firebase listener if not already active for this room
    if (!this._activeListener || this._activeListener.roomCode !== roomCode) {
      this._setupFirebaseListener(roomCode);
    } else {
      // Listener already active, just do initial callback with current data
      if (this.state.roomId === roomCode && this.state.data) {
        callback(this.state.data);
      }
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this._roomCallbacks.get(roomCode);
      if (callbacks) {
        callbacks.delete(callback);

        // If no more callbacks for this room, clean up
        if (callbacks.size === 0) {
          this._roomCallbacks.delete(roomCode);

          // If this was the active listener, detach it
          if (this._activeListener?.roomCode === roomCode) {
            this._detachFirebaseListener();
          }
        }
      }
    };
  }

  /**
   * Set up Firebase RTDB listener for a room (event-driven)
   * @private
   */
  _setupFirebaseListener(roomCode) {
    // Detach any existing listener first
    this._detachFirebaseListener();

    // Check if Firebase is available
    if (!this.state.isFirebaseMode || !window.database) {
      console.warn('[V2 Adapter] Cannot subscribe: Firebase not available');
      return;
    }

    // Create Firebase reference
    const ref = window.database.ref(`rooms/${roomCode}`);

    // Create handler that fans out to all callbacks
    const handler = (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();

        // Merge with defaults to ensure arrays exist
        const mergedData = this.state.mergeWithDefaults(rawData);

        // Update local AppState data (merged, not raw)
        this.state.data = mergedData;
        this.state.roomId = roomCode;

        // Fan out to all callbacks registered for this room
        // IMPORTANT: Send merged data (not raw) to callbacks
        const callbacks = this._roomCallbacks.get(roomCode);
        if (callbacks && callbacks.size > 0) {
          callbacks.forEach(cb => {
            try {
              cb(mergedData);
            } catch (error) {
              console.error('[V2 Adapter] Error in subscribeRoom callback:', error);
            }
          });
        }
      }
    };

    // Attach Firebase listener
    ref.on('value', handler);

    // Store active listener info
    this._activeListener = { roomCode, ref, handler };

    console.log(`[V2 Adapter] Firebase listener attached for room: ${roomCode}`);
  }

  /**
   * Detach active Firebase listener
   * @private
   */
  _detachFirebaseListener() {
    if (this._activeListener) {
      const { ref, handler, roomCode } = this._activeListener;

      // Detach Firebase listener
      ref.off('value', handler);

      this._activeListener = null;

      console.log(`[V2 Adapter] Firebase listener detached for room: ${roomCode}`);
    }
  }

  /**
   * Get current room code
   * @returns {string|null}
   */
  getRoomCode() {
    return this.state?.roomId || null;
  }

  /**
   * Get current room data (full state object)
   * @returns {Object}
   */
  getRoomData() {
    return this.state?.data || null;
  }

  /**
   * Get room theme
   * @returns {string}
   */
  getTheme() {
    return this.state?.data?.theme || '';
  }

  // ============================================================
  // CONTRIBUTOR MANAGEMENT
  // ============================================================

  /**
   * Add a contributor to the current room
   * @param {string} name - Contributor name
   * @returns {Object} - Contributor object
   */
  addContributor(name) {
    console.log(`[V2 Adapter] Adding contributor: ${name}`);
    const contributor = this.state.addContributor(name);
    return contributor;
  }

  /**
   * Get all contributors in current room
   * @returns {Array}
   */
  getContributors() {
    return this.state?.data?.contributors || [];
  }

  /**
   * Remove a contributor
   * @param {string} contributorId
   */
  removeContributor(contributorId) {
    console.log(`[V2 Adapter] Removing contributor: ${contributorId}`);
    this.state.removeContributor(contributorId);
  }

  // ============================================================
  // MOVIE MANAGEMENT
  // ============================================================

  /**
   * Add a movie to the pool
   * @param {string} contributorId - ID of contributor adding the movie
   * @param {string} title - Movie title
   * @returns {Promise<Object>} - Movie object with TMDB data
   */
  async addMovie(contributorId, title) {
    console.log(`[V2 Adapter] Adding movie: ${title} by contributor: ${contributorId}`);
    const movie = await this.state.addMovieToPool(contributorId, title);
    return movie;
  }

  /**
   * Get all movies in the pool
   * @returns {Array}
   */
  getMoviePool() {
    return this.state?.data?.moviePool || [];
  }

  /**
   * Remove a movie from the pool
   * @param {number} movieIndex - Index in moviePool array
   */
  removeMovie(movieIndex) {
    console.log(`[V2 Adapter] Removing movie at index: ${movieIndex}`);
    this.state.removeMovieFromPool(movieIndex);
  }

  /**
   * Pick a random movie from the pool
   * @returns {Object|null} - Random movie object
   */
  pickRandomMovie() {
    console.log('[V2 Adapter] Picking random movie');
    const movie = this.state.pickRandomMovie();
    return movie;
  }

  /**
   * Mark a movie as watched (moves from pool to watched list)
   * @param {Object} movie - Movie object to mark as watched
   * @returns {Promise<void>}
   */
  async markWatched(movie) {
    console.log(`[V2 Adapter] Marking movie as watched: ${movie.title}`);
    await this.state.movePoolToWatched(movie);
  }

  /**
   * Get all watched movies
   * @returns {Array}
   */
  getWatchedMovies() {
    return this.state?.data?.watchedMovies || [];
  }

  /**
   * Undo a watched movie (move back to pool)
   * Wraps v1 AppState.undoWatched (24-hour time limit)
   * @param {Object} watchedMovie - Watched movie object
   * @returns {boolean} - Success (only works within 24 hours)
   */
  undoWatched(watchedMovie) {
    console.log(`[V2 Adapter] Undoing watched movie: ${watchedMovie.title}`);
    return this.state.undoWatched(watchedMovie);
  }

  // ============================================================
  // TMDB INTEGRATION
  // ============================================================

  /**
   * Search for a movie using TMDB
   * @param {string} title - Movie title to search
   * @returns {Promise<Object>} - TMDB search result
   */
  async searchMovie(title) {
    console.log(`[V2 Adapter] Searching TMDB for: ${title}`);
    return await this.tmdb.searchMovie(title);
  }

  /**
   * Get streaming providers for a movie
   * @param {number} movieId - TMDB movie ID
   * @returns {Promise<Object>} - Watch providers data
   */
  async getProviders(movieId) {
    console.log(`[V2 Adapter] Fetching providers for movie ID: ${movieId}`);
    return await this.tmdb.getWatchProviders(movieId);
  }

  // ============================================================
  // V2 ROOM HISTORY (NAMESPACED LOCALSTORAGE)
  // ============================================================

  /**
   * Get v2 room history from namespaced localStorage
   * @returns {Array} - Array of {roomCode, theme, lastVisited, createdAt}
   */
  getRoomHistory() {
    try {
      const stored = localStorage.getItem(this.V2_STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];

    } catch (error) {
      console.error('[V2 Adapter] Failed to load room history:', error);
      return [];
    }
  }

  /**
   * Add a room to v2 history
   * @private
   */
  _addToRoomHistory(roomCode, theme) {
    try {
      const history = this.getRoomHistory();

      // Check if room already exists
      const existingIndex = history.findIndex(r => r.roomCode === roomCode);

      if (existingIndex >= 0) {
        // Update existing entry
        history[existingIndex].theme = theme;
        history[existingIndex].lastVisited = Date.now();
      } else {
        // Add new entry
        history.unshift({
          roomCode,
          theme,
          lastVisited: Date.now(),
          createdAt: Date.now()
        });
      }

      // Keep only last 20 rooms
      const trimmed = history.slice(0, 20);

      localStorage.setItem(this.V2_STORAGE_KEY, JSON.stringify(trimmed));

    } catch (error) {
      console.error('[V2 Adapter] Failed to save room history:', error);
    }
  }

  /**
   * Clear v2 room history
   */
  clearRoomHistory() {
    localStorage.removeItem(this.V2_STORAGE_KEY);
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Generate a random room code
   * @private
   */
  _generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Check if adapter is ready
   * @returns {boolean}
   */
  isReady() {
    return this.state !== null && this.tmdb !== null;
  }

  /**
   * Get diagnostics info for debugging
   * @returns {Object}
   */
  getDiagnostics() {
    return {
      ready: this.isReady(),
      roomCode: this.getRoomCode(),
      theme: this.getTheme(),
      contributorsCount: this.getContributors().length,
      moviePoolCount: this.getMoviePool().length,
      watchedCount: this.getWatchedMovies().length,
      isFirebaseMode: this.state?.isFirebaseMode || false,
      roomHistoryCount: this.getRoomHistory().length,
      // Firebase listener verification (v2 mode)
      hasActiveListener: this._activeListener !== null,
      activeListenerRoom: this._activeListener?.roomCode || null,
      subscriberCount: this._roomCallbacks.size,
      totalCallbacks: Array.from(this._roomCallbacks.values())
        .reduce((sum, set) => sum + set.size, 0),
      // V2 Mode Verification
      isV2Mode: window.RECITRALPH_V2_MODE === true,
      appStateHasRef: this.state?.firebaseRef !== null && this.state?.firebaseRef !== undefined,
      listenerVerification: this._verifyListenerState()
    };
  }

  /**
   * Verify listener state for diagnostics
   * Note: appStateHasRef means firebaseRef exists, not necessarily that a listener is attached
   * @private
   */
  _verifyListenerState() {
    const v2Mode = window.RECITRALPH_V2_MODE === true;
    const adapterHasListener = this._activeListener !== null;
    const appStateHasRef = this.state?.firebaseRef !== null && this.state?.firebaseRef !== undefined;

    if (v2Mode) {
      // In v2 mode: Adapter should have listener, AppState should have NO ref
      if (adapterHasListener && !appStateHasRef) {
        return '✓ v2: Adapter listener active, AppState ref cleaned';
      } else if (!adapterHasListener && !appStateHasRef) {
        return '⚠️ v2: No active listener';
      } else if (adapterHasListener && appStateHasRef) {
        return '❌ LEAK: Adapter listener active but AppState ref exists!';
      } else {
        return '❌ v2: No Adapter listener but AppState ref exists!';
      }
    } else {
      // In v1 mode: AppState should have ref, Adapter should NOT have listener
      if (appStateHasRef && !adapterHasListener) {
        return '✓ v1: AppState ref exists, Adapter inactive';
      } else {
        return '⚠️ v1: Unexpected state';
      }
    }
  }
}

// Global instance
window.v2Adapter = new DataAdapter();
