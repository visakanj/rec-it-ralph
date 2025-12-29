class RoomsScreen {
  constructor() {
    this.unsubscribe = null;
    this.adapter = null;
    this.appShell = null;
  }

  render(adapter) {
    const rooms = adapter.getRoomHistory();
    const currentRoomCode = adapter.getRoomCode();

    return `
      <div class="rooms-screen">
        <div class="rooms-header">
          <h1 class="rooms-title">Your Rooms</h1>
        </div>

        ${rooms.length > 0 ? this.renderRoomsList(rooms, currentRoomCode) : this.renderEmptyState()}

        ${rooms.length > 0 ? this.renderSecondaryActions() : ''}
      </div>

      ${this.renderJoinModal()}
      ${this.renderCreateModal()}

      <style>
        .rooms-screen {
          padding-bottom: 2rem;
        }

        .rooms-header {
          margin-bottom: 1.5rem;
        }

        .rooms-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0;
        }

        /* Room List */
        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .room-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .room-card:active {
          transform: scale(0.98);
          background: #222;
        }

        .room-card.current {
          border-color: #e50914;
          background: rgba(229, 9, 20, 0.05);
        }

        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.75rem;
        }

        .room-card-info {
          flex: 1;
          min-width: 0;
        }

        .room-theme {
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .room-code {
          font-family: 'SF Mono', 'Courier New', monospace;
          font-size: 0.875rem;
          color: #666;
        }

        .room-time {
          font-size: 0.75rem;
          color: #666;
          white-space: nowrap;
          margin-left: 0.5rem;
        }

        .room-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .room-contributors {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .contributor-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #333;
          border: 2px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 600;
          color: #fff;
          margin-left: -8px;
        }

        .contributor-avatar:first-child {
          margin-left: 0;
        }

        .room-pool-count {
          font-size: 0.875rem;
          color: #a0a0a0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .empty-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .empty-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 300px;
          margin: 0 auto;
        }

        /* Buttons */
        .btn-primary {
          background: #e50914;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-primary:active {
          transform: scale(0.98);
          background: #f40612;
        }

        .btn-secondary {
          background: transparent;
          color: #a0a0a0;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-secondary:active {
          transform: scale(0.98);
          background: rgba(255, 255, 255, 0.05);
          border-color: #444;
        }

        .secondary-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .secondary-actions-title {
          font-size: 0.875rem;
          color: #666;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        /* Join Room Modal */
        .join-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: none;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        }

        .join-modal.active {
          display: flex;
        }

        .join-modal-content {
          background: #1a1a1a;
          border-radius: 16px 16px 0 0;
          width: 100%;
          max-width: 500px;
          padding: 1.5rem;
          padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .join-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .join-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .join-modal-close {
          background: transparent;
          border: none;
          color: #666;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .join-modal-close:active {
          color: #fff;
        }

        .join-modal-body {
          margin-bottom: 1.5rem;
        }

        .join-modal-label {
          display: block;
          font-size: 0.875rem;
          color: #a0a0a0;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .join-modal-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem;
          font-size: 1rem;
          color: #fff;
          font-family: 'SF Mono', 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .join-modal-input:focus {
          outline: none;
          border-color: #e50914;
        }

        .join-modal-input.error {
          border-color: #ff4444;
        }

        .join-modal-error {
          color: #ff4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: none;
        }

        .join-modal-error.visible {
          display: block;
        }

        .join-modal-actions {
          display: flex;
          gap: 0.75rem;
        }

        .join-modal-actions .btn-secondary {
          flex: 1;
        }

        .join-modal-actions .btn-primary {
          flex: 2;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
    `;
  }

  renderRoomsList(rooms, currentRoomCode) {
    const roomsHtml = rooms.map(room => {
      const isCurrentRoom = room.roomCode === currentRoomCode;
      const timeAgo = this.formatTimeAgo(new Date(room.lastVisited));

      return `
        <div class="room-card ${isCurrentRoom ? 'current' : ''}" data-action="open-room" data-room="${room.roomCode}">
          <div class="room-card-header">
            <div class="room-card-info">
              <h3 class="room-theme">${this.escapeHtml(room.theme)}</h3>
              <div class="room-code">${room.roomCode}</div>
            </div>
            <div class="room-time">${timeAgo}</div>
          </div>
          <div class="room-card-footer">
            <div class="room-contributors">
              ${this.renderContributorAvatars(room)}
            </div>
            <div class="room-pool-count">—</div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="rooms-list">${roomsHtml}</div>`;
  }

  renderContributorAvatars(room) {
    // For now, we don't have contributor data without subscribing to the room
    // Show placeholder avatars
    const placeholderCount = Math.min(3, Math.floor(Math.random() * 4) + 1);
    const avatars = [];

    for (let i = 0; i < placeholderCount; i++) {
      const colors = ['#e50914', '#0080ff', '#00c853', '#ff9800', '#9c27b0'];
      const color = colors[i % colors.length];
      avatars.push(`
        <div class="contributor-avatar" style="background: ${color};">
          ${String.fromCharCode(65 + i)}
        </div>
      `);
    }

    return avatars.join('');
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <h2 class="empty-title">No rooms yet</h2>
        <p class="empty-subtitle">
          Create your first room or join an existing one to get started with collaborative movie picking.
        </p>
        <div class="empty-actions">
          <button class="btn-primary" data-action="create-room">
            Create your first room
          </button>
          <button class="btn-secondary" data-action="join-room">
            Join a room
          </button>
        </div>
      </div>
    `;
  }

  renderSecondaryActions() {
    return `
      <div class="secondary-actions">
        <div class="secondary-actions-title">Other Options</div>
        <button class="btn-secondary" data-action="join-room">
          Join a room
        </button>
        <button class="btn-secondary" data-action="create-room">
          Create new room
        </button>
      </div>
    `;
  }

  renderJoinModal() {
    return `
      <div class="join-modal" id="join-modal">
        <div class="join-modal-content">
          <div class="join-modal-header">
            <h2 class="join-modal-title">Join Room</h2>
            <button class="join-modal-close" data-action="close-join-modal">×</button>
          </div>
          <div class="join-modal-body">
            <label class="join-modal-label" for="join-room-code">Room Code</label>
            <input
              type="text"
              id="join-room-code"
              class="join-modal-input"
              placeholder="Enter 6-character code"
              maxlength="6"
              autocomplete="off"
              autocapitalize="characters"
            />
            <div class="join-modal-error" id="join-modal-error"></div>
          </div>
          <div class="join-modal-actions">
            <button class="btn-secondary" data-action="close-join-modal">Cancel</button>
            <button class="btn-primary" data-action="submit-join-room" id="join-submit-btn">Join</button>
          </div>
        </div>
      </div>
    `;
  }

  renderCreateModal() {
    return `
      <div class="join-modal" id="create-modal">
        <div class="join-modal-content">
          <div class="join-modal-header">
            <h2 class="join-modal-title">Create Room</h2>
            <button class="join-modal-close" data-action="close-create-modal">×</button>
          </div>
          <div class="join-modal-body">
            <label class="join-modal-label" for="create-room-theme">Theme</label>
            <input
              type="text"
              id="create-room-theme"
              class="join-modal-input"
              placeholder="e.g., Horror Movies, 90s Action"
              maxlength="50"
              autocomplete="off"
              style="text-transform: none; letter-spacing: normal;"
            />
            <div class="join-modal-error" id="create-modal-error"></div>
          </div>
          <div class="join-modal-actions">
            <button class="btn-secondary" data-action="close-create-modal">Cancel</button>
            <button class="btn-primary" data-action="submit-create-room" id="create-submit-btn">Create</button>
          </div>
        </div>
      </div>
    `;
  }

  formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Bind event listeners after render
  bind(container, adapter, appShell) {
    this.adapter = adapter;
    this.appShell = appShell;

    // Event delegation on container
    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'open-room':
          this.onRoomClick(target.dataset.room);
          break;
        case 'join-room':
          this.onJoinClick();
          break;
        case 'create-room':
          this.onCreateClick();
          break;
        case 'close-join-modal':
          this.closeJoinModal();
          break;
        case 'submit-join-room':
          this.submitJoinRoom();
          break;
        case 'close-create-modal':
          this.closeCreateModal();
          break;
        case 'submit-create-room':
          this.submitCreateRoom();
          break;
      }
    });

    // Close join modal on backdrop click
    const joinModal = container.querySelector('#join-modal');
    if (joinModal) {
      joinModal.addEventListener('click', (e) => {
        if (e.target === joinModal) {
          this.closeJoinModal();
        }
      });
    }

    // Close create modal on backdrop click
    const createModal = container.querySelector('#create-modal');
    if (createModal) {
      createModal.addEventListener('click', (e) => {
        if (e.target === createModal) {
          this.closeCreateModal();
        }
      });
    }

    // Auto-uppercase and validate join input
    const joinInput = container.querySelector('#join-room-code');
    if (joinInput) {
      joinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.clearJoinError();
      });

      joinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitJoinRoom();
        }
      });
    }

    // Create room input handlers
    const createInput = container.querySelector('#create-room-theme');
    if (createInput) {
      createInput.addEventListener('input', () => {
        this.clearCreateError();
      });

      createInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitCreateRoom();
        }
      });
    }
  }

  // Event handlers
  async onRoomClick(roomCode) {
    console.log('[Rooms] Opening room:', roomCode);

    // UX guard: if already in this room, just navigate without rejoining
    const currentRoomCode = this.adapter.getRoomCode();
    if (currentRoomCode === roomCode) {
      console.log('[Rooms] Already in room, navigating to Pool without rejoining');
      this.appShell.navigateTo('pool');
      return;
    }

    // Join the room
    const success = await this.adapter.joinRoom(roomCode);
    if (success) {
      // Always route to Pool (no current pick state in data model yet)
      this.appShell.navigateTo('pool');
    }
  }

  onJoinClick() {
    console.log('[Rooms] Join room clicked');
    const modal = document.getElementById('join-modal');
    const input = document.getElementById('join-room-code');
    if (modal && input) {
      modal.classList.add('active');
      input.value = '';
      this.clearJoinError();
      setTimeout(() => input.focus(), 100);
    }
  }

  closeJoinModal() {
    const modal = document.getElementById('join-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  showJoinError(message) {
    const errorEl = document.getElementById('join-modal-error');
    const input = document.getElementById('join-room-code');
    if (errorEl && input) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      input.classList.add('error');
    }
  }

  clearJoinError() {
    const errorEl = document.getElementById('join-modal-error');
    const input = document.getElementById('join-room-code');
    if (errorEl && input) {
      errorEl.classList.remove('visible');
      input.classList.remove('error');
    }
  }

  async submitJoinRoom() {
    const input = document.getElementById('join-room-code');
    const submitBtn = document.getElementById('join-submit-btn');
    if (!input || !submitBtn) return;

    const roomCode = input.value.trim();

    // Validation
    if (!roomCode) {
      this.showJoinError('Please enter a room code');
      return;
    }

    if (roomCode.length !== 6) {
      this.showJoinError('Room code must be 6 characters');
      return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';
    this.clearJoinError();

    try {
      console.log('[Rooms] Joining room:', roomCode);
      const success = await this.adapter.joinRoom(roomCode);

      if (success) {
        // Close modal
        this.closeJoinModal();

        // Update room history with theme from adapter
        const theme = this.adapter.getTheme();
        this.adapter._addToRoomHistory(roomCode, theme);

        // Navigate to Pool (no current pick state in data model)
        this.appShell.navigateTo('pool');
      } else {
        this.showJoinError('Room not found. Please check the code.');
      }
    } catch (error) {
      console.error('[Rooms] Join room error:', error);
      this.showJoinError('Failed to join room. Please try again.');
    } finally {
      // Re-enable form
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join';
    }
  }

  onCreateClick() {
    console.log('[Rooms] Create room clicked');
    const modal = document.getElementById('create-modal');
    const input = document.getElementById('create-room-theme');
    if (modal && input) {
      modal.classList.add('active');
      input.value = '';
      this.clearCreateError();
      setTimeout(() => input.focus(), 100);
    }
  }

  closeCreateModal() {
    const modal = document.getElementById('create-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  showCreateError(message) {
    const errorEl = document.getElementById('create-modal-error');
    const input = document.getElementById('create-room-theme');
    if (errorEl && input) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      input.classList.add('error');
    }
  }

  clearCreateError() {
    const errorEl = document.getElementById('create-modal-error');
    const input = document.getElementById('create-room-theme');
    if (errorEl && input) {
      errorEl.classList.remove('visible');
      input.classList.remove('error');
    }
  }

  async submitCreateRoom() {
    const input = document.getElementById('create-room-theme');
    const submitBtn = document.getElementById('create-submit-btn');
    if (!input || !submitBtn) return;

    const theme = input.value.trim();

    // Validation
    if (!theme) {
      this.showCreateError('Please enter a theme');
      return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    this.clearCreateError();

    try {
      console.log('[Rooms] Creating room with theme:', theme);
      const roomCode = await this.adapter.createRoom(theme);

      if (roomCode) {
        // Close modal
        this.closeCreateModal();

        // Room history is already updated by adapter.createRoom()
        // Navigate to Pool
        this.appShell.navigateTo('pool');
      } else {
        this.showCreateError('Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('[Rooms] Create room error:', error);
      this.showCreateError('Failed to create room. Please try again.');
    } finally {
      // Re-enable form
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create';
    }
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
