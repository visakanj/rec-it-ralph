interface ContributorChipProps {
  id: string;
  name: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  movieCount?: number;
}

export function ContributorChip({
  name,
  color,
  active = false,
  onClick,
  movieCount
}: ContributorChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        transition-all duration-200 whitespace-nowrap active:scale-105
        ${
          active
            ? 'bg-accent text-white shadow-lg'
            : 'bg-surface text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border'
        }
      `}
    >
      {/* Color indicator dot */}
      <div
        className={`w-3 h-3 rounded-full flex-shrink-0 ${active ? 'ring-2 ring-white/50' : ''}`}
        style={{ backgroundColor: color }}
      />

      {/* Contributor name */}
      <span className="text-sm font-medium">{name}</span>

      {/* Movie count badge (optional) */}
      {movieCount !== undefined && movieCount > 0 && (
        <span className={`
          text-xs px-1.5 py-0.5 rounded-full
          ${active ? 'bg-white/20' : 'bg-surface-elevated'}
        `}>
          {movieCount}
        </span>
      )}
    </button>
  );
}
