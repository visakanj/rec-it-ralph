import { useNavigate } from 'react-router-dom'
import { useAdapter } from '../context/AdapterContext'

export default function RoomsScreen() {
  const { adapter, isReady } = useAdapter()
  const navigate = useNavigate()

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

  // Get room history from adapter
  const roomHistory = adapter.getRoomHistory()

  const handleRoomClick = async (roomCode: string) => {
    // Join the room
    await adapter.joinRoom(roomCode)
    // Navigate to pool screen
    navigate('/pool')
  }

  const handleCreateRoom = async () => {
    // For Phase 1, create a room with a default theme
    const theme = prompt('Enter room theme:')
    if (theme) {
      const roomCode = await adapter.createRoom(theme)
      console.log('Created room:', roomCode)
      navigate('/pool')
    }
  }

  const handleJoinRoom = async () => {
    // For Phase 1, simple prompt for room code
    const roomCode = prompt('Enter room code:')
    if (roomCode) {
      const success = await adapter.joinRoom(roomCode.toUpperCase())
      if (success) {
        navigate('/pool')
      } else {
        alert('Room not found')
      }
    }
  }

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🏠 Rooms</h1>
        <p className="text-text-secondary">Your movie night rooms</p>
      </div>

      {/* Action buttons */}
      <div className="mb-8 flex gap-3">
        <button
          onClick={handleCreateRoom}
          className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          ✨ Create Room
        </button>
        <button
          onClick={handleJoinRoom}
          className="flex-1 bg-surface hover:bg-surface-elevated text-white font-semibold py-3 px-4 rounded-lg transition-colors border border-border"
        >
          🔗 Join Room
        </button>
      </div>

      {/* Room history */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Rooms</h2>
        {roomHistory.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <p className="mb-2">No rooms yet</p>
            <p className="text-sm">Create or join a room to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roomHistory.map((room: any) => (
              <button
                key={room.roomCode}
                onClick={() => handleRoomClick(room.roomCode)}
                className="w-full bg-surface hover:bg-surface-elevated p-4 rounded-lg transition-colors text-left border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{room.theme}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-text-secondary text-sm">Code: {room.roomCode}</p>
                      <p className="text-text-tertiary text-sm">👥 0 members</p>
                    </div>
                  </div>
                  <div className="text-text-tertiary text-sm">
                    {new Date(room.lastVisited).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
