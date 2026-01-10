import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { useAdapter } from '../context/AdapterContext'

export default function CreateRoomScreen() {
  const navigate = useNavigate()
  const { adapter, isReady } = useAdapter()
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Show loading state while adapter initializes
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-text-secondary">Connecting to Firebase</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous error
    setError('')

    // Validate theme
    const trimmedTheme = theme.trim()
    if (!trimmedTheme) {
      setError('Room theme is required')
      return
    }

    setLoading(true)

    try {
      // Call adapter to create room
      const roomCode = await adapter.createRoom(trimmedTheme)

      // Robust success condition:
      // 1. Promise resolved without throwing
      // 2. Return value is non-empty string
      // 3. adapter.getRoomCode() returns the new room code
      if (!roomCode || typeof roomCode !== 'string') {
        throw new Error('Invalid room code returned')
      }

      const currentRoomCode = adapter.getRoomCode()
      if (!currentRoomCode) {
        throw new Error('Room code not set in adapter')
      }

      console.log('[CreateRoomScreen] Room created successfully:', roomCode)

      // Navigate to pool screen
      navigate('/pool')
    } catch (err) {
      console.error('[CreateRoomScreen] Failed to create room:', err)
      setError('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar title="Create Room" showBack />

      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
            Create New Room
          </h2>
          <p className="text-text-tertiary mt-1 text-base">
            Start a new movie group with friends
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Theme Input */}
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Room Theme
            </label>
            <input
              type="text"
              id="theme"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value)
                // Clear error when user starts typing
                if (error) setError('')
              }}
              placeholder="e.g. Friday Movie Night"
              className="w-full px-4 py-3 bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-semantic-error/10 border border-semantic-error/20 rounded-xl">
              <p className="text-sm text-semantic-error">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}
