import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { ContributorChip } from '../components/ContributorChip'
import { StreamingServicePill } from '../components/StreamingServicePill'
import { TonightPickSkeleton } from '../components/Skeleton'
import { useAdapter } from '../context/AdapterContext'
import { useRoom } from '../hooks/useRoom'
import { useStreamingProviders } from '../hooks/useStreamingProviders'
import { getTMDBImageUrl } from '../config/tmdb'

export default function TonightScreen() {
  const navigate = useNavigate()
  const { adapter } = useAdapter()
  const roomData = useRoom(adapter?.getRoomCode() || null)

  const [isMarkingWatched, setIsMarkingWatched] = useState(false)
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const overviewRef = useRef<HTMLParagraphElement>(null)

  const tonightPick = roomData?.tonightPick
  const contributors = roomData?.contributors || []

  // Fetch streaming providers for tonight's pick
  const { providers } = useStreamingProviders(tonightPick?.tmdbData?.id)

  // Check if overview text is truncated (exceeds 5 lines)
  useEffect(() => {
    if (overviewRef.current) {
      // Small delay to ensure content is fully rendered before measuring
      const timer = setTimeout(() => {
        if (overviewRef.current) {
          const isTruncated = overviewRef.current.scrollHeight > overviewRef.current.clientHeight
          setShowExpandButton(isTruncated)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [tonightPick?.tmdbData?.overview, isOverviewExpanded])

  // Redirect to /pick if no movie picked
  useEffect(() => {
    if (roomData && !tonightPick) {
      navigate('/pick')
    }
  }, [tonightPick, roomData, navigate])

  const handleMarkAsWatched = async () => {
    if (!tonightPick || !adapter || isMarkingWatched) return

    setIsMarkingWatched(true)
    try {
      await adapter.markWatched(tonightPick)
      // Navigate after marking watched (movie will be moved to watched list, tonightPick cleared)
      navigate('/pool')
    } catch (error) {
      console.error('[TonightScreen] Failed to mark as watched:', error)
    } finally {
      setIsMarkingWatched(false)
    }
  }

  const handlePickAgain = () => {
    if (!adapter) return
    adapter.clearTonightPick()
    navigate('/pick')
  }

  // Get contributor objects from IDs
  const getContributors = (suggestedByIds: string[]) => {
    if (!suggestedByIds || suggestedByIds.length === 0) return []

    return suggestedByIds
      .map((id) => contributors.find((c: any) => c.id === id))
      .filter(Boolean) as Array<{ id: string; name: string; color: string }>
  }

  if (!tonightPick) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Tonight's Pick" />
        <TonightPickSkeleton />
        <BottomNav />
      </div>
    )
  }

  const movieContributors = getContributors(tonightPick.suggestedBy || [])

  const posterUrl = tonightPick.tmdbData?.posterPath
    ? `https://image.tmdb.org/t/p/w500${tonightPick.tmdbData.posterPath}`
    : null

  const year = tonightPick.tmdbData?.releaseDate
    ? new Date(tonightPick.tmdbData.releaseDate).getFullYear()
    : null
  const rating = tonightPick.tmdbData?.voteAverage
    ? tonightPick.tmdbData.voteAverage.toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      {/* No back arrow on Tonight tab */}
      <AppBar title="Tonight's Pick" />

      <main className="pt-16 px-4 max-w-md mx-auto pb-4">
        <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-xl">
          {/* Movie Poster with Contributor Pills Overlay */}
          <div className="relative w-full">
            {posterUrl ? (
              <>
                <img
                  src={posterUrl}
                  alt={tonightPick.title}
                  className="w-full aspect-[4/5] object-cover max-h-80"
                  onError={(e) => {
                    console.error('[TonightScreen] Failed to load poster:', posterUrl)
                    console.log('[TonightScreen] Movie data:', tonightPick)
                    e.currentTarget.style.display = 'none'
                  }}
                />
                {/* Gradient overlay - Orbit orb effect */}
                <div className="absolute inset-0 bg-gradient-orb opacity-20 mix-blend-overlay pointer-events-none"></div>
              </>
            ) : (
              <div className="w-full aspect-[4/5] bg-surface-elevated flex items-center justify-center max-h-80">
                <span className="text-6xl">🎬</span>
              </div>
            )}

            {/* Contributor Pills - Centered Near Bottom, Overlaid */}
            {movieContributors.length > 0 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-4">
                {movieContributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className="backdrop-blur-md bg-black/40 rounded-full"
                  >
                    <ContributorChip
                      id={contributor.id}
                      name={contributor.name}
                      color={contributor.color}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="p-4">
            {/* Title and Meta */}
            <div className="mb-3">
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {tonightPick.title}
              </h2>
              <div className="flex items-center gap-3 text-text-secondary text-sm">
                {year && <span>{year}</span>}
                {rating && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    {rating}
                  </span>
                )}
              </div>
            </div>

            {/* Where to Watch (streaming providers) */}
            {providers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Where to Watch
                </h3>
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

            {/* Overview/Premise */}
            {tonightPick.tmdbData?.overview && (
              <div className="mb-4">
                <p
                  ref={overviewRef}
                  className={`text-text-secondary text-sm leading-relaxed ${isOverviewExpanded ? '' : 'line-clamp-5'}`}
                >
                  {tonightPick.tmdbData.overview}
                </p>
                {showExpandButton && (
                  <button
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="mt-2 text-accent text-sm font-medium flex items-center gap-1 hover:text-accent-hover transition-colors"
                  >
                    {isOverviewExpanded ? (
                      <>
                        Show less
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show more
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleMarkAsWatched}
                disabled={isMarkingWatched}
                className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isMarkingWatched ? 'Marking...' : '✓ Mark as Watched'}
              </button>
              <button
                onClick={handlePickAgain}
                className="w-full px-4 py-2.5 bg-surface-elevated hover:bg-surface border border-border text-text-primary font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Pick Again
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
