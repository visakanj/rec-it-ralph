class TonightScreen {
  constructor() {
    this.container = null;
    this.adapter = null;
    this.appShell = null;
    this.unsubscribe = null;
    this.subscribedRoomCode = null;
  }

  render(adapter) {
    const roomCode = adapter.getRoomCode();
    const tonightPick = adapter.getTonightPick();
    const moviePool = adapter.getMoviePool();
    const contributors = adapter.getContributors();

    // State A: No room joined
    if (!roomCode) {
      return this.renderNoRoom();
    }

    // State B: Room joined, pool empty
    if (!moviePool || moviePool.length === 0) {
      return this.renderEmptyPool();
    }

    // State C: Room joined, pool has movies, but no tonight pick
    if (!tonightPick) {
      return this.renderNoPick(moviePool.length);
    }

    // State D: Room joined, tonight pick exists
    return this.renderPickedMovie(tonightPick, contributors);
  }

  renderNoRoom() {
    return `
      <div class="tonight-screen">
        <div class="tonight-header">
          <h1 class="tonight-title">Tonight</h1>
        </div>

        <div class="tonight-empty-state">
          <div class="tonight-icon">🏠</div>
          <h2 class="tonight-empty-title">No room joined</h2>
          <p class="tonight-empty-subtitle">
            Join or create a room to pick tonight's movie.
          </p>
          <button class="btn-primary" data-action="navigate-rooms">
            Go to Rooms
          </button>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderEmptyPool() {
    return `
      <div class="tonight-screen">
        <div class="tonight-header">
          <h1 class="tonight-title">Tonight</h1>
        </div>

        <div class="tonight-empty-state">
          <div class="tonight-icon">📽️</div>
          <h2 class="tonight-empty-title">No movies in pool</h2>
          <p class="tonight-empty-subtitle">
            Add some movies to your pool before picking tonight's movie.
          </p>
          <button class="btn-primary" data-action="navigate-pool">
            Go to Pool
          </button>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderNoPick(movieCount) {
    return `
      <div class="tonight-screen">
        <div class="tonight-header">
          <h1 class="tonight-title">Tonight</h1>
        </div>

        <div class="tonight-empty-state">
          <div class="tonight-icon">🎬</div>
          <h2 class="tonight-empty-title">No movie selected</h2>
          <p class="tonight-empty-subtitle">
            You have ${movieCount} movie${movieCount === 1 ? '' : 's'} in your pool.<br>
            Pick a random movie to watch tonight.
          </p>
          <button class="tonight-pick-btn" data-action="pick-movie">
            🎲 Pick tonight's movie
          </button>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderPickedMovie(movie, contributors) {
    const hasPoster = movie.tmdbData?.poster_path;
    const posterUrl = hasPoster ? `https://image.tmdb.org/t/p/w500${movie.tmdbData.poster_path}` : null;

    // Get contributor names
    const contributorNames = this.getContributorNames(movie.suggestedBy, contributors);

    return `
      <div class="tonight-screen">
        <div class="tonight-header">
          <h1 class="tonight-title">Tonight</h1>
        </div>

        <div class="tonight-pick-card">
          ${posterUrl ? `
            <div class="tonight-poster">
              <img src="${posterUrl}" alt="${this.escapeHtml(movie.title)}" />
            </div>
          ` : `
            <div class="tonight-poster-placeholder">
              <div class="tonight-poster-icon">🎬</div>
            </div>
          `}

          <div class="tonight-movie-info">
            <h2 class="tonight-movie-title">${this.escapeHtml(movie.title)}</h2>
            ${movie.tmdbData?.overview ? `
              <p class="tonight-movie-overview">${this.escapeHtml(movie.tmdbData.overview)}</p>
            ` : ''}
            <div class="tonight-movie-meta">
              ${movie.tmdbData?.release_date ? `
                <span class="tonight-meta-item">📅 ${new Date(movie.tmdbData.release_date).getFullYear()}</span>
              ` : ''}
              ${movie.tmdbData?.runtime ? `
                <span class="tonight-meta-item">⏱️ ${movie.tmdbData.runtime} min</span>
              ` : ''}
            </div>
            <div class="tonight-suggested-by">
              Suggested by: ${contributorNames}
            </div>
          </div>

          <div class="tonight-actions">
            <button class="btn-primary" data-action="mark-watched">
              ✓ Mark Watched
            </button>
            <button class="btn-secondary" data-action="pick-again">
              🎲 Pick Again
            </button>
          </div>
        </div>
      </div>

      ${this.renderStyles()}
    `;
  }

  renderStyles() {
    return `
      <style>
        .tonight-screen {
          padding-bottom: 2rem;
        }

        .tonight-header {
          margin-bottom: 2rem;
        }

        .tonight-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0;
        }

        /* Empty states */
        .tonight-empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .tonight-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .tonight-empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .tonight-empty-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .tonight-pick-btn {
          background: var(--accent-color);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 1.25rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tonight-pick-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        /* Picked movie card */
        .tonight-pick-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .tonight-poster {
          width: 100%;
          aspect-ratio: 2/3;
          overflow: hidden;
          background: #000;
        }

        .tonight-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tonight-poster-placeholder {
          width: 100%;
          aspect-ratio: 2/3;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(229, 9, 20, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tonight-poster-icon {
          font-size: 6rem;
          opacity: 0.3;
        }

        .tonight-movie-info {
          padding: 1.5rem;
        }

        .tonight-movie-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: #fff;
          line-height: 1.2;
        }

        .tonight-movie-overview {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          margin: 0 0 1rem 0;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tonight-movie-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .tonight-meta-item {
          font-size: 0.875rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .tonight-suggested-by {
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .tonight-actions {
          padding: 1.5rem;
          padding-top: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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
          width: 100%;
        }

        .btn-primary:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-secondary:active {
          transform: scale(0.98);
          background: rgba(255, 255, 255, 0.08);
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

      if (action === 'pick-movie') {
        this.onPickMovie();
      } else if (action === 'pick-again') {
        this.onPickAgain();
      } else if (action === 'mark-watched') {
        this.onMarkWatched();
      } else if (action === 'navigate-rooms') {
        this.appShell.navigateTo('rooms');
      } else if (action === 'navigate-pool') {
        this.appShell.navigateTo('pool');
      }
    });
  }

  setupRealtimeSubscription() {
    const roomCode = this.adapter.getRoomCode();
    if (!roomCode) {
      console.log('[Tonight] No room code, skipping subscription');
      return;
    }

    // Prevent duplicate subscriptions to same room
    if (this.unsubscribe && this.subscribedRoomCode === roomCode) {
      console.log('[Tonight] Already subscribed to room:', roomCode, '- skipping duplicate subscription');
      return;
    }

    console.log('[Tonight] Setting up real-time subscription for room:', roomCode);

    // Unsubscribe from any previous subscription
    if (this.unsubscribe) {
      console.log('[Tonight] Cleaning up previous subscription to room:', this.subscribedRoomCode);
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }

    // Subscribe to room updates
    this.subscribedRoomCode = roomCode;
    this.unsubscribe = this.adapter.subscribeRoom(roomCode, (roomData) => {
      console.log('[Tonight] ✓ Real-time update received for room:', roomCode);
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

  onPickMovie() {
    console.log('[Tonight] Picking tonight\'s movie');

    const movie = this.adapter.pickTonightMovie();

    if (!movie) {
      console.warn('[Tonight] No movies in pool to pick');
      return;
    }

    // UI will update via real-time subscription
    console.log('[Tonight] Movie picked:', movie.title);
  }

  onPickAgain() {
    console.log('[Tonight] Picking again');

    // Try to pick a different movie if possible
    const currentPick = this.adapter.getTonightPick();
    const moviePool = this.adapter.getMoviePool();

    if (!moviePool || moviePool.length === 0) {
      console.warn('[Tonight] No movies in pool');
      return;
    }

    // If only one movie, just re-pick it
    if (moviePool.length === 1) {
      this.adapter.pickTonightMovie();
      return;
    }

    // Try to pick a different movie (simple approach: pick up to 5 times)
    let attempts = 0;
    let newPick = null;
    while (attempts < 5) {
      newPick = this.adapter.pickTonightMovie();
      if (!currentPick || newPick.title !== currentPick.title) {
        break;
      }
      attempts++;
    }

    console.log('[Tonight] New pick:', newPick?.title);
  }

  async onMarkWatched() {
    const tonightPick = this.adapter.getTonightPick();

    if (!tonightPick) {
      console.warn('[Tonight] No tonight pick to mark watched');
      return;
    }

    console.log('[Tonight] Marking tonight\'s movie as watched:', tonightPick.title);

    try {
      // Mark watched will automatically clear tonightPick via AppState.movePoolToWatched
      await this.adapter.markWatched(tonightPick);
      console.log('[Tonight] ✓ Movie marked watched');
      // UI will update via real-time subscription
    } catch (error) {
      console.error('[Tonight] Failed to mark watched:', error);
    }
  }

  cleanup() {
    console.log('[Tonight] Cleaning up subscription');
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }
  }

  getContributorNames(suggestedByIds, contributors) {
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
