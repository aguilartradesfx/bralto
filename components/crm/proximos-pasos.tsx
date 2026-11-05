import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ListTodo, Send, Sparkles } from 'lucide-react'
import { fechaHora, vencimiento } from '@/lib/crm/fechas'
import type { Ficha } from '@/lib/crm/vista'
import type { Borrador } from '@/lib/panel/contactos'
import { ICONO } from '@/components/crm/piezas'

// Lo que sigue con el contacto abierto: la respuesta que Knox dejó lista, sus tareas y su próxima cita
export function ProximosPasos({ ficha, borrador, ahora }: { ficha: Ficha; borrador: Borrador | null; ahora: string }) {
  const hoy = new Date(ahora)
  const primero = (ficha.contacto.nombre || 'esta persona').split(' ')[0]
  const tareas = ficha.tareas.filter((t) => !t.hecha).slice(0, 3)
  const cita = ficha.citas.filter((c) => Date.parse(c.inicio) > hoy.getTime() && c.estado !== 'cancelada').sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))[0]
  const nada = !borrador && tareas.length === 0 && !cita

  return (
    <section>
      <h3 className="flex items-center gap-2 text-[14px] font-medium text-fg">
        <Sparkles size={14} {...ICONO} className="text-[var(--pn-accent-ink)]" />
        Próximos pasos con {primero}
      </h3>

      {nada && (
        <p className="mt-3 text-[13px] text-fg/55">
          No hay nada pendiente con {primero}.{' '}
          <Link href={`/crm/${ficha.contacto.id}`} className="text-fg underline decoration-fg/25 underline-offset-[3px] hover:decoration-[var(--pn-accent)]">
            Déjale una tarea o una nota en su ficha
          </Link>
          .
        </p>
      )}

      {borrador && (
        <div className="mt-4">
          <p className="text-[13px] text-fg/65">Knox dejó lista esta respuesta. Revísala antes de que salga:</p>
          <div className="pn-solid mt-3 rounded-[12px] p-4">
            <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[12.5px]">
              <dt className="text-fg/40">Para</dt>
              <dd className="text-fg/80">{ficha.contacto.nombre || 'el contacto'}</dd>
              <dt className="text-fg/40">Mensaje</dt>
              <dd className="whitespace-pre-line text-fg/85">{borrador.respuesta}</dd>
            </dl>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/crm/mensajes/${borrador.conversacionId}`} className="pn-btn-solid inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium">
              Revisar y enviar
              <Send size={13} {...ICONO} />
            </Link>
            <span className="self-center text-[11.5px] text-fg/35">Preparada {fechaHora(borrador.creado_en, hoy).toLowerCase()}</span>
          </div>
        </div>
      )}

      {(tareas.length > 0 || cita) && (
        <ul className={`space-y-1 ${borrador ? 'mt-5 border-t border-fg/[0.07] pt-4' : 'mt-3'}`}>
          {cita && (
            <li className="flex items-center gap-3 rounded-[10px] px-1 py-1.5 text-[13px]">
              <CalendarDays size={14} {...ICONO} className="shrink-0 text-fg/45" />
              <span className="min-w-0 flex-1 truncate text-fg/85">{cita.titulo}</span>
              <span className="shrink-0 text-[12px] text-fg/45">{fechaHora(cita.inicio, hoy)}</span>
            </li>
          )}
          {tareas.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-[10px] px-1 py-1.5 text-[13px]">
              <ListTodo size={14} {...ICONO} className="shrink-0 text-fg/45" />
              <span className="min-w-0 flex-1 truncate text-fg/85">{t.titulo}</span>
              {t.vence_en && <span className="shrink-0 text-[12px] text-fg/45">{vencimiento(t.vence_en, hoy)}</span>}
            </li>
          ))}
          <li>
            <Link href={`/crm/${ficha.contacto.id}`} className="mt-1 inline-flex items-center gap-1 px-1 text-[12.5px] text-fg/55 hover:text-fg">
              Abrir la ficha
              <ArrowUpRight size={13} {...ICONO} />
            </Link>
          </li>
        </ul>
      )}
    </section>
  )
}
