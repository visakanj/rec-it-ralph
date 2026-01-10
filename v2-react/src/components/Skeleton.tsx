/**
 * Skeleton loading component with shimmer animation
 * Uses Tailwind's animate-pulse for smooth loading effect
 */
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-surface-elevated rounded-xl animate-pulse ${className}`} />
)

/**
 * Movie Poster Skeleton - 2:3 aspect ratio matching MoviePosterTile
 */
export const MoviePosterSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="aspect-[2/3] w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
)

/**
 * Movie Grid Skeleton - 2-column grid for PoolScreen
 */
export const MovieGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 px-4">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <MoviePosterSkeleton key={i} />
    ))}
  </div>
)

/**
 * Watched Movie Card Skeleton - Horizontal card for WatchedScreen
 */
export const WatchedMovieCardSkeleton = () => (
  <div className="flex gap-4 p-4 bg-surface rounded-xl">
    <Skeleton className="w-20 h-28 flex-shrink-0" /> {/* Poster */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4" /> {/* Title */}
      <Skeleton className="h-4 w-1/2" /> {/* Year */}
      <Skeleton className="h-3 w-2/3" /> {/* Suggested by */}
      <Skeleton className="h-3 w-1/3" /> {/* Time ago */}
    </div>
  </div>
)

/**
 * Watched List Skeleton - Multiple cards for WatchedScreen
 */
export const WatchedListSkeleton = () => (
  <div className="space-y-3 px-4">
    {[1, 2, 3, 4].map(i => (
      <WatchedMovieCardSkeleton key={i} />
    ))}
  </div>
)

/**
 * Room Card Skeleton - For RoomsScreen room list
 */
export const RoomCardSkeleton = () => (
  <div className="p-4 bg-surface rounded-xl border border-border">
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-5 w-32" /> {/* Room name */}
      <Skeleton className="h-4 w-16" /> {/* Status badge */}
    </div>
    <Skeleton className="h-4 w-24" /> {/* Last active */}
  </div>
)

/**
 * Room List Skeleton - Multiple room cards for RoomsScreen
 */
export const RoomListSkeleton = () => (
  <div className="space-y-3 px-4">
    {[1, 2, 3].map(i => (
      <RoomCardSkeleton key={i} />
    ))}
  </div>
)

/**
 * Tonight Pick Skeleton - Large poster + metadata for TonightScreen
 */
export const TonightPickSkeleton = () => (
  <div className="px-4 pt-20">
    <div className="max-w-md mx-auto space-y-4">
      <Skeleton className="aspect-[2/3] w-full max-w-sm mx-auto" /> {/* Poster */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" /> {/* Title */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" /> {/* Year */}
          <Skeleton className="h-6 w-20" /> {/* Rating */}
        </div>
        <Skeleton className="h-4 w-full" /> {/* Overview line 1 */}
        <Skeleton className="h-4 w-full" /> {/* Overview line 2 */}
        <Skeleton className="h-4 w-2/3" /> {/* Overview line 3 */}
      </div>
    </div>
  </div>
)
