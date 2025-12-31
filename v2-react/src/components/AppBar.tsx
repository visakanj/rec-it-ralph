import React from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface AppBarProps {
  title?: string;
  showBack?: boolean;
  action?: React.ReactNode;
  transparent?: boolean;
}
export function AppBar({
  title,
  showBack = false,
  action,
  transparent = false
}: AppBarProps) {
  const navigate = useNavigate();
  return <header className={`fixed top-0 left-0 right-0 z-40 px-4 h-14 flex items-center justify-between transition-all duration-300 ${transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-white/[0.06]'}`}>
      <div className="flex items-center w-1/4">
        {showBack && <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-primary hover:text-text-secondary transition-colors rounded-full active:bg-white/10">
            <ChevronLeft size={24} />
          </button>}
      </div>

      <div className="flex-1 text-center">
        {title && <h1 className="text-[17px] font-semibold tracking-tight text-text-primary truncate">
            {title}
          </h1>}
      </div>

      <div className="flex items-center justify-end w-1/4">
        {action || <button className="p-2 -mr-2 text-text-primary hover:text-text-secondary transition-colors rounded-full active:bg-white/10">
            <MoreHorizontal size={24} />
          </button>}
      </div>
    </header>;
}