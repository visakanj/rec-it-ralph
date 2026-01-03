import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider } from './context/AdapterContext'
import RoomsScreen from './pages/RoomsScreen'
import CreateRoomScreen from './pages/CreateRoomScreen'
import JoinRoomScreen from './pages/JoinRoomScreen'
import PoolScreen from './pages/PoolScreen'
import PickScreen from './pages/PickScreen'
import TonightScreen from './pages/TonightScreen'
import WatchedScreen from './pages/WatchedScreen'

function App() {
  return (
    <AdapterProvider>
      <BrowserRouter basename="/v2-react-build">
        <div className="min-h-screen bg-background text-text-primary font-sans">
          <Routes>
            <Route path="/" element={<RoomsScreen />} />
            <Route path="/create-room" element={<CreateRoomScreen />} />
            <Route path="/join-room" element={<JoinRoomScreen />} />
            <Route path="/pool" element={<PoolScreen />} />
            <Route path="/pick" element={<PickScreen />} />
            <Route path="/tonight" element={<TonightScreen />} />
            <Route path="/watched" element={<WatchedScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AdapterProvider>
  )
}

export default App
