export function TipoBadge({ tipo }: { tipo: 'lectura' | 'accion' }) {
  return tipo === 'accion' ? (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-white/[0.08] text-white border-white/15">Acción</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-white/[0.04] text-white/45 border-white/10">Lectura</span>
  )
}
