import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Moon, Clock } from 'lucide-react';
export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  return <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="absolute inset-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/[0.06]" />

      <div className="relative flex items-center justify-between px-6 pb-3 pt-2 max-w-md mx-auto h-[60px]">
        {/* Rooms Tab */}
        <Link to="/" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} className={`transition-colors duration-200 ${isActive('/') ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive('/') ? 'text-accent' : 'text-text-tertiary'}`}>
            Rooms
          </span>
        </Link>

        {/* Pool Tab */}
        <Link to="/pool" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Grid size={24} strokeWidth={isActive('/pool') ? 2.5 : 2} className={`transition-colors duration-200 ${isActive('/pool') ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive('/pool') ? 'text-accent' : 'text-text-tertiary'}`}>
            Pool
          </span>
        </Link>

        {/* Tonight Tab */}
        <Link to="/tonight" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Moon size={24} strokeWidth={isActive('/tonight') ? 2.5 : 2} className={`transition-colors duration-200 ${isActive('/tonight') ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive('/tonight') ? 'text-accent' : 'text-text-tertiary'}`}>
            Tonight
          </span>
        </Link>

        {/* Watched Tab */}
        <Link to="/watched" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Clock size={24} strokeWidth={isActive('/watched') ? 2.5 : 2} className={`transition-colors duration-200 ${isActive('/watched') ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
          <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive('/watched') ? 'text-accent' : 'text-text-tertiary'}`}>
            Watched
          </span>
        </Link>
      </div>
    </nav>;
}