import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'

export default function CreateRoomScreen() {
  return (
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      <AppBar title="Create Room" showBack />

      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">Create Room</h2>
          <p className="text-text-secondary">Coming in Phase 2</p>
          <p className="text-text-tertiary text-sm mt-2">
            This screen will have the full create room form
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
