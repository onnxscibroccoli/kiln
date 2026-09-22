export function KilnMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect x="3" y="8" width="20" height="20" rx="4" className="stroke-sage" strokeWidth="1.6" />
      <rect x="9" y="4" width="20" height="20" rx="4" className="stroke-foreground/80" strokeWidth="1.6" />
      <path d="M15 12v8M15 20h6" className="stroke-sage" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
