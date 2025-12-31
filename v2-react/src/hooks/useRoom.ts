import { useEffect, useState } from 'react'
import { useAdapter } from '../context/AdapterContext'

export function useRoom(roomCode: string | null) {
  const { adapter } = useAdapter()
  const [roomData, setRoomData] = useState<any>(null)

  useEffect(() => {
    if (!adapter || !roomCode) return

    // Subscribe to room data changes from Firebase
    const unsubscribe = adapter.subscribeRoom(roomCode, (data: any) => {
      setRoomData(data)
    })

    // Cleanup: unsubscribe when component unmounts or roomCode changes
    return () => unsubscribe()
  }, [adapter, roomCode])

  return roomData
}
