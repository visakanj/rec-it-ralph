import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdapterProvider } from './context/AdapterContext'
import BottomNav from './components/BottomNav'
import RoomsScreen from './pages/RoomsScreen'
import PoolScreen from './pages/PoolScreen'
import TonightScreen from './pages/TonightScreen'
import WatchedScreen from './pages/WatchedScreen'

function App() {
  return (
    <AdapterProvider>
      <BrowserRouter basename="/v2-react-build">
        <div className="min-h-screen bg-background text-text-primary font-sans">
          {/* Main content area */}
          <main className="pb-20">
            <Routes>
              <Route path="/" element={<RoomsScreen />} />
              <Route path="/pool" element={<PoolScreen />} />
              <Route path="/tonight" element={<TonightScreen />} />
              <Route path="/watched" element={<WatchedScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Bottom navigation */}
          <BottomNav />
        </div>
      </BrowserRouter>
    </AdapterProvider>
  )
}

export default App
