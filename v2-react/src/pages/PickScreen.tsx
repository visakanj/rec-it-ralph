import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import { BottomNav } from '../components/BottomNav'
import { useAdapter } from '../context/AdapterContext'
import { useRoom } from '../hooks/useRoom'

// Roulette constants (matching MagicPatterns)
const ITEM_WIDTH = 220
const ITEM_HEIGHT = 330
const ITEM_GAP = 24
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_GAP

export default function PickScreen() {
  const navigate = useNavigate()
  const { adapter } = useAdapter()
  const roomData = useRoom(adapter?.getRoomCode() || null)
  const controls = useAnimationControls()

  const [holdProgress, setHoldProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartTimeRef = useRef<number>(0)

  const moviePool = roomData?.moviePool || []
  const tonightPick = roomData?.tonightPick

  // Create 6x duplicated array for roulette effect
  const slotItems = useMemo(() => {
    if (moviePool.length === 0) return []
    return [
      ...moviePool,
      ...moviePool,
      ...moviePool,
      ...moviePool,
      ...moviePool,
      ...moviePool
    ]
  }, [moviePool])

  // Redirect to /tonight if movie already picked (but not during animation)
  useEffect(() => {
    if (tonightPick && !isAnimating) {
      navigate('/tonight')
    }
  }, [tonightPick, isAnimating, navigate])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  // Start hold
  const handlePressStart = () => {
    if (isAnimating || moviePool.length === 0) return

    setHoldProgress(0)
    holdStartTimeRef.current = Date.now()

    // Progress timer: update every 30ms, complete at 4 seconds
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current
      const progress = Math.min((elapsed / 4000) * 100, 100)

      setHoldProgress(progress)

      // Hold complete at 100%
      if (progress >= 100) {
        handleHoldComplete()
      }
    }, 30)
  }

  // Release hold early
  const handlePressEnd = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }

    if (holdProgress < 100) {
      // Early release - reset
      setHoldProgress(0)
    }
  }

  // Hold completed (4 seconds reached)
  const handleHoldComplete = async () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }

    setIsAnimating(true)

    // Pick a random movie locally (don't persist yet - this is just for animation target)
    if (!adapter) return
    const pickedMovie = adapter.pickRandomMovie()

    if (!pickedMovie) {
      console.error('[PickScreen] No movie picked')
      setIsAnimating(false)
      return
    }

    // Find the picked movie in the slot items
    // Pick from middle section (indices moviePool.length * 2 to moviePool.length * 4)
    const middleStart = moviePool.length * 2
    let winningIndex = middleStart

    // Find index of picked movie in middle section
    for (let i = 0; i < moviePool.length; i++) {
      if (moviePool[i].title === pickedMovie.title) {
        winningIndex = middleStart + i
        break
      }
    }

    // Calculate target X to center winning card
    const targetX = -(winningIndex * TOTAL_ITEM_WIDTH)

    // Animate strip to winning position (4 seconds)
    await controls.start({
      x: targetX,
      transition: {
        duration: 4,
        ease: [0.1, 0.8, 0.2, 1],
        type: 'tween'
      }
    })

    // After animation completes, persist the picked movie to Firebase
    if (adapter.state && adapter.state.setTonightPick) {
      adapter.state.setTonightPick(pickedMovie)
    }

    // Navigate to TonightScreen after persisting
    setTimeout(() => {
      navigate('/tonight')
    }, 500)
  }

  return (
    <div className="h-screen overflow-y-hidden bg-gradient-dark pb-28 animate-fade-in">
      <main className="pt-8 px-4 max-w-full">
        {/* Empty pool state */}
        {moviePool.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">
              No Movies in Pool
            </h2>
            <p className="text-text-secondary mb-6">
              Add movies to the pool first
            </p>
            <button
              onClick={() => navigate('/pool')}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Go to Pool
            </button>
          </div>
        ) : (
          <>
            {/* Page title */}
            <div className="mb-6 px-4 max-w-md mx-auto">
              <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
                Tonight's movie
              </h2>
            </div>

            {/* Horizontal roulette strip - ALWAYS VISIBLE */}
            <div className="relative w-full overflow-hidden mb-12 select-none" style={{ height: ITEM_HEIGHT }}>
              <motion.div
                animate={controls}
                initial={{ x: 0 }}
                className="flex items-center absolute left-0 select-none"
                style={{
                  paddingLeft: `calc(50vw - ${ITEM_WIDTH / 2}px)`,
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              >
                {slotItems.map((movie, idx) => (
                  <div
                    key={`${movie.title}-${idx}`}
                    style={{
                      width: ITEM_WIDTH,
                      height: ITEM_HEIGHT,
                      marginRight: ITEM_GAP
                    }}
                    className="rounded-xl overflow-hidden shadow-2xl flex-shrink-0 select-none"
                  >
                    {movie.tmdbData?.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.tmdbData.posterPath}`}
                        alt={movie.title}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        draggable={false}
                        style={{
                          WebkitTouchCallout: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        } as React.CSSProperties}
                      />
                    ) : (
                      <div className="w-full h-full bg-surface flex items-center justify-center select-none">
                        <span className="text-6xl select-none">🎬</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hold button - BELOW the strip */}
            <div
              className="flex flex-col items-center justify-center mt-12 select-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Circular progress ring */}
                <svg
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 -rotate-90 pointer-events-none select-none"
                >
                  {/* Background circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/10"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-accent"
                    strokeDasharray="289.02"
                    strokeDashoffset={289.02 - (289.02 * holdProgress) / 100}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 289.02 }}
                    animate={{ strokeDashoffset: 289.02 - (289.02 * holdProgress) / 100 }}
                    transition={{ duration: 0.03 }}
                  />
                </svg>

                {/* Hold button */}
                <motion.button
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 select-none ${
                    isAnimating
                      ? 'bg-gray-700 cursor-not-allowed scale-90'
                      : 'bg-accent active:scale-95'
                  }`}
                  style={{
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    handlePressStart()
                  }}
                  onTouchEnd={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={isAnimating}
                >
                  {isAnimating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="select-none"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/50 select-none pointer-events-none"
                      >
                        <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364l-2.121-2.121M8.757 8.757L6.636 6.636m12.728 0l-2.121 2.121M8.757 15.243l-2.121 2.121" />
                      </svg>
                    </motion.div>
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white select-none pointer-events-none"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
