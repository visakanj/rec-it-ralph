import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { WatchedMovieCard } from '../components/WatchedMovieCard'
import { useAdapter } from '../context/AdapterContext'
import { useRoom } from '../hooks/useRoom'
import type { WatchedMovie } from '../types/data-adapter'

export default function WatchedScreen() {
  const navigate = useNavigate()
  const { adapter } = useAdapter()
  const roomCode = adapter?.getRoomCode()
  const roomData = useRoom(roomCode)

  // Error state for failed undo operations
  const [undoError, setUndoError] = useState<string | null>(null)

  const watchedMovies = roomData?.watchedMovies || []
  const contributors = roomData?.contributors || []

  // Handle undo watched movie
  const handleUndo = (movie: WatchedMovie) => {
    if (!adapter) {
      console.error('[WatchedScreen] Adapter not available')
      setUndoError('Failed to undo: Adapter not ready')
      return
    }

    // Double-check eligibility before calling adapter
    const timeDiff = Date.now() - movie.watchedAt
    const canUndo = timeDiff < 24 * 60 * 60 * 1000

    if (!canUndo) {
      console.warn('[WatchedScreen] Cannot undo - more than 24 hours have passed')
      setUndoError('Cannot undo - more than 24 hours have passed')
      return
    }

    console.log('[WatchedScreen] Undoing watched movie:', movie.title)

    try {
      const success = adapter.undoWatched(movie)

      if (success) {
        console.log('[WatchedScreen] ✓ Movie returned to pool:', movie.title)
        setUndoError(null) // Clear any previous errors
        // UI will update via real-time subscription from useRoom
      } else {
        console.warn('[WatchedScreen] Undo failed - time limit exceeded')
        setUndoError('Cannot undo - more than 24 hours have passed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[WatchedScreen] Undo error:', error)
      setUndoError(`Failed to undo: ${errorMessage}`)
    }
  }

  // Dismiss error banner
  const dismissError = () => {
    setUndoError(null)
  }

  // State A: No room joined
  if (!roomCode) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Watched" />

        <main className="pt-20 px-4 max-w-md mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">🏠</div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">No room joined</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Join or create a room to see watched movies.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Go to Rooms
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    )
  }

  // State B: Room joined, but no watched movies yet
  if (watchedMovies.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Watched" />

        <main className="pt-20 px-4 max-w-md mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">📺</div>
            <h2 className="text-2xl font-bold mb-6 text-text-primary">No watched movies yet</h2>
            <button
              onClick={() => navigate('/pool')}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Go to Pool
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    )
  }

  // State C: Room joined, watched movies exist
  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar title="Watched" />

      <main className="pt-20 px-4 max-w-md mx-auto">
        {/* Header with count */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Watched</h1>
          <p className="text-sm text-text-secondary mt-1">
            {watchedMovies.length} {watchedMovies.length === 1 ? 'movie' : 'movies'}
          </p>
        </div>

        {/* Error banner (dismissible) */}
        {undoError && (
          <div
            onClick={dismissError}
            className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-red-500/15 transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm text-red-400">⚠️ {undoError}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismissError()
              }}
              className="text-red-400 hover:text-red-300 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Watched movies list */}
        <div className="space-y-3">
          {watchedMovies.map((movie: WatchedMovie, index: number) => (
            <WatchedMovieCard
              key={`${movie.title}-${movie.watchedAt}-${index}`}
              movie={movie}
              contributors={contributors}
              onUndo={() => handleUndo(movie)}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
