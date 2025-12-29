class WatchedScreen {
  render(adapter) {
    const roomData = adapter.getRoomData();
    return `
      <div class="screen">
        <h2>Watched</h2>
        <p>Phase 0 placeholder</p>
        <p style="color: #666; font-size: 0.875rem; margin-top: 1rem;">
          Watched movies: ${roomData?.watchedMovies?.length || 0}
        </p>
      </div>
    `;
  }
}
