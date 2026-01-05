import { Film, Calendar, Star } from 'lucide-react'
import { ActionSheet } from './ActionSheet'

interface MovieDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  movie: {
    title: string
    year: string
    imageUrl: string
    rating: string
    overview?: string  // TMDB synopsis
    suggestedBy: string[]
    originalIndex: number
  } | null
  contributors: Array<{ id: string; name: string; color: string }>
  onRemove: () => void
}

export function MovieDetailsSheet({
  isOpen,
  onClose,
  movie,
  contributors,
  onRemove
}: MovieDetailsSheetProps) {
  if (!movie) return null

  // Get contributors who suggested this movie
  const movieContributors = movie.suggestedBy
    .map(id => contributors.find(c => c.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; color: string }>

  return (
    <ActionSheet isOpen={isOpen} onClose={onClose}>
      {/* Top section: Poster left, details right */}
      <div className="flex gap-4 mb-6">
        {/* Poster */}
        <div className="flex-shrink-0 w-[132px] rounded-xl overflow-hidden bg-surface">
          {/* 132px width, 2:3 aspect ratio = 198px height */}
          {movie.imageUrl ? (
            <img
              src={movie.imageUrl}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[2/3] flex items-center justify-center text-text-tertiary">
              <Film size={40} />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          {/* Title */}
          <h3 className="text-2xl font-bold text-text-primary leading-tight">
            {movie.title}
          </h3>

          {/* Year */}
          {movie.year && (
            <div className="flex items-center gap-1.5 text-text-secondary text-sm">
              <Calendar size={16} />
              <span>{movie.year}</span>
            </div>
          )}

          {/* Rating */}
          {movie.rating && (
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-text-primary">
                {movie.rating}/10
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Synopsis (full width) */}
      {movie.overview && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-primary mb-2">Synopsis</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {movie.overview}
          </p>
        </div>
      )}

      {/* Contributors (full width) */}
      {movieContributors.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Suggested by</h4>
          <div className="flex flex-wrap gap-2">
            {movieContributors.map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: contributor.color }}
                >
                  {contributor.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {contributor.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove button (fixed at bottom) */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={onRemove}
          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-xl transition-colors active:scale-[0.98]"
        >
          Remove from Pool
        </button>
      </div>
    </ActionSheet>
  )
}
