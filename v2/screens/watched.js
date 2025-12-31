class WatchedScreen {
  constructor() {
    this.container = null;
    this.adapter = null;
    this.appShell = null;
    this.unsubscribe = null;
    this.subscribedRoomCode = null;
    this.undoError = null; // Store error message for inline display
  }

  render(adapter) {
    const roomCode = adapter.getRoomCode();
    const watchedMovies = adapter.getWatchedMovies();
    const contributors = adapter.getContributors();

    // State A: No room joined
    if (!roomCode) {
      return this.renderNoRoom();
    }

    // State B: Room joined, watchedMovies empty
    if (!watchedMovies || watchedMovies.length === 0) {
      return this.renderEmptyWatched();
    }

    // State C: Room joined, watchedMovies has items
    return this.renderWatchedList(watchedMovies, contributors);
  }

  renderNoRoom() {
    return `
      <div class="watched-screen">
        <div class="watched-header">
          <h1 class="watched-title">Watched</h1>
        </div>

        <div class="watched-empty-state">
          <div class="watched-icon">🏠</div>
          <h2 class="watched-empty-title">No room joined</h2>
          <p class="watched-empty-subtitle">
            Join or create a room to see watched movies.
          </p>
          <button class="btn-primary" data-action="navigate-rooms">
            Go to Rooms
          </button>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderEmptyWatched() {
    return `
      <div class="watched-screen">
        <div class="watched-header">
          <h1 class="watched-title">Watched</h1>
        </div>

        <div class="watched-empty-state">
          <div class="watched-icon">📺</div>
          <h2 class="watched-empty-title">No watched movies yet</h2>
          <p class="watched-empty-subtitle">
            Mark movies as watched from the Pool or Tonight tabs to see them here.
          </p>
          <button class="btn-primary" data-action="navigate-pool">
            Go to Pool
          </button>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderWatchedList(watchedMovies, contributors) {
    return `
      <div class="watched-screen">
        <div class="watched-header">
          <h1 class="watched-title">Watched</h1>
          <p class="watched-count">${watchedMovies.length} movie${watchedMovies.length === 1 ? '' : 's'}</p>
        </div>

        ${this.undoError ? `
          <div class="watched-error" data-action="dismiss-error">
            <span>⚠️ ${this.escapeHtml(this.undoError)}</span>
            <button class="error-dismiss">×</button>
          </div>
        ` : ''}

        <div class="watched-list">
          ${watchedMovies.map((movie, index) => this.renderWatchedMovie(movie, contributors, index)).join('')}
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderWatchedMovie(movie, contributors, index) {
    const hasPoster = movie.tmdbData?.poster_path;
    const posterUrl = hasPoster ? `https://image.tmdb.org/t/p/w200${movie.tmdbData.poster_path}` : null;

    // Calculate time ago
    const timeAgo = this.formatTimeAgo(movie.watchedAt);

    // Get contributor names/initials
    const contributorInfo = this.getContributorInfo(movie.suggestedBy, contributors);

    // Check undo eligibility
    const canUndo = this.canUndoWatched(movie);
    const timeSinceWatched = Date.now() - movie.watchedAt;
    const hoursRemaining = Math.max(0, Math.floor((24 * 60 * 60 * 1000 - timeSinceWatched) / (60 * 60 * 1000)));

    return `
      <div class="watched-item">
        <div class="watched-item-content">
          ${posterUrl ? `
            <div class="watched-poster">
              <img src="${posterUrl}" alt="${this.escapeHtml(movie.title)}" loading="lazy" />
            </div>
          ` : `
            <div class="watched-poster-placeholder">
              <div class="watched-poster-icon">🎬</div>
            </div>
          `}

          <div class="watched-info">
            <h3 class="watched-movie-title">${this.escapeHtml(movie.title)}</h3>
            <div class="watched-meta">
              <span class="watched-time" title="${new Date(movie.watchedAt).toLocaleString()}">
                ${timeAgo}
              </span>
              ${movie.tmdbData?.release_date ? `
                <span class="watched-year">· ${new Date(movie.tmdbData.release_date).getFullYear()}</span>
              ` : ''}
            </div>
            <div class="watched-suggested-by">
              Suggested by: ${contributorInfo}
            </div>
          </div>
        </div>

        <div class="watched-actions">
          ${canUndo ? `
            <button
              class="btn-undo"
              data-action="undo-watched"
              data-movie-index="${index}"
              title="Undo within ${hoursRemaining}h"
            >
              ↩ Undo
            </button>
          ` : `
            <button class="btn-undo-disabled" disabled title="Undo expired (>24h)">
              Undo expired
            </button>
          `}
        </div>
      </div>
    `;
  }

  renderStyles() {
    return `
      <style>
        .watched-screen {
          padding-bottom: 2rem;
        }

        .watched-header {
          margin-bottom: 2rem;
        }

        .watched-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 0.25rem 0;
        }

        .watched-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Empty states */
        .watched-empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .watched-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .watched-empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .watched-empty-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .btn-primary {
          background: var(--accent-color);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        /* Error message */
        .watched-error {
          background: rgba(229, 9, 20, 0.1);
          border: 1px solid rgba(229, 9, 20, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .watched-error span {
          flex: 1;
          font-size: 0.875rem;
          color: #ff6b6b;
        }

        .error-dismiss {
          background: none;
          border: none;
          color: #ff6b6b;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .error-dismiss:hover {
          opacity: 1;
        }

        /* Watched list */
        .watched-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .watched-item {
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .watched-item-content {
          display: flex;
          gap: 1rem;
          padding: 1rem;
        }

        .watched-poster {
          width: 80px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }

        .watched-poster img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
        }

        .watched-poster-placeholder {
          width: 80px;
          height: 120px;
          flex-shrink: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(229, 9, 20, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .watched-poster-icon {
          font-size: 2rem;
          opacity: 0.3;
        }

        .watched-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .watched-movie-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .watched-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .watched-time {
          color: var(--text-secondary);
        }

        .watched-year {
          color: var(--text-secondary);
        }

        .watched-suggested-by {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .watched-actions {
          padding: 0 1rem 1rem 1rem;
        }

        .btn-undo {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-undo:active {
          transform: scale(0.98);
          background: rgba(255, 255, 255, 0.08);
        }

        .btn-undo-disabled {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: not-allowed;
          width: 100%;
          opacity: 0.5;
        }
      </style>
    `;
  }

  bind(container, adapter, appShell) {
    this.container = container;
    this.adapter = adapter;
    this.appShell = appShell;

    // Set up real-time subscription
    this.setupRealtimeSubscription();

    // Event delegation
    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      if (action === 'navigate-rooms') {
        this.appShell.navigateTo('rooms');
      } else if (action === 'navigate-pool') {
        this.appShell.navigateTo('pool');
      } else if (action === 'undo-watched') {
        const movieIndex = parseInt(target.dataset.movieIndex, 10);
        this.onUndoWatched(movieIndex);
      } else if (action === 'dismiss-error') {
        this.undoError = null;
        this.rerender();
      }
    });
  }

  setupRealtimeSubscription() {
    const roomCode = this.adapter.getRoomCode();
    if (!roomCode) {
      console.log('[Watched] No room code, skipping subscription');
      return;
    }

    // Prevent duplicate subscriptions to same room
    if (this.unsubscribe && this.subscribedRoomCode === roomCode) {
      console.log('[Watched] Already subscribed to room:', roomCode, '- skipping duplicate subscription');
      return;
    }

    console.log('[Watched] Setting up real-time subscription for room:', roomCode);

    // Unsubscribe from any previous subscription
    if (this.unsubscribe) {
      console.log('[Watched] Cleaning up previous subscription to room:', this.subscribedRoomCode);
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }

    // Subscribe to room updates
    this.subscribedRoomCode = roomCode;
    this.unsubscribe = this.adapter.subscribeRoom(roomCode, (roomData) => {
      const watchedCount = roomData.watchedMovies?.length || 0;
      console.log('[Watched] ✓ Real-time update received for room:', roomCode, '- watched:', watchedCount);
      this.rerender(roomData);
    });
  }

  rerender(roomData = null) {
    if (!this.container || !this.adapter || !this.appShell) return;

    // Store scroll position
    const scrollTop = this.container.scrollTop;

    // Re-render (adapter already has latest data from subscription callback)
    this.container.innerHTML = this.render(this.adapter);

    // Rebind events
    this.bind(this.container, this.adapter, this.appShell);

    // Restore scroll position
    this.container.scrollTop = scrollTop;
  }

  async onUndoWatched(movieIndex) {
    const watchedMovies = this.adapter.getWatchedMovies();
    const movie = watchedMovies[movieIndex];

    if (!movie) {
      console.error('[Watched] Movie not found at index:', movieIndex);
      this.undoError = 'Movie not found';
      this.rerender();
      return;
    }

    // Double-check eligibility
    if (!this.canUndoWatched(movie)) {
      console.warn('[Watched] Cannot undo - more than 24 hours have passed');
      this.undoError = 'Cannot undo - more than 24 hours have passed';
      this.rerender();
      return;
    }

    console.log('[Watched] Undoing watched movie:', movie.title);

    try {
      const success = this.adapter.undoWatched(movie);

      if (success) {
        console.log('[Watched] ✓ Movie returned to pool:', movie.title);
        this.undoError = null;
        // UI will update via real-time subscription
      } else {
        console.warn('[Watched] Undo failed - time limit exceeded');
        this.undoError = 'Cannot undo - more than 24 hours have passed';
        this.rerender();
      }
    } catch (error) {
      console.error('[Watched] Undo error:', error);
      this.undoError = `Failed to undo: ${error.message}`;
      this.rerender();
    }
  }

  cleanup() {
    console.log('[Watched] ✓ Cleanup called - unsubscribing from room:', this.subscribedRoomCode);
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }
  }

  canUndoWatched(movie) {
    if (!movie.watchedAt) return false;
    const timeDiff = Date.now() - movie.watchedAt;
    return timeDiff < 24 * 60 * 60 * 1000;
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
      return 'Just now';
    }
  }

  getContributorInfo(suggestedByIds, contributors) {
    if (!suggestedByIds || suggestedByIds.length === 0) return 'Unknown';

    const names = suggestedByIds.map(id => {
      const contributor = contributors.find(c => c.id === id);
      if (contributor) {
        return contributor.name;
      }
      // Fallback: use ID as initials
      return id.substring(0, 2).toUpperCase();
    });

    return names.join(', ');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
