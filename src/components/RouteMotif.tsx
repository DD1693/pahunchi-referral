// Point-of-care to point-of-care motif: a dashed journey between two places.
export function RouteMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M9 22 C 12 10, 19 8, 23 10" fill="none" strokeWidth="2.2" strokeDasharray="2.5 2.5" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle cx="9" cy="22" r="2.6" fill="none" strokeWidth="2" className="stroke-primary-foreground" />
      <circle cx="23" cy="10" r="2.8" className="fill-attention" />
    </svg>
  );
}

export function RouteLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 60" className={className} preserveAspectRatio="none" aria-hidden>
      <path d="M10 48 C 80 48, 90 12, 150 14 S 240 40, 290 12" fill="none" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" className="stroke-primary/35" />
      <circle cx="10" cy="48" r="5" fill="none" strokeWidth="2" className="stroke-primary" />
      <circle cx="150" cy="14" r="3" className="fill-primary/40" />
      <circle cx="290" cy="12" r="6" className="fill-attention" />
    </svg>
  );
}
