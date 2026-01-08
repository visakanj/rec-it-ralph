import { useState } from 'react'
import { Film, Calendar, Star } from 'lucide-react'
import { ActionSheet } from './ActionSheet'
import { StreamingServicePill } from './StreamingServicePill'
import { useStreamingProviders } from '../hooks/useStreamingProviders'
import { getTMDBImageUrl } from '../config/tmdb'

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
    tmdbId?: number  // Phase 6: For fetching streaming providers
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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // Fetch streaming providers for this movie
  const { providers } = useStreamingProviders(movie?.tmdbId)

  const handleRemoveClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleConfirmRemove = () => {
    setShowRemoveConfirm(false)
    onRemove()
  }

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false)
  }

  if (!movie) return null

  // Get contributors who suggested this movie
  const movieContributors = movie.suggestedBy
    .map(id => contributors.find(c => c.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; color: string }>

  return (
    <>
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

      {/* Where to Watch (streaming providers) */}
      {providers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Where to Watch</h4>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <StreamingServicePill
                key={provider.provider_id}
                name={provider.provider_name}
                logo={getTMDBImageUrl(provider.logo_path, 'w92') || ''}
              />
            ))}
          </div>
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
          onClick={handleRemoveClick}
          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-xl transition-colors active:scale-[0.98]"
        >
          Remove from Pool
        </button>
      </div>
    </ActionSheet>

    {/* Remove confirmation ActionSheet */}
    <ActionSheet isOpen={showRemoveConfirm} onClose={handleCancelRemove}>
      <div className="text-center py-4">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Remove from Pool?</h3>
        <p className="text-text-secondary mb-6">
          Are you sure you want to remove "{movie.title}" from the pool?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirmRemove}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors active:scale-[0.98]"
          >
            Yes, Remove
          </button>
          <button
            onClick={handleCancelRemove}
            className="w-full py-3 px-4 bg-surface-elevated hover:bg-surface border border-border text-text-primary font-semibold rounded-xl transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </ActionSheet>
    </>
  )
}
