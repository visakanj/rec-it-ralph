import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, UserPlus, Film, X, ChevronLeft, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '../components/BottomNav'
import { ContributorChip } from '../components/ContributorChip'
import { MoviePosterTile } from '../components/MoviePosterTile'
import { ActionSheet } from '../components/ActionSheet'
import { MovieDetailsSheet } from '../components/MovieDetailsSheet'
import { MovieGridSkeleton } from '../components/Skeleton'
import { useAdapter } from '../context/AdapterContext'
import { useRoom } from '../hooks/useRoom'

export default function PoolScreen() {
  const { adapter, isReady } = useAdapter()
  const navigate = useNavigate()
  const location = useLocation()
  const roomCode = adapter?.getRoomCode()
  const roomData = useRoom(roomCode)

  // Refs for auto-focus
  const contributorNameInputRef = useRef<HTMLInputElement>(null)
  const movieTitleInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [selectedContributor, setSelectedContributor] = useState<string>('all')
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false)
  const [isAddContributorOpen, setIsAddContributorOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMovieDetailsOpen, setIsMovieDetailsOpen] = useState(false)
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<any>(null)

  // Add movie form state (2-step flow)
  const [addMovieStep, setAddMovieStep] = useState<1 | 2>(1)
  const [selectedContributorForMovie, setSelectedContributorForMovie] = useState<string | null>(null)
  const [movieTitle, setMovieTitle] = useState('')
  const [addMovieError, setAddMovieError] = useState('')
  const [addMovieStatus, setAddMovieStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  // Add contributor form state
  const [contributorName, setContributorName] = useState('')
  const [addContributorError, setAddContributorError] = useState('')
  const [addContributorStatus, setAddContributorStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [shareUrlCopied, setShareUrlCopied] = useState(false)

  // Auto-join name prompt state (separate from manual add contributor)
  const [showAutoJoinNamePrompt, setShowAutoJoinNamePrompt] = useState(false)
  const [autoJoinName, setAutoJoinName] = useState('')
  const [autoJoinNameError, setAutoJoinNameError] = useState('')
  const [isAddingAutoJoinContributor, setIsAddingAutoJoinContributor] = useState(false)

  // Auto-focus movie title input when reaching Step 2
  useEffect(() => {
    if (addMovieStep === 2) {
      // Delay to allow slide animation to complete (spring animation needs ~400-450ms)
      const timer = setTimeout(() => {
        movieTitleInputRef.current?.focus()
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [addMovieStep])

  // Detect auto-join from share URL and show name prompt
  useEffect(() => {
    if (!isReady || !adapter) return // Wait for adapter to be ready

    const state = location.state as { showNamePrompt?: boolean; autoJoined?: boolean } | null

    if (state?.showNamePrompt && state?.autoJoined) {
      // Check if user already has saved name
      const savedName = localStorage.getItem('recitralph:v2:contributorName')

      if (savedName) {
        // Auto-add contributor with saved name
        console.log('[PoolScreen] Auto-adding contributor with saved name:', savedName)

        // Add contributor directly (inline to avoid dependency issues)
        try {
          adapter.addContributor(savedName)
          console.log('[PoolScreen] Auto-join contributor added:', savedName)
        } catch (error) {
          console.error('[PoolScreen] Failed to auto-add contributor:', error)
          // Show prompt as fallback
          setShowAutoJoinNamePrompt(true)
        }
      } else {
        // Show name prompt
        console.log('[PoolScreen] Showing auto-join name prompt')
        setShowAutoJoinNamePrompt(true)
      }

      // Clear navigation state to prevent re-showing on refresh
      window.history.replaceState({}, '')
    }
  }, [location, isReady, adapter])

  // Auto-open add movie sheet if navigated from Tonight tab
  useEffect(() => {
    const state = location.state as { openAddMovieSheet?: boolean } | null

    if (state?.openAddMovieSheet && roomData?.contributors?.length > 0) {
      setIsAddMovieOpen(true)
      // Clear navigation state to prevent re-opening on refresh
      window.history.replaceState({}, '')
    }
  }, [location, roomData?.contributors])

  // Auto-redirect to Rooms if no room is selected (unless auto-joining)
  useEffect(() => {
    if (!roomCode && isReady) {
      // Check if this is an auto-join flow
      const state = location.state as { showNamePrompt?: boolean; autoJoined?: boolean } | null

      // If NOT auto-joining, redirect to Rooms
      if (!state?.autoJoined) {
        navigate('/', { replace: true })
      }
    }
  }, [roomCode, isReady, location.state, navigate])

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
        <main className="pt-8 px-4 max-w-md mx-auto">
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
        <main className="pt-8">
          <MovieGridSkeleton />
        </main>
        <BottomNav />
      </div>
    )
  }

  const { contributors, moviePool } = roomData

  // Filter movies by selected contributor
  const filteredMovies =
    selectedContributor === 'all'
      ? moviePool
      : moviePool.filter((m: any) => m.suggestedBy.includes(selectedContributor))

  // Map v1 movie shape to component props
  const movies = filteredMovies.map((movie: any) => ({
    id: movie.title,
    title: movie.title,
    year: movie.tmdbData?.releaseDate?.substring(0, 4) || '',
    imageUrl: movie.tmdbData?.posterPath
      ? `https://image.tmdb.org/t/p/w342${movie.tmdbData.posterPath}`
      : '',
    rating: movie.tmdbData?.voteAverage?.toFixed(1) || '',
    overview: movie.tmdbData?.overview || '',
    suggestedBy: movie.suggestedBy,
    originalIndex: moviePool.findIndex((m: any) => m.title === movie.title && m.addedAt === movie.addedAt),
    tmdbId: movie.tmdbData?.id  // Phase 6: For fetching streaming providers
  }))

  // Build contributor color map for MoviePosterTile badges
  const contributorColors = contributors.reduce(
    (acc: any, c: any) => {
      acc[c.id] = c.color
      return acc
    },
    {} as { [key: string]: string }
  )

  // Build contributor name map for MoviePosterTile badges
  const contributorNames = contributors.reduce(
    (acc: any, c: any) => {
      acc[c.id] = c.name
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

    if (!selectedContributorForMovie) {
      setAddMovieError('Please select a contributor')
      return
    }

    setAddMovieStatus('submitting')
    try {
      await adapter.addMovie(selectedContributorForMovie, movieTitle.trim())
      // Success - show confirmation, clear input only (keep contributor), stay open on step 2
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

  // Handle movie poster click
  const handleMovieClick = (movieIndex: number) => {
    const movie = movies.find((m: any) => m.originalIndex === movieIndex)
    if (movie) {
      setSelectedMovieForDetails(movie)
      setIsMovieDetailsOpen(true)
    }
  }

  // Handle remove movie
  const handleRemoveMovie = () => {
    if (!selectedMovieForDetails || !adapter) return

    console.log('[PoolScreen] Removing movie:', selectedMovieForDetails.title)
    adapter.removeMovie(selectedMovieForDetails.originalIndex)

    // Close sheet
    setIsMovieDetailsOpen(false)
    setSelectedMovieForDetails(null)
  }

  // Handle copy share URL
  const handleCopyShareUrl = async () => {
    if (!roomCode) return

    const shareUrl = `${window.location.origin}/v2-react-build/join-room?code=${roomCode}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareUrlCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setShareUrlCopied(false)
      }, 2000)
    } catch (error) {
      console.error('[PoolScreen] Failed to copy URL:', error)
    }
  }

  // Handle add contributor for auto-join flow
  const handleAddContributorWithName = async (name: string) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setAutoJoinNameError('Name is required')
      return
    }

    if (trimmedName.length > 20) {
      setAutoJoinNameError('Name must be 20 characters or less')
      return
    }

    setIsAddingAutoJoinContributor(true)
    setAutoJoinNameError('')

    try {
      adapter.addContributor(trimmedName)

      // Save name for future auto-joins
      localStorage.setItem('recitralph:v2:contributorName', trimmedName)

      console.log('[PoolScreen] Auto-join contributor added:', trimmedName)

      // Close prompt (un-blur pool view)
      setShowAutoJoinNamePrompt(false)
      setAutoJoinName('')
    } catch (error) {
      console.error('[PoolScreen] Failed to add contributor:', error)
      setAutoJoinNameError('Failed to add you to the room')
    } finally {
      setIsAddingAutoJoinContributor(false)
    }
  }

  // Handle auto-join name submit
  const handleAutoJoinNameSubmit = () => {
    handleAddContributorWithName(autoJoinName)
  }

  // Floating FAB handlers
  const handleOpenAddMovieSheet = () => {
    setIsOpen(false)
    setIsAddMovieOpen(true)
  }

  const handleOpenAddContributorSheet = () => {
    setIsOpen(false)
    setIsAddContributorOpen(true)
  }

  const toggleOpen = () => setIsOpen(!isOpen)

  // Animation variants for floating FAB
  const fabVariants = {
    closed: {
      rotate: 0
    },
    open: {
      rotate: 45
    }
  }

  const menuVariants = {
    closed: {
      opacity: 0,
      y: 20,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05,
        type: 'spring' as const,
        stiffness: 400,
        damping: 25
      }
    })
  }

  const labelVariants = {
    closed: {
      opacity: 0,
      x: 20
    },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05 + 0.1,
        duration: 0.2
      }
    })
  }

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in relative">
      {/* Main pool content - blur when auto-join name prompt is shown */}
      <div className={showAutoJoinNamePrompt ? 'filter blur-sm pointer-events-none' : ''}>
      <main className="pt-8 px-4 max-w-md mx-auto">
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
            Pool
          </h2>
        </div>

        {/* Contributors filter section */}
        <div className="mb-4">
          <div className="relative">
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
            {/* Right fade gradient to indicate more content */}
            <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Movie grid */}
        <div className="relative">
          {movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {selectedContributor === 'all' ? (
                <>
                  {/* Illustration */}
                  <div className="mb-6">
                    <img
                      src={`${import.meta.env.BASE_URL}no_movies_added.jpg`}
                      alt="No movies yet"
                      className="w-[220px] h-[220px] object-cover rounded-2xl"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-text-primary mb-3">
                    No movies yet
                  </h3>

                  {/* Helper text */}
                  <p className="text-base text-text-secondary mb-6">
                    Start building your movie pool
                  </p>

                  {/* Primary CTA */}
                  <button
                    onClick={() => setIsAddMovieOpen(true)}
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all active:scale-[0.98]"
                  >
                    Add movie
                  </button>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-bold mb-2">
                    No Movies from This Contributor
                  </h3>
                  <p className="text-text-secondary mb-6">
                    This contributor hasn't added any movies yet
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4 transition-all duration-300">
              {movies.map((movie: any) => (
                <MoviePosterTile
                  key={movie.id}
                  title={movie.title}
                  year={movie.year}
                  imageUrl={movie.imageUrl}
                  rating={movie.rating}
                  suggestedBy={movie.suggestedBy}
                  contributorColors={contributorColors}
                  contributorNames={contributorNames}
                  onClick={() => handleMovieClick(movie.originalIndex)}
                />
              ))}
            </div>
          )}
          {/* Bottom fade gradient to indicate more content */}
          {movies.length > 4 && (
            <div className="fixed bottom-[60px] left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>
      </main>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button Group */}
      <div className="fixed bottom-[100px] right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Add Movie Option */}
              <div className="flex items-center gap-4 pr-1">
                <motion.span
                  custom={1}
                  variants={labelVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="text-white font-bold text-base drop-shadow-md whitespace-nowrap"
                >
                  Add movie
                </motion.span>
                <motion.button
                  custom={1}
                  variants={menuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={handleOpenAddMovieSheet}
                  className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-xl hover:bg-accent-hover transition-colors"
                >
                  <Film size={24} />
                </motion.button>
              </div>

              {/* Add Contributor Option */}
              <div className="flex items-center gap-4 pr-1">
                <motion.span
                  custom={0}
                  variants={labelVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="text-white font-bold text-base drop-shadow-md whitespace-nowrap"
                >
                  Share room
                </motion.span>
                <motion.button
                  custom={0}
                  variants={menuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={handleOpenAddContributorSheet}
                  className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-xl hover:bg-accent-hover transition-colors"
                >
                  <UserPlus size={24} />
                </motion.button>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <motion.button
          onClick={toggleOpen}
          animate={isOpen ? 'open' : 'closed'}
          variants={fabVariants}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-colors z-50 ${
            isOpen
              ? 'bg-white/10 backdrop-blur-2xl border border-white/30 hover:bg-white/20'
              : 'bg-accent hover:bg-accent-hover'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={32} />
        </motion.button>
      </div>

      {/* Add Movie ActionSheet (2-step flow) */}
      <ActionSheet
        isOpen={isAddMovieOpen}
        onClose={() => {
          setIsAddMovieOpen(false)
          setAddMovieStep(1)
          setSelectedContributorForMovie(null)
          setMovieTitle('')
          setAddMovieError('')
          setAddMovieStatus('idle')
        }}
        title={addMovieStep === 1 ? "Who's adding this movie?" : "Add movie"}
        icon={<Film size={28} />}
      >
        <div className="relative overflow-x-hidden overflow-y-visible px-2 -mx-2">
          <AnimatePresence mode="wait" initial={false}>
            {addMovieStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="space-y-4 h-[280px]"
              >
                {/* Step 1: Contributor Selection */}

                {/* Contributor Pills Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {contributors.map((contributor: any) => (
                    <button
                      key={contributor.id}
                      onClick={() => {
                        setSelectedContributorForMovie(contributor.id)
                        setAddMovieStep(2)
                      }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-surface hover:bg-surface-elevated border border-border hover:border-accent transition-all group"
                    >
                      {/* Colored circle */}
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold shadow-sm"
                        style={{ backgroundColor: contributor.color }}
                      >
                        {contributor.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Contributor name */}
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {contributor.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onAnimationComplete={() => {
                  // Focus input when animation completes
                  movieTitleInputRef.current?.focus()
                }}
                className="space-y-4 h-[280px]"
              >
                {/* Step 2: Movie Title Entry */}

                {/* Selected Contributor Header */}
                <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    {/* Colored circle */}
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                      style={{
                        backgroundColor:
                          contributors.find((c: any) => c.id === selectedContributorForMovie)
                            ?.color || '#3B82F6',
                      }}
                    >
                      {contributors
                        .find((c: any) => c.id === selectedContributorForMovie)
                        ?.name.charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {contributors.find((c: any) => c.id === selectedContributorForMovie)?.name}
                    </span>
                  </div>
                  {/* Change button */}
                  <button
                    onClick={() => setAddMovieStep(1)}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Change
                  </button>
                </div>

                {/* Movie Title Input */}
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
                  <div className="flex items-center gap-2 p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-xl">
                    <X className="w-4 h-4 text-semantic-error flex-shrink-0" />
                    <p className="text-sm text-semantic-error">{addMovieError}</p>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ActionSheet>

      {/* Add Contributor ActionSheet */}
      <ActionSheet
        isOpen={isAddContributorOpen}
        onClose={() => {
          setIsAddContributorOpen(false)
          setContributorName('')
          setAddContributorError('')
          setShareUrlCopied(false)
        }}
        title="Share room"
        icon={<UserPlus size={28} />}
      >
        <div className="space-y-6">
          {/* Share URL Section */}
          <div className="space-y-3">
            {/* Room Code Display */}
            <div className="p-4 bg-surface-elevated rounded-xl border border-border">
              <div className="text-xs text-text-tertiary mb-1">Room Code</div>
              <div className="text-2xl font-bold text-text-primary tracking-wider font-mono">
                {roomCode}
              </div>
            </div>

            {/* Copy URL Button */}
            <button
              onClick={handleCopyShareUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface hover:bg-surface-elevated border border-border hover:border-accent rounded-xl font-medium transition-colors"
            >
              {shareUrlCopied ? (
                <>
                  <Check className="w-5 h-5 text-accent-orange" />
                  <span className="text-accent-orange">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">Copy Share Link</span>
                </>
              )}
            </button>
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-elevated text-text-tertiary">OR</span>
            </div>
          </div>

          {/* Manual Add Section */}
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Add contributor manually
            </p>

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
              <div className="flex items-center gap-2 p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-xl">
                <X className="w-4 h-4 text-semantic-error flex-shrink-0" />
                <p className="text-sm text-semantic-error">{addContributorError}</p>
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
        </div>
      </ActionSheet>
      </div>

      {/* Auto-Join Name Prompt ActionSheet */}
      <ActionSheet
        isOpen={showAutoJoinNamePrompt}
        onClose={() => {
          setShowAutoJoinNamePrompt(false)
          setAutoJoinName('')
          setAutoJoinNameError('')
        }}
        title="What's your name?"
      >
        <p className="text-sm text-text-secondary mb-4">
          Welcome! Let's add you to <span className="font-bold">{roomData?.theme}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Your Name
            </label>
            <input
              autoFocus
              type="text"
              value={autoJoinName}
              onChange={(e) => {
                setAutoJoinName(e.target.value)
                setAutoJoinNameError('')
              }}
              placeholder="e.g. Sarah"
              onKeyPress={(e) => e.key === 'Enter' && handleAutoJoinNameSubmit()}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={isAddingAutoJoinContributor}
            />
          </div>

          {autoJoinNameError && (
            <div className="px-4 py-3 bg-semantic-error/10 border border-semantic-error/20 rounded-xl">
              <p className="text-sm text-semantic-error">{autoJoinNameError}</p>
            </div>
          )}

          <button
            onClick={handleAutoJoinNameSubmit}
            disabled={isAddingAutoJoinContributor}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isAddingAutoJoinContributor ? 'Adding...' : 'Continue'}
          </button>
        </div>
      </ActionSheet>

      {/* Movie Details Sheet */}
      <MovieDetailsSheet
        isOpen={isMovieDetailsOpen}
        onClose={() => {
          setIsMovieDetailsOpen(false)
          setSelectedMovieForDetails(null)
        }}
        movie={selectedMovieForDetails}
        contributors={contributors}
        onRemove={handleRemoveMovie}
      />

      <BottomNav />
    </div>
  )
}
