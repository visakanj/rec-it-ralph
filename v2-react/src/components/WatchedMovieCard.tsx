import type { WatchedMovie, Contributor } from '../types/data-adapter'

interface WatchedMovieCardProps {
  movie: WatchedMovie
  contributors: Contributor[]
  onUndo: () => void
}

/**
 * WatchedMovieCard - Displays a watched movie with metadata and undo functionality
 *
 * Layout: Horizontal card with poster on left, info on right
 * Shows: poster, title, year, rating, "watched X ago", "suggested by", undo button
 * Undo: Enabled if < 24 hours, disabled if > 24 hours
 */
export function WatchedMovieCard({ movie, contributors, onUndo }: WatchedMovieCardProps) {
  // Helper: Check if undo is allowed (< 24 hours)
  const canUndo = (): boolean => {
    if (!movie.watchedAt) return false
    const timeDiff = Date.now() - movie.watchedAt
    return timeDiff < 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }

  // Helper: Calculate hours remaining for undo
  const getHoursRemaining = (): number => {
    if (!movie.watchedAt) return 0
    const timeDiff = Date.now() - movie.watchedAt
    const hoursRemaining = Math.max(0, Math.floor((24 * 60 * 60 * 1000 - timeDiff) / (60 * 60 * 1000)))
    return hoursRemaining
  }

  // Helper: Format "watched X ago" timestamp
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    } else {
      return 'Just now'
    }
  }

  // Helper: Get contributor names from IDs
  const getContributorNames = (suggestedByIds: string[]): string => {
    if (!suggestedByIds || suggestedByIds.length === 0) return 'Unknown'

    const names = suggestedByIds.map(id => {
      const contributor = contributors.find(c => c.id === id)
      if (contributor) {
        return contributor.name
      }
      // Fallback: use ID as initials
      return id.substring(0, 2).toUpperCase()
    })

    return names.join(', ')
  }

  const posterUrl = movie.tmdbData?.posterPath
    ? `https://image.tmdb.org/t/p/w200${movie.tmdbData.posterPath}`
    : null

  const year = movie.tmdbData?.releaseDate
    ? new Date(movie.tmdbData.releaseDate).getFullYear()
    : null

  const rating = movie.tmdbData?.voteAverage
    ? movie.tmdbData.voteAverage.toFixed(1)
    : null

  const timeAgo = formatTimeAgo(movie.watchedAt)
  const contributorNames = getContributorNames(movie.suggestedBy || [])
  const undoAllowed = canUndo()
  const hoursLeft = getHoursRemaining()

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all hover:border-border-hover">
      {/* Movie content */}
      <div className="flex gap-4 p-4">
        {/* Poster */}
        <div className="flex-shrink-0 w-20">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-[120px] object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-[120px] rounded-lg bg-surface-elevated flex items-center justify-center">
              <span className="text-3xl opacity-30">🎬</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Title */}
          <h3 className="text-base font-semibold text-text-primary truncate">
            {movie.title}
          </h3>

          {/* Meta: Year and Rating */}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {year && <span>{year}</span>}
            {year && rating && <span>·</span>}
            {rating && (
              <span className="flex items-center gap-0.5">
                <span className="text-yellow-400">★</span>
                {rating}
              </span>
            )}
          </div>

          {/* Watched timestamp */}
          <div className="text-xs text-text-secondary" title={new Date(movie.watchedAt).toLocaleString()}>
            Watched {timeAgo}
          </div>

          {/* Suggested by */}
          <div className="text-xs text-text-secondary truncate">
            Suggested by: {contributorNames}
          </div>
        </div>
      </div>

      {/* Undo button */}
      <div className="px-4 pb-4">
        {undoAllowed ? (
          <button
            onClick={onUndo}
            className="w-full py-2.5 px-4 bg-surface-elevated hover:bg-surface border border-border text-text-primary font-semibold rounded-lg transition-all active:scale-[0.98] text-sm"
            title={`Undo within ${hoursLeft}h`}
          >
            ↩ Undo ({hoursLeft}h left)
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 bg-surface border border-border/30 text-text-tertiary font-semibold rounded-lg cursor-not-allowed opacity-50 text-sm"
            title="Undo expired (>24h)"
          >
            Undo expired
          </button>
        )}
      </div>
    </div>
  )
}
