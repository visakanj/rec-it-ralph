import { Users, ChevronRight } from 'lucide-react';
interface RoomCardProps {
  id: string;
  name: string;
  memberCount: number;
  active?: boolean;
  lastActive?: string;
}
export function RoomCard({
  id: _id,
  name,
  memberCount,
  active,
  lastActive
}: RoomCardProps) {
  return <div className="block group cursor-pointer">
      <div className="relative bg-surface p-5 rounded-2xl border border-border-subtle shadow-subtle transition-all duration-300 active:scale-[0.98] hover:border-border-highlight">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-text-secondary'}`} />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {active ? 'Active Now' : lastActive || 'Inactive'}
            </span>
          </div>
          <ChevronRight size={20} className="text-text-secondary group-hover:text-text-primary transition-colors" />
        </div>

        <h3 className="text-xl font-semibold text-text-primary mb-2 leading-tight">
          {name}
        </h3>

        <div className="flex items-center text-text-secondary">
          <Users size={16} className="mr-2" />
          <span className="text-sm font-medium">{memberCount} members</span>
        </div>
      </div>
    </div>;
}