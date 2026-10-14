export const FIELD_CLASS =
  'w-full bg-solid border border-fg/[0.1] rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-fg/50 disabled:opacity-60'

export function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="block mb-1 text-[11px] uppercase tracking-wide text-fg/40">{label}</span>
      {children}
    </label>
  )
}
