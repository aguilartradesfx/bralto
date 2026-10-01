// Íconos del home: trazo fino, monocromos; el naranja solo en el check.

export function Arrow() {
  return (
    <svg className="hm-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h10.5M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Check({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="var(--accent-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Shield() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.75 19 5.6v5.15c0 4.42-2.93 8.2-7 9.5-4.07-1.3-7-5.08-7-9.5V5.6l7-2.85Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="m8.75 11.9 2.25 2.25 4.25-4.6" stroke="var(--accent-ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Play() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 3.8v10.4c0 .6.66.97 1.17.65l8.1-5.2a.77.77 0 0 0 0-1.3l-8.1-5.2A.77.77 0 0 0 6 3.8Z" fill="currentColor" />
    </svg>
  )
}

export function Sun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6 .9v1.2M6 9.9v1.2M.9 6h1.2M9.9 6h1.2M2.4 2.4l.85.85M8.75 8.75l.85.85M2.4 9.6l.85-.85M8.75 3.25l.85-.85" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function Moon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M9.9 7.6A4.3 4.3 0 0 1 4.4 2.1a4.3 4.3 0 1 0 5.5 5.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}
