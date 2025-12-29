class PoolScreen {
  constructor() {
    this.adapter = null;
    this.appShell = null;
    this.unsubscribe = null;
    this.subscribedRoomCode = null;
    this.container = null;
    this.pendingRoomData = null;
    this.pendingRoomCode = null;
  }

  render(adapter) {
    const theme = adapter.getTheme() || 'No theme set';
    const contributors = adapter.getContributors() || [];
    const moviePool = adapter.getMoviePool() || [];

    return `
      <div class="pool-screen">
        ${this.renderHeader(theme)}
        ${this.renderContributors(contributors)}
        ${this.renderMovieGrid(moviePool)}
        ${this.renderAddContributorSheet()}
        ${this.renderAddMovieSheet(contributors)}
      </div>

      <style>
        .pool-screen {
          padding-bottom: 2rem;
        }

        .pool-header {
          margin-bottom: 1.5rem;
        }

        .pool-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 1rem 0;
        }

        .theme-banner {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .theme-banner-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .theme-banner-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .pool-helper-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Contributors Section */
        .contributors-section {
          margin-bottom: 2rem;
        }

        .contributors-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .contributors-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .btn-add-contributor {
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-contributor:active {
          transform: scale(0.98);
          background: rgba(255, 255, 255, 0.05);
        }

        .contributors-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          -webkit-overflow-scrolling: touch;
        }

        .contributors-scroll::-webkit-scrollbar {
          display: none;
        }

        .contributor-chip {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .contributor-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          border: 2px solid var(--border-color);
        }

        .contributor-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
          max-width: 70px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .contributors-empty {
          text-align: center;
          padding: 2rem 1rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px dashed var(--border-color);
        }

        .contributors-empty-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 1rem 0;
        }

        /* Movies Section */
        .movies-section {
          margin-bottom: 2rem;
        }

        .movies-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .movies-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .btn-add-movie {
          background: var(--accent-primary);
          border: none;
          border-radius: 8px;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-movie:active {
          transform: scale(0.98);
          background: var(--accent-hover);
        }

        .movie-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          width: 100%;
        }

        .movie-card {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-secondary);
          aspect-ratio: 2/3;
          min-width: 0; /* Prevent grid blowout */
        }

        .movie-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .movie-poster-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          font-size: 3rem;
          opacity: 0.3;
        }

        .movie-title-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
          padding: 2rem 0.75rem 0.75rem;
        }

        .movie-title-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .movies-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px dashed var(--border-color);
        }

        .movies-empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .movies-empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .movies-empty-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
        }

        .btn-add-first-movie {
          background: var(--accent-primary);
          border: none;
          border-radius: 8px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-first-movie:active {
          transform: scale(0.98);
          background: var(--accent-hover);
        }

        /* No Contributors Warning in Add Movie Sheet */
        .no-contributors-warning {
          text-align: center;
          padding: 2rem 1rem;
        }

        .no-contributors-warning-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-contributors-warning-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
        }
      </style>
    `;
  }

  renderHeader(theme) {
    return `
      <div class="pool-header">
        <h1 class="pool-title">Pool</h1>
        <div class="theme-banner">
          <div class="theme-banner-title">Theme</div>
          <div class="theme-banner-text">${this.escapeHtml(theme)}</div>
        </div>
        <p class="pool-helper-text">Add movies to build your group's pool.</p>
      </div>
    `;
  }

  renderContributors(contributors) {
    if (contributors.length === 0) {
      return `
        <div class="contributors-section">
          <div class="contributors-header">
            <span class="contributors-count">0 contributors</span>
            <button class="btn-add-contributor" data-action="add-contributor">+ Add contributor</button>
          </div>
          <div class="contributors-empty">
            <p class="contributors-empty-text">Add contributors to start building your movie pool</p>
            <button class="btn-primary" data-action="add-contributor">Add your first contributor</button>
          </div>
        </div>
      `;
    }

    const contributorsHtml = contributors.map(c => `
      <div class="contributor-chip">
        <div class="contributor-avatar" style="background: ${c.color};">
          ${this.getInitials(c.name)}
        </div>
        <div class="contributor-name">${this.escapeHtml(c.name)}</div>
      </div>
    `).join('');

    return `
      <div class="contributors-section">
        <div class="contributors-header">
          <span class="contributors-count">${contributors.length} contributor${contributors.length !== 1 ? 's' : ''}</span>
          <button class="btn-add-contributor" data-action="add-contributor">+ Add contributor</button>
        </div>
        <div class="contributors-scroll">
          ${contributorsHtml}
        </div>
      </div>
    `;
  }

  renderMovieGrid(moviePool) {
    if (moviePool.length === 0) {
      return `
        <div class="movies-section">
          <div class="movies-empty">
            <div class="movies-empty-icon">🎬</div>
            <h2 class="movies-empty-title">No movies yet</h2>
            <p class="movies-empty-subtitle">Add your first movie to get started</p>
            <button class="btn-add-first-movie" data-action="add-movie">+ Add your first movie</button>
          </div>
        </div>
      `;
    }

    const moviesHtml = moviePool.map(movie => {
      const posterUrl = movie.tmdbData?.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.tmdbData.poster_path}`
        : null;

      return `
        <div class="movie-card">
          ${posterUrl
            ? `<img src="${posterUrl}" alt="${this.escapeHtml(movie.title)}" class="movie-poster" />`
            : `<div class="movie-poster-placeholder">🎬</div>`
          }
          <div class="movie-title-overlay">
            <p class="movie-title-text">${this.escapeHtml(movie.title)}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="movies-section">
        <div class="movies-header">
          <h2 class="movies-title">Movies (${moviePool.length})</h2>
          <button class="btn-add-movie" data-action="add-movie">+ Add</button>
        </div>
        <div class="movie-grid">
          ${moviesHtml}
        </div>
      </div>
    `;
  }

  renderAddContributorSheet() {
    return `
      <div class="bottom-sheet" id="add-contributor-sheet">
        <div class="bottom-sheet-content">
          <div class="bottom-sheet-header">
            <h2 class="bottom-sheet-title">Add Contributor</h2>
            <button class="bottom-sheet-close" data-action="close-add-contributor">×</button>
          </div>
          <div class="bottom-sheet-body">
            <div class="form-group">
              <label class="form-label" for="contributor-name">Name</label>
              <input
                type="text"
                id="contributor-name"
                class="form-input"
                placeholder="Enter name"
                maxlength="30"
                autocomplete="off"
              />
              <div class="form-error" id="contributor-error"></div>
            </div>
          </div>
          <div class="bottom-sheet-actions">
            <button class="btn-secondary" data-action="close-add-contributor">Cancel</button>
            <button class="btn-primary" data-action="submit-add-contributor" id="add-contributor-btn">Add</button>
          </div>
        </div>
      </div>
    `;
  }

  renderAddMovieSheet(contributors) {
    if (contributors.length === 0) {
      return `
        <div class="bottom-sheet" id="add-movie-sheet">
          <div class="bottom-sheet-content">
            <div class="bottom-sheet-header">
              <h2 class="bottom-sheet-title">Add Movie</h2>
              <button class="bottom-sheet-close" data-action="close-add-movie">×</button>
            </div>
            <div class="bottom-sheet-body">
              <div class="no-contributors-warning">
                <div class="no-contributors-warning-icon">👥</div>
                <p class="no-contributors-warning-text">Add a contributor first before adding movies</p>
                <button class="btn-primary" data-action="open-add-contributor-from-movie">Add contributor</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const contributorOptions = contributors.map(c =>
      `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`
    ).join('');

    return `
      <div class="bottom-sheet" id="add-movie-sheet">
        <div class="bottom-sheet-content">
          <div class="bottom-sheet-header">
            <h2 class="bottom-sheet-title">Add Movie</h2>
            <button class="bottom-sheet-close" data-action="close-add-movie">×</button>
          </div>
          <div class="bottom-sheet-body">
            <div class="form-group">
              <label class="form-label" for="movie-contributor">Suggested by</label>
              <select id="movie-contributor" class="form-select">
                <option value="">Select contributor</option>
                ${contributorOptions}
              </select>
              <div class="form-error" id="movie-contributor-error"></div>
            </div>
            <div class="form-group">
              <label class="form-label" for="movie-title">Movie title</label>
              <input
                type="text"
                id="movie-title"
                class="form-input"
                placeholder="e.g., The Matrix"
                autocomplete="off"
              />
              <div class="form-error" id="movie-title-error"></div>
            </div>
          </div>
          <div class="bottom-sheet-actions">
            <button class="btn-secondary" data-action="close-add-movie">Cancel</button>
            <button class="btn-primary" data-action="submit-add-movie" id="add-movie-btn">Add Movie</button>
          </div>
        </div>
      </div>
    `;
  }

  bind(container, adapter, appShell) {
    this.adapter = adapter;
    this.appShell = appShell;
    this.container = container;

    // Subscribe to room updates for real-time sync
    this.setupRealtimeSubscription();

    // Event delegation
    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'add-contributor':
          this.openAddContributorSheet();
          break;
        case 'close-add-contributor':
          this.closeAddContributorSheet();
          break;
        case 'submit-add-contributor':
          this.submitAddContributor();
          break;
        case 'add-movie':
          this.openAddMovieSheet();
          break;
        case 'close-add-movie':
          this.closeAddMovieSheet();
          break;
        case 'submit-add-movie':
          this.submitAddMovie();
          break;
        case 'open-add-contributor-from-movie':
          this.closeAddMovieSheet();
          this.openAddContributorSheet();
          break;
      }
    });

    // Backdrop clicks
    const contributorSheet = container.querySelector('#add-contributor-sheet');
    if (contributorSheet) {
      contributorSheet.addEventListener('click', (e) => {
        if (e.target === contributorSheet) {
          this.closeAddContributorSheet();
        }
      });
    }

    const movieSheet = container.querySelector('#add-movie-sheet');
    if (movieSheet) {
      movieSheet.addEventListener('click', (e) => {
        if (e.target === movieSheet) {
          this.closeAddMovieSheet();
        }
      });
    }

    // Input handlers
    const contributorInput = container.querySelector('#contributor-name');
    if (contributorInput) {
      contributorInput.addEventListener('input', () => this.clearError('contributor'));
      contributorInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submitAddContributor();
      });
    }

    const movieContributorSelect = container.querySelector('#movie-contributor');
    if (movieContributorSelect) {
      movieContributorSelect.addEventListener('change', () => this.clearError('movie-contributor'));
    }

    const movieTitleInput = container.querySelector('#movie-title');
    if (movieTitleInput) {
      movieTitleInput.addEventListener('input', () => this.clearError('movie-title'));
      movieTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submitAddMovie();
      });
    }
  }

  setupRealtimeSubscription() {
    const roomCode = this.adapter.getRoomCode();
    if (!roomCode) {
      console.log('[Pool] No room code, skipping subscription');
      return;
    }

    // Prevent duplicate subscriptions to same room
    if (this.unsubscribe && this.subscribedRoomCode === roomCode) {
      console.log('[Pool] Already subscribed to room:', roomCode, '- skipping duplicate subscription');
      return;
    }

    console.log('[Pool] Setting up real-time subscription for room:', roomCode);

    // Unsubscribe from any previous subscription
    if (this.unsubscribe) {
      console.log('[Pool] Cleaning up previous subscription to room:', this.subscribedRoomCode);
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }

    // Subscribe to room updates
    this.subscribedRoomCode = roomCode;
    this.unsubscribe = this.adapter.subscribeRoom(roomCode, (roomData) => {
      console.log('[Pool] ✓ Real-time update received for room:', roomCode, '- contributors:', roomData.contributors?.length, 'movies:', roomData.moviePool?.length);
      this.rerender(roomData);
    });
  }

  rerender(roomData = null) {
    if (!this.container || !this.adapter || !this.appShell) return;

    // Don't interrupt user if a bottom sheet is open - queue update instead
    const contributorSheet = document.getElementById('add-contributor-sheet');
    const movieSheet = document.getElementById('add-movie-sheet');
    const isSheetOpen =
      (contributorSheet && contributorSheet.classList.contains('active')) ||
      (movieSheet && movieSheet.classList.contains('active'));

    if (isSheetOpen) {
      // Queue the update for when sheet closes (store both data and room code)
      if (roomData) {
        const currentRoom = this.adapter.getRoomCode();
        this.pendingRoomData = roomData;
        this.pendingRoomCode = currentRoom;
        console.log('[Pool] ⏸ Queueing update for room:', currentRoom, '(preserving user input)');
      }
      return;
    }

    // Clear any pending data since we're rendering now
    this.pendingRoomData = null;
    this.pendingRoomCode = null;

    // Store scroll position
    const scrollTop = this.container.scrollTop;

    // Re-render (adapter already has latest data from subscription callback)
    this.container.innerHTML = this.render(this.adapter);

    // Rebind events
    this.bind(this.container, this.adapter, this.appShell);

    // Restore scroll position
    this.container.scrollTop = scrollTop;
  }

  applyPendingUpdates() {
    // Only apply if we have pending data and we're still in the same room
    if (this.pendingRoomData && this.pendingRoomCode) {
      const currentRoom = this.adapter.getRoomCode();

      if (currentRoom === this.pendingRoomCode) {
        console.log('[Pool] ▶ Applying queued updates for room:', currentRoom);
        // Adapter already has the latest data, just trigger re-render
        this.rerender();
      } else {
        console.log('[Pool] ⚠ Discarding stale queued update for room:', this.pendingRoomCode, '(now in room:', currentRoom, ')');
        this.pendingRoomData = null;
        this.pendingRoomCode = null;
      }
    }
  }

  openAddContributorSheet() {
    const sheet = document.getElementById('add-contributor-sheet');
    const input = document.getElementById('contributor-name');
    if (sheet && input) {
      sheet.classList.add('active');
      input.value = '';
      this.clearError('contributor');
      setTimeout(() => input.focus(), 100);
    }
  }

  closeAddContributorSheet() {
    const sheet = document.getElementById('add-contributor-sheet');
    if (sheet) {
      sheet.classList.remove('active');

      // Apply queued updates after animation completes
      const content = sheet.querySelector('.bottom-sheet-content');
      if (content) {
        const applyUpdates = () => {
          this.applyPendingUpdates();
        };

        // Listen for animation/transition end
        content.addEventListener('animationend', applyUpdates, { once: true });
        content.addEventListener('transitionend', applyUpdates, { once: true });

        // Fallback timeout in case events don't fire
        setTimeout(applyUpdates, 400);
      } else {
        // Immediate fallback if content not found
        this.applyPendingUpdates();
      }
    }
  }

  async submitAddContributor() {
    const input = document.getElementById('contributor-name');
    const btn = document.getElementById('add-contributor-btn');
    if (!input || !btn) return;

    const name = input.value.trim();

    if (!name) {
      this.showError('contributor', 'Please enter a name');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Adding...';
    this.clearError('contributor');

    try {
      console.log('[Pool] Adding contributor:', name);
      this.adapter.addContributor(name);

      // Close sheet
      this.closeAddContributorSheet();

      // UI will update via real-time subscription
    } catch (error) {
      console.error('[Pool] Add contributor error:', error);
      this.showError('contributor', 'Failed to add contributor');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add';
    }
  }

  openAddMovieSheet() {
    const sheet = document.getElementById('add-movie-sheet');
    const contributorSelect = document.getElementById('movie-contributor');
    const titleInput = document.getElementById('movie-title');

    if (sheet) {
      sheet.classList.add('active');

      if (contributorSelect) contributorSelect.value = '';
      if (titleInput) titleInput.value = '';

      this.clearError('movie-contributor');
      this.clearError('movie-title');

      setTimeout(() => {
        if (contributorSelect) contributorSelect.focus();
      }, 100);
    }
  }

  closeAddMovieSheet() {
    const sheet = document.getElementById('add-movie-sheet');
    if (sheet) {
      sheet.classList.remove('active');

      // Apply queued updates after animation completes
      const content = sheet.querySelector('.bottom-sheet-content');
      if (content) {
        const applyUpdates = () => {
          this.applyPendingUpdates();
        };

        // Listen for animation/transition end
        content.addEventListener('animationend', applyUpdates, { once: true });
        content.addEventListener('transitionend', applyUpdates, { once: true });

        // Fallback timeout in case events don't fire
        setTimeout(applyUpdates, 400);
      } else {
        // Immediate fallback if content not found
        this.applyPendingUpdates();
      }
    }
  }

  async submitAddMovie() {
    const contributorSelect = document.getElementById('movie-contributor');
    const titleInput = document.getElementById('movie-title');
    const btn = document.getElementById('add-movie-btn');

    if (!contributorSelect || !titleInput || !btn) return;

    const contributorId = contributorSelect.value;
    const title = titleInput.value.trim();

    // Validation
    let hasError = false;

    if (!contributorId) {
      this.showError('movie-contributor', 'Please select a contributor');
      hasError = true;
    }

    if (!title) {
      this.showError('movie-title', 'Please enter a movie title');
      hasError = true;
    }

    if (hasError) return;

    // Submit
    btn.disabled = true;
    btn.textContent = 'Adding...';
    this.clearError('movie-contributor');
    this.clearError('movie-title');

    try {
      console.log('[Pool] Adding movie:', title, 'by contributor:', contributorId);
      await this.adapter.addMovie(contributorId, title);

      // Close sheet
      this.closeAddMovieSheet();

      // UI will update via real-time subscription
    } catch (error) {
      console.error('[Pool] Add movie error:', error);
      this.showError('movie-title', 'Failed to add movie');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Movie';
    }
  }

  showError(field, message) {
    let errorId, inputId;

    if (field === 'contributor') {
      errorId = 'contributor-error';
      inputId = 'contributor-name';
    } else if (field === 'movie-contributor') {
      errorId = 'movie-contributor-error';
      inputId = 'movie-contributor';
    } else if (field === 'movie-title') {
      errorId = 'movie-title-error';
      inputId = 'movie-title';
    }

    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);

    if (errorEl && inputEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      inputEl.classList.add('error');
    }
  }

  clearError(field) {
    let errorId, inputId;

    if (field === 'contributor') {
      errorId = 'contributor-error';
      inputId = 'contributor-name';
    } else if (field === 'movie-contributor') {
      errorId = 'movie-contributor-error';
      inputId = 'movie-contributor';
    } else if (field === 'movie-title') {
      errorId = 'movie-title-error';
      inputId = 'movie-title';
    }

    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);

    if (errorEl && inputEl) {
      errorEl.classList.remove('visible');
      inputEl.classList.remove('error');
    }
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  cleanup() {
    console.log('[Pool] ✓ Cleanup called - unsubscribing from room:', this.subscribedRoomCode);
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.subscribedRoomCode = null;
    }
    // Clear any pending queued updates
    if (this.pendingRoomData || this.pendingRoomCode) {
      console.log('[Pool] ✓ Clearing pending queued updates');
      this.pendingRoomData = null;
      this.pendingRoomCode = null;
    }
  }
}
