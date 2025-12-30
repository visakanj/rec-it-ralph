import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', icon: '🏠', label: 'Rooms' },
  { path: '/pool', icon: '🎬', label: 'Pool' },
  { path: '/tonight', icon: '🍿', label: 'Tonight' },
  { path: '/watched', icon: '✓', label: 'Watched' }
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
