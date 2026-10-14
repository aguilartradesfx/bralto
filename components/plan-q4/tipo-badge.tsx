export function TipoBadge({ tipo }: { tipo: 'lectura' | 'accion' }) {
  return tipo === 'accion' ? (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-fg/[0.08] text-fg border-fg/15">Acción</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border bg-fg/[0.04] text-fg/45 border-fg/10">Lectura</span>
  )
}
