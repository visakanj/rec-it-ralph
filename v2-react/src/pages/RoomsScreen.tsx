import { useState, useEffect } from 'react'
import { PlusCircle, Plus, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppBar } from '../components/AppBar'
import { RoomCard } from '../components/RoomCard'
import { BottomNav } from '../components/BottomNav'
import { RoomListSkeleton } from '../components/Skeleton'
import { useAdapter } from '../context/AdapterContext'

export default function RoomsScreen() {
  const navigate = useNavigate()
  const { adapter, isReady } = useAdapter()
  const [isOpen, setIsOpen] = useState(false)
  const [roomsWithCounts, setRoomsWithCounts] = useState<any[]>([])

  // Fetch member counts for each room
  useEffect(() => {
    if (!isReady || !adapter) return

    // Get room history from adapter
    const roomHistory = adapter.getRoomHistory()

    // Initialize rooms with placeholder data
    const initialRooms = roomHistory.map((room: any) => ({
      id: room.roomCode,
      name: room.theme,
      memberCount: 0,
      active: false,
      lastActive: new Date(room.lastVisited).toLocaleDateString()
    }))
    setRoomsWithCounts(initialRooms)

    // Fetch actual room data to get contributor counts
    const fetchRoomCounts = async () => {
      const updatedRooms = await Promise.all(
        roomHistory.map(async (room: any) => {
          try {
            const roomData = await adapter.fetchRoomData(room.roomCode)
            const memberCount = roomData?.contributors?.length || 0

            return {
              id: room.roomCode,
              name: room.theme,
              memberCount,
              active: false,
              lastActive: new Date(room.lastVisited).toLocaleDateString()
            }
          } catch (error) {
            console.error(`Failed to fetch room ${room.roomCode}:`, error)
            return {
              id: room.roomCode,
              name: room.theme,
              memberCount: 0,
              active: false,
              lastActive: new Date(room.lastVisited).toLocaleDateString()
            }
          }
        })
      )
      setRoomsWithCounts(updatedRooms)
    }

    fetchRoomCounts()
  }, [isReady, adapter])

  // Show loading state while adapter initializes
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-fade-in">
        <AppBar title="Rooms" />
        <main className="pt-20">
          <RoomListSkeleton />
        </main>
        <BottomNav />
      </div>
    )
  }

  const handleRoomClick = async (roomCode: string) => {
    // Join the room
    await adapter.joinRoom(roomCode)
    // Navigate to pool screen
    navigate('/pool')
  }

  const handleCreateRoom = () => {
    setIsOpen(false)
    navigate('/create-room')
  }

  const handleJoinRoom = () => {
    setIsOpen(false)
    navigate('/join-room')
  }

  const toggleOpen = () => setIsOpen(!isOpen)

  // Animation variants
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
      <AppBar
        title="Rooms"
        action={<></>}
      />

      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">
            Your Rooms
          </h2>
          <p className="text-text-secondary mt-1 text-base">
            Join a room to start picking.
          </p>
        </div>

        {roomsWithCounts.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p className="mb-2">No rooms yet</p>
            <p className="text-sm">Create or join a room to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roomsWithCounts.map((room: any) => (
              <div key={room.id} onClick={() => handleRoomClick(room.id)}>
                <RoomCard {...room} />
              </div>
            ))}
          </div>
        )}
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
              {/* Create Room Option */}
              <div className="flex items-center gap-4 pr-1">
                <motion.span
                  custom={1}
                  variants={labelVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="text-white font-bold text-base drop-shadow-md whitespace-nowrap"
                >
                  Create new room
                </motion.span>
                <motion.button
                  custom={1}
                  variants={menuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={handleCreateRoom}
                  className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-xl hover:bg-accent-hover transition-colors"
                >
                  <PlusCircle size={24} />
                </motion.button>
              </div>

              {/* Join Room Option */}
              <div className="flex items-center gap-4 pr-1">
                <motion.span
                  custom={0}
                  variants={labelVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="text-white font-bold text-base drop-shadow-md whitespace-nowrap"
                >
                  Join existing room
                </motion.span>
                <motion.button
                  custom={0}
                  variants={menuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={handleJoinRoom}
                  className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-xl hover:bg-accent-hover transition-colors"
                >
                  <LogIn size={24} />
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

      <BottomNav />
    </div>
  )
}
