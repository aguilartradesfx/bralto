'use client'

import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'
import { diaCR, hoyCR } from '@/lib/calendario/fechas'
import { haceCuanto, vencimiento } from '@/lib/crm/fechas'
import type { TareaVista } from '@/lib/crm/vista'
import { Aviso, ICONO } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

// 'hace 3 días', 'ayer', 'el 12 mar'
const cuando = (instante: string, ahora: Date) => {
  const texto = haceCuanto(instante, ahora)
  return /^\d/.test(texto) ? `el ${texto}` : texto
}

// Una tarea con su cuadrito para marcarla hecha (o volverla a pendiente). En la lista general, con su contacto
export function FilaTarea({ t, ahora, conContacto = false }: { t: TareaVista; ahora: string; conContacto?: boolean }) {
  const { enviar, ocupado, error } = useEnvio()
  const momento = new Date(ahora)
  const atrasada = !t.hecha && !!t.vence_en && diaCR(t.vence_en) < hoyCR(momento)

  return (
    <li className="flex items-start gap-2 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={t.hecha}
        aria-label={t.hecha ? `Volver a dejar pendiente: ${t.titulo}` : `Marcar como hecha: ${t.titulo}`}
        disabled={ocupado}
        onClick={() => void enviar(`/api/crm/tareas/${t.id}`, 'PATCH', { hecha: !t.hecha })}
        className="group -m-1.5 shrink-0 p-1.5 disabled:opacity-60"
      >
        <span
          className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
            t.hecha ? 'border-fg bg-fg text-canvas' : 'border-fg/30 group-hover:border-fg/60'
          }`}
        >
          {ocupado ? <Loader2 size={12} {...ICONO} className="animate-spin" /> : t.hecha && <Check size={12} strokeWidth={3} aria-hidden />}
        </span>
      </button>
      <div className="min-w-0 flex-1 pl-1">
        <p className={`break-words text-sm ${t.hecha ? 'text-fg/40 line-through' : 'text-fg'}`}>{t.titulo}</p>
        {t.detalle && <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-fg/50">{t.detalle}</p>}
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs">
          {conContacto && t.contacto && (
            <Link href={`/crm/${t.contacto.id}`} className="text-fg/70 underline-offset-2 hover:text-fg hover:underline">
              {t.contacto.nombre}
            </Link>
          )}
          {!t.hecha && t.vence_en && <span className={atrasada ? 'text-red-300' : 'text-fg/45'}>{vencimiento(t.vence_en, momento)}</span>}
          {!t.hecha && !t.vence_en && !conContacto && <span className="text-fg/35">Sin fecha</span>}
          {t.hecha && <span className="text-fg/35">Hecha{t.hecha_en ? ` ${cuando(t.hecha_en, momento)}` : ''}</span>}
        </p>
        {error && (
          <div className="mt-1">
            <Aviso>{error.texto}</Aviso>
          </div>
        )}
      </div>
    </li>
  )
}
