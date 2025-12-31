import { useState } from 'react'
import { PlusCircle, Plus, LogIn, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { RoomCard } from '../components/RoomCard'
import { BottomNav } from '../components/BottomNav'
import { ActionSheet, ActionSheetOption } from '../components/ActionSheet'
import { useAdapter } from '../context/AdapterContext'

export default function RoomsScreen() {
  const navigate = useNavigate()
  const { adapter, isReady } = useAdapter()
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

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

  // Get room history from adapter and map to MagicPatterns format
  const roomHistory = adapter.getRoomHistory()
  const rooms = roomHistory.map((room: any) => ({
    id: room.roomCode,
    name: room.theme,
    memberCount: 0, // TODO: Fetch actual member count in future phase
    active: false, // TODO: Determine if room is active
    lastActive: new Date(room.lastVisited).toLocaleDateString()
  }))

  const handleRoomClick = async (roomCode: string) => {
    // Join the room
    await adapter.joinRoom(roomCode)
    // Navigate to pool screen
    navigate('/pool')
  }

  const handleCreateRoom = () => {
    setIsActionSheetOpen(false)
    navigate('/create-room')
  }

  const handleJoinRoom = () => {
    setIsActionSheetOpen(false)
    navigate('/join-room')
  }

  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar
        title="Rooms"
        action={
          <button
            onClick={() => setIsActionSheetOpen(true)}
            className="p-2 -mr-2 text-accent hover:text-accent-hover transition-colors rounded-full active:bg-white/10"
            aria-label="Add or join room"
          >
            <PlusCircle size={24} />
          </button>
        }
      />

      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
            Your Rooms
          </h2>
          <p className="text-text-tertiary mt-1 text-base">
            Join a room to start picking.
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <p className="mb-2">No rooms yet</p>
            <p className="text-sm">Create or join a room to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room: any) => (
              <div key={room.id} onClick={() => handleRoomClick(room.id)}>
                <RoomCard {...room} />
              </div>
            ))}
          </div>
        )}
      </main>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Add Room"
      >
        <ActionSheetOption
          icon={<Plus size={24} />}
          label="Create New Room"
          description="Start a new movie group"
          rightIcon={<ChevronRight size={20} />}
          onClick={handleCreateRoom}
        />
        <ActionSheetOption
          icon={<LogIn size={24} />}
          label="Join Existing Room"
          description="Enter an invite code"
          rightIcon={<ChevronRight size={20} />}
          onClick={handleJoinRoom}
        />
      </ActionSheet>

      <BottomNav />
    </div>
  )
}
