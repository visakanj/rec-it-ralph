import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Film, X } from 'lucide-react'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { ContributorChip } from '../components/ContributorChip'
import { MoviePosterTile } from '../components/MoviePosterTile'
import { ActionSheet } from '../components/ActionSheet'
import { useAdapter } from '../context/AdapterContext'
import { useRoom } from '../hooks/useRoom'

export default function PoolScreen() {
  const { adapter, isReady } = useAdapter()
  const navigate = useNavigate()
  const roomCode = adapter?.getRoomCode()
  const roomData = useRoom(roomCode)

  // Refs for auto-focus
  const contributorNameInputRef = useRef<HTMLInputElement>(null)
  const movieTitleInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [selectedContributor, setSelectedContributor] = useState<string>('all')
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false)
  const [isAddContributorOpen, setIsAddContributorOpen] = useState(false)
  const [isMainActionOpen, setIsMainActionOpen] = useState(false)

  // Add movie form state
  const [movieTitle, setMovieTitle] = useState('')
  const [movieContributorId, setMovieContributorId] = useState('')
  const [addMovieError, setAddMovieError] = useState('')
  const [addMovieStatus, setAddMovieStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  // Add contributor form state
  const [contributorName, setContributorName] = useState('')
  const [addContributorError, setAddContributorError] = useState('')
  const [addContributorStatus, setAddContributorStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  // Auto-focus contributor input when sheet opens
  useEffect(() => {
    if (isAddContributorOpen) {
      // Delay to allow ActionSheet animation to complete
      const timer = setTimeout(() => {
        contributorNameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAddContributorOpen])

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  // Not in a room
  if (!roomCode) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Pool" />
        <main className="pt-20 px-4 max-w-md mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">No Active Room</h2>
            <p className="text-text-secondary mb-6">Join a room to see your movie pool</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              Go to Rooms
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Room data loading
  if (!roomData) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Pool" />
        <main className="pt-20 px-4 max-w-md mx-auto">
          <div className="text-center py-12">
            <div className="text-text-secondary">Loading room data...</div>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const { theme, contributors, moviePool } = roomData

  // Filter movies by selected contributor
  const filteredMovies =
    selectedContributor === 'all'
      ? moviePool
      : moviePool.filter((m: any) => m.suggestedBy.includes(selectedContributor))

  // Map v1 movie shape to component props
  const movies = filteredMovies.map((movie: any) => ({
    id: movie.title,
    title: movie.title,
    year: movie.tmdbData?.release_date?.substring(0, 4) || '',
    imageUrl: movie.tmdbData?.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.tmdbData.poster_path}`
      : '',
    rating: movie.tmdbData?.vote_average?.toFixed(1) || '',
    suggestedBy: movie.suggestedBy
  }))

  // Build contributor color map for MoviePosterTile badges
  const contributorColors = contributors.reduce(
    (acc: any, c: any) => {
      acc[c.id] = c.color
      return acc
    },
    {} as { [key: string]: string }
  )

  // Count movies per contributor
  const contributorMovieCounts = contributors.reduce(
    (acc: any, c: any) => {
      acc[c.id] = moviePool.filter((m: any) => m.suggestedBy.includes(c.id)).length
      return acc
    },
    {} as { [key: string]: number }
  )

  // Handle add movie
  const handleAddMovie = async () => {
    setAddMovieError('')

    if (!movieTitle.trim()) {
      setAddMovieError('Movie title is required')
      return
    }

    if (!movieContributorId) {
      setAddMovieError('Please select a contributor')
      return
    }

    setAddMovieStatus('submitting')
    try {
      await adapter.addMovie(movieContributorId, movieTitle.trim())
      // Success - show confirmation, clear input, stay open
      setAddMovieStatus('success')
      setMovieTitle('')
      setAddMovieError('')

      // Auto-focus for next entry
      setTimeout(() => {
        movieTitleInputRef.current?.focus()
      }, 50)

      // Return to idle state after brief delay
      setTimeout(() => {
        setAddMovieStatus('idle')
      }, 600)
    } catch (error) {
      setAddMovieError('Failed to add movie. Please try again.')
      setAddMovieStatus('idle')
      console.error('[PoolScreen] Error adding movie:', error)
    }
  }

  // Handle add contributor
  const handleAddContributor = async () => {
    setAddContributorError('')

    if (!contributorName.trim()) {
      setAddContributorError('Contributor name is required')
      return
    }

    setAddContributorStatus('submitting')
    try {
      adapter.addContributor(contributorName.trim())
      // Success - show confirmation, clear input, stay open
      setAddContributorStatus('success')
      setContributorName('')
      setAddContributorError('')

      // Auto-focus for next entry
      setTimeout(() => {
        contributorNameInputRef.current?.focus()
      }, 50)

      // Return to idle state after brief delay
      setTimeout(() => {
        setAddContributorStatus('idle')
      }, 600)
    } catch (error) {
      setAddContributorError('Failed to add contributor. Please try again.')
      setAddContributorStatus('idle')
      console.error('[PoolScreen] Error adding contributor:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar
        title={theme || 'Movie Pool'}
        action={
          <button
            onClick={() => setIsMainActionOpen(true)}
            className="p-2 hover:bg-surface rounded-full transition-colors"
          >
            <Plus className="w-6 h-6 text-text-primary" />
          </button>
        }
      />

      <main className="pt-20">
        {/* Contributors filter section */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto overflow-y-visible py-2 scrollbar-hide">
            {/* "All" chip */}
            <ContributorChip
              id="all"
              name="All"
              color="#3B82F6"
              active={selectedContributor === 'all'}
              onClick={() => setSelectedContributor('all')}
              movieCount={moviePool.length}
            />

            {/* Contributor chips */}
            {contributors.map((contributor: any) => (
              <ContributorChip
                key={contributor.id}
                id={contributor.id}
                name={contributor.name}
                color={contributor.color}
                active={selectedContributor === contributor.id}
                onClick={() => setSelectedContributor(contributor.id)}
                movieCount={contributorMovieCounts[contributor.id]}
              />
            ))}
          </div>
        </div>

        {/* Movie grid */}
        <div className="px-4">
          {movies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold mb-2">
                {selectedContributor === 'all'
                  ? 'No Movies Yet'
                  : 'No Movies from This Contributor'}
              </h3>
              <p className="text-text-secondary mb-6">
                {selectedContributor === 'all'
                  ? 'Start building your movie pool'
                  : 'This contributor hasn\'t added any movies yet'}
              </p>
              {selectedContributor === 'all' && (
                <button
                  onClick={() => setIsAddMovieOpen(true)}
                  className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  Add First Movie
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {movies.map((movie: any) => (
                <MoviePosterTile
                  key={movie.id}
                  title={movie.title}
                  year={movie.year}
                  imageUrl={movie.imageUrl}
                  rating={movie.rating}
                  suggestedBy={movie.suggestedBy}
                  contributorColors={contributorColors}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Main action sheet - Add Movie or Add Contributor */}
      <ActionSheet
        isOpen={isMainActionOpen}
        onClose={() => setIsMainActionOpen(false)}
        title="Add to Pool"
      >
        <button
          onClick={() => {
            setIsMainActionOpen(false)
            setIsAddMovieOpen(true)
          }}
          className="w-full flex items-center p-4 rounded-2xl hover:bg-surface active:bg-surface-elevated transition-colors group text-left"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:bg-surface-elevated transition-all border border-transparent group-hover:border-border-highlight">
            <Film className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="font-semibold text-text-primary text-base">Add Movie</div>
            <div className="text-sm text-text-secondary mt-0.5">
              Add a movie to your pool
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setIsMainActionOpen(false)
            setIsAddContributorOpen(true)
          }}
          className="w-full flex items-center p-4 rounded-2xl hover:bg-surface active:bg-surface-elevated transition-colors group text-left"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:bg-surface-elevated transition-all border border-transparent group-hover:border-border-highlight">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="font-semibold text-text-primary text-base">Add Contributor</div>
            <div className="text-sm text-text-secondary mt-0.5">
              Invite someone to suggest movies
            </div>
          </div>
        </button>
      </ActionSheet>

      {/* Add Movie ActionSheet */}
      <ActionSheet
        isOpen={isAddMovieOpen}
        onClose={() => {
          setIsAddMovieOpen(false)
          setMovieTitle('')
          setMovieContributorId('')
          setAddMovieError('')
        }}
        title="Add Movie"
      >
        <div className="space-y-4">
          {/* Contributor dropdown */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Contributor
            </label>
            <select
              value={movieContributorId}
              onChange={(e) => {
                setMovieContributorId(e.target.value)
                setAddMovieError('')
              }}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Select a contributor</option>
              {contributors.map((contributor: any) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Movie title input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Movie Title
            </label>
            <input
              ref={movieTitleInputRef}
              type="text"
              value={movieTitle}
              onChange={(e) => {
                setMovieTitle(e.target.value)
                setAddMovieError('')
              }}
              placeholder="e.g. The Matrix"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddMovie()
                }
              }}
            />
          </div>

          {/* Error message */}
          {addMovieError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{addMovieError}</p>
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAddMovie}
            disabled={addMovieStatus !== 'idle'}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-tertiary text-white rounded-xl font-medium transition-colors"
          >
            {addMovieStatus === 'submitting' && 'Adding...'}
            {addMovieStatus === 'success' && 'Added ✓'}
            {addMovieStatus === 'idle' && 'Add Movie'}
          </button>
        </div>
      </ActionSheet>

      {/* Add Contributor ActionSheet */}
      <ActionSheet
        isOpen={isAddContributorOpen}
        onClose={() => {
          setIsAddContributorOpen(false)
          setContributorName('')
          setAddContributorError('')
        }}
        title="Add Contributor"
      >
        <div className="space-y-4">
          {/* Contributor name input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Name
            </label>
            <input
              ref={contributorNameInputRef}
              type="text"
              value={contributorName}
              onChange={(e) => {
                setContributorName(e.target.value)
                setAddContributorError('')
              }}
              placeholder="e.g. Alice"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddContributor()
                }
              }}
            />
          </div>

          {/* Error message */}
          {addContributorError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{addContributorError}</p>
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAddContributor}
            disabled={addContributorStatus !== 'idle'}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-tertiary text-white rounded-xl font-medium transition-colors"
          >
            {addContributorStatus === 'submitting' && 'Adding...'}
            {addContributorStatus === 'success' && 'Added ✓'}
            {addContributorStatus === 'idle' && 'Add Contributor'}
          </button>
        </div>
      </ActionSheet>

      <BottomNav />
    </div>
  )
}
