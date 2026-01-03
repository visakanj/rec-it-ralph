import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { useAdapter } from '../context/AdapterContext'

export default function JoinRoomScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { adapter, isReady } = useAdapter()
  const [roomCode, setRoomCode] = useState('')
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

  const validateRoomCode = (code: string): string | null => {
    // Required: non-empty code
    if (!code) {
      return 'Room code is required'
    }

    // Length: exactly 6 characters
    if (code.length !== 6) {
      return 'Room code must be 6 characters'
    }

    // Format: alphanumeric only (A-Z, 0-9)
    const alphanumericRegex = /^[A-Z0-9]+$/
    if (!alphanumericRegex.test(code)) {
      return 'Room code can only contain letters and numbers'
    }

    return null
  }

  const handleRoomCodeChange = (value: string) => {
    // Auto-uppercase: convert to uppercase as user types
    const uppercased = value.toUpperCase()
    setRoomCode(uppercased)

    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous error
    setError('')

    // Validate room code
    const validationError = validateRoomCode(roomCode)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Call adapter to join room
      const success = await adapter.joinRoom(roomCode)

      // Robust success condition:
      // 1. Return value is true (strict boolean check)
      // 2. adapter.getRoomCode() returns the joined room code
      // 3. adapter.getRoomData() is populated (has theme)
      if (success !== true) {
        setError('Room not found')
        return
      }

      const currentRoomCode = adapter.getRoomCode()
      if (!currentRoomCode) {
        throw new Error('Room code not set in adapter after join')
      }

      const roomData = adapter.getRoomData()
      if (!roomData || !roomData.theme) {
        throw new Error('Room data not populated after join')
      }

      console.log('[JoinRoomScreen] Joined room successfully:', currentRoomCode)

      // Navigate to pool screen
      navigate('/pool')
    } catch (err) {
      console.error('[JoinRoomScreen] Failed to join room:', err)
      setError('Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  // Auto-join from URL parameter
  const handleAutoJoinFromURL = async (code: string) => {
    setLoading(true)

    try {
      // Join the room
      const success = await adapter.joinRoom(code)

      if (success !== true) {
        setError('Room not found')
        setLoading(false)
        return
      }

      // Verify room joined
      const currentRoomCode = adapter.getRoomCode()
      const roomData = adapter.getRoomData()

      if (!currentRoomCode || !roomData?.theme) {
        throw new Error('Room data not populated after join')
      }

      console.log('[JoinRoomScreen] Auto-joined room from URL:', currentRoomCode)

      // Navigate to pool with flag to show name prompt
      navigate('/pool', {
        state: {
          showNamePrompt: true,
          autoJoined: true
        }
      })
    } catch (err) {
      console.error('[JoinRoomScreen] Auto-join from URL failed:', err)
      setError('Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  // Detect URL parameter and auto-join
  useEffect(() => {
    const codeParam = searchParams.get('code')
    if (codeParam && isReady) {
      const uppercased = codeParam.toUpperCase()

      // Validate code format
      const validationError = validateRoomCode(uppercased)
      if (validationError) {
        setError(validationError)
        return
      }

      // Auto-join the room
      handleAutoJoinFromURL(uppercased)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isReady])

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar title="Join Room" showBack />

      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
            Join Existing Room
          </h2>
          <p className="text-text-tertiary mt-1 text-base">
            Enter the 6-character room code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Code Input */}
          <div>
            <label
              htmlFor="roomCode"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => handleRoomCodeChange(e.target.value)}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-mono text-lg tracking-wider"
              disabled={loading}
            />
            <p className="text-xs text-text-tertiary mt-2">
              Room codes are 6 characters (letters and numbers only)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}
