class TonightScreen {
  constructor() {
    this.adapter = null;
    this.appShell = null;
  }

  render(adapter) {
    return `
      <div class="tonight-screen">
        <div class="tonight-header">
          <h1 class="tonight-title">Tonight</h1>
        </div>

        <div class="tonight-empty-state">
          <div class="tonight-icon">🎬</div>
          <h2 class="tonight-empty-title">No movie selected</h2>
          <p class="tonight-empty-subtitle">
            Pick a random movie from your pool to watch tonight.
          </p>
          <button class="tonight-pick-btn" data-action="pick-movie">
            🎲 Pick tonight's movie
          </button>
        </div>
      </div>

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
          color: #666;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .tonight-pick-btn {
          background: #e50914;
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
          background: #f40612;
        }
      </style>
    `;
  }

  bind(container, adapter, appShell) {
    this.adapter = adapter;
    this.appShell = appShell;

    // Event delegation
    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      if (action === 'pick-movie') {
        this.onPickMovie();
      }
    });
  }

  onPickMovie() {
    console.log('[Tonight] TODO: Pick random movie from pool');
  }
}
