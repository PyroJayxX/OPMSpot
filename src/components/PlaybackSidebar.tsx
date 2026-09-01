"use client";

interface PlaybackSidebarProps {
  onReplay: () => void;
  disabled?: boolean;
}

export function PlaybackSidebar({ onReplay, disabled }: PlaybackSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        Playback
      </span>
      <button
        type="button"
        onClick={onReplay}
        disabled={disabled}
        className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong transition-colors disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Replay from start
      </button>
    </div>
  );
}
