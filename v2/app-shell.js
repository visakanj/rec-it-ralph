/**
 * V2 App Shell
 * Handles tab navigation and screen routing
 */
class AppShell {
  constructor() {
    this.currentTab = 'rooms';
    this.adapter = window.v2Adapter;

    // Screen instances
    this.screens = {
      rooms: new RoomsScreen(),
      pool: new PoolScreen(),
      tonight: new TonightScreen(),
      watched: new WatchedScreen()
    };

    this.init();
  }

  async init() {
    try {
      console.log('[V2 Shell] Waiting for adapter to be ready...');

      // Wait for adapter to initialize
      await this.adapter.readyPromise;

      console.log('[V2 Shell] Adapter ready, initializing UI');
      this.onReady();

    } catch (error) {
      console.error('[V2 Shell] Failed to initialize:', error);
    }
  }

  onReady() {
    // Set up tab navigation
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo(btn.dataset.tab);
      });
    });

    // Update room code in top bar
    this.updateRoomCode();

    // Navigate to initial tab
    this.navigateTo('rooms');
  }

  navigateTo(tab) {
    // Guard: Skip re-render if already on this tab
    // Prevents unnecessary DOM manipulation and visual instability (e.g., flickering avatars)
    if (tab === this.currentTab) {
      console.log(`[V2 Shell] Already on ${tab}, skipping re-render`);
      return;
    }

    // Cleanup previous screen if it has cleanup method
    if (this.currentTab) {
      const previousScreen = this.screens[this.currentTab];
      if (previousScreen && typeof previousScreen.cleanup === 'function') {
        console.log(`[V2 Shell] Cleaning up ${this.currentTab} screen`);
        previousScreen.cleanup();
      }
    }

    this.currentTab = tab;

    // Update tab bar active state
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Render screen
    const container = document.getElementById('screen-container');
    const screen = this.screens[tab];
    container.innerHTML = screen.render(this.adapter);

    // Bind event listeners if screen supports it
    if (typeof screen.bind === 'function') {
      screen.bind(container, this.adapter, this);
    }

    console.log(`[V2 Shell] Navigated to: ${tab}`);
  }

  updateRoomCode() {
    const roomCode = this.adapter.getRoomCode();
    const badge = document.getElementById('v2-room-code');
    if (badge) {
      badge.textContent = roomCode || '---';
    }
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[V2 Shell] DOMContentLoaded - creating AppShell');
  window.appShell = new AppShell();
});
