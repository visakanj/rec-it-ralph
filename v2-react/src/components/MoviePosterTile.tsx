import { Trash2 } from 'lucide-react'

interface MoviePosterTileProps {
  title: string;
  year?: string;
  imageUrl?: string;
  rating?: string;
  onClick?: () => void;
  selected?: boolean;
  suggestedBy?: string[];
  contributorColors?: { [key: string]: string };
  contributorNames?: { [key: string]: string };
  onDelete?: () => void;
}

export function MoviePosterTile({
  title,
  year,
  imageUrl,
  rating,
  onClick,
  selected = false,
  suggestedBy = [],
  contributorColors = {},
  contributorNames = {},
  onDelete
}: MoviePosterTileProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-accent shadow-lg scale-105' : ''}
      `}
    >
      {/* 2:3 aspect ratio container */}
      <div className="relative aspect-[2/3] bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Placeholder for missing poster
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-elevated">
            <div className="text-4xl mb-2">🎬</div>
            <div className="text-xs text-text-tertiary text-center px-2 line-clamp-3">
              {title}
            </div>
          </div>
        )}

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Movie info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="text-white text-sm font-semibold line-clamp-2 drop-shadow-md">
            {title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {year && (
              <span className="text-xs text-white/80 drop-shadow-md">{year}</span>
            )}
            {rating && (
              <span className="text-xs text-white/80 flex items-center gap-0.5 drop-shadow-md">
                ⭐ {rating}
              </span>
            )}
          </div>
        </div>

        {/* Contributor badges (initials) */}
        {suggestedBy.length > 0 && !selected && (
          <div className="absolute top-2 right-2 flex gap-1">
            {suggestedBy.map((contributorId, index) => {
              const name = contributorNames[contributorId] || ''
              const initial = name.charAt(0).toUpperCase()
              return (
                <div
                  key={index}
                  className="w-5 h-5 rounded-full shadow-sm flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: contributorColors[contributorId] || '#3B82F6' }}
                  title={`Suggested by ${name}`}
                >
                  {initial}
                </div>
              )
            })}
          </div>
        )}

        {/* Delete overlay when selected */}
        {selected && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors active:scale-95"
            >
              <Trash2 size={40} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
