import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider } from './context/AdapterContext'
import { ErrorBoundary, ScreenErrorBoundary } from './components/ErrorBoundary'
import RoomsScreen from './pages/RoomsScreen'
import CreateRoomScreen from './pages/CreateRoomScreen'
import JoinRoomScreen from './pages/JoinRoomScreen'
import PoolScreen from './pages/PoolScreen'
import PickScreen from './pages/PickScreen'
import TonightScreen from './pages/TonightScreen'
import WatchedScreen from './pages/WatchedScreen'

function App() {
  return (
    <ErrorBoundary fallbackType="screen">
      <AdapterProvider>
        <BrowserRouter basename="/v2">
          <div className="min-h-screen bg-background text-text-primary font-sans">
            <Routes>
              <Route path="/" element={<ScreenErrorBoundary><RoomsScreen /></ScreenErrorBoundary>} />
              <Route path="/create-room" element={<ScreenErrorBoundary><CreateRoomScreen /></ScreenErrorBoundary>} />
              <Route path="/join-room" element={<ScreenErrorBoundary><JoinRoomScreen /></ScreenErrorBoundary>} />
              <Route path="/pool" element={<ScreenErrorBoundary><PoolScreen /></ScreenErrorBoundary>} />
              <Route path="/pick" element={<ScreenErrorBoundary><PickScreen /></ScreenErrorBoundary>} />
              <Route path="/tonight" element={<ScreenErrorBoundary><TonightScreen /></ScreenErrorBoundary>} />
              <Route path="/watched" element={<ScreenErrorBoundary><WatchedScreen /></ScreenErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AdapterProvider>
    </ErrorBoundary>
  )
}

export default App
