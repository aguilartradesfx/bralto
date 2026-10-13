export function TipoBadge({ tipo }: { tipo: 'lectura' | 'accion' }) {
  return tipo === 'accion' ? (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-[#5bb6ff]/10 text-[#5bb6ff] border-[#5bb6ff]/20">Acción</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-white/[0.04] text-white/45 border-white/10">Lectura</span>
  )
}
