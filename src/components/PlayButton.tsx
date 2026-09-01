"use client";

interface PlayButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function PlayButton({ label, onClick, disabled }: PlayButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Replay clip"
        className="flex items-center justify-center w-28 h-28 rounded-full bg-accent text-accent-foreground shadow-[0_0_40px_-6px_var(--accent)] hover:bg-accent-strong hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 translate-x-0.5" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <span className="text-3xl font-bold tabular-nums text-foreground">{label}</span>
    </div>
  );
}
