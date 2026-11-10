'use client'

import { Bot, Check, Loader2, RotateCcw, Undo2, Video, X } from 'lucide-react'
import type { Accion, Decision, EstadoIdea } from '@/lib/ideas/cola'
import { Aviso, Boton, ICONO } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

const DECIDIDA: Record<Decision, { titulo: string; detalle: string }> = {
  knox: { titulo: 'Va para Knox', detalle: 'La tarea de la noche la toma para un reel.' },
  yo: { titulo: 'La grabas tú', detalle: 'Queda en tu lista para grabarla.' },
  descartada: { titulo: 'Descartada', detalle: 'No va a salir en Nuevas.' },
}

// Los botones de cada idea: «Que lo haga Knox», «Lo grabo yo», «Descartar», y deshacer o reintentar
export function Acciones({ id, estado, decision, conAnalisis }: { id: string; estado: EstadoIdea; decision: Decision | null; conAnalisis: boolean }) {
  const { enviar, ocupado, error } = useEnvio()
  const hacer = (accion: Accion) => () => void enviar(`/api/ideas/${id}`, 'PATCH', { accion })
  const giro = <Loader2 size={15} {...ICONO} className="animate-spin" />

  if (decision) {
    const d = DECIDIDA[decision]
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="pn-pill">
          <Check size={13} {...ICONO} />
          {d.titulo}
        </span>
        <span className="text-[13px] text-fg/50">{d.detalle}</span>
        <Boton onClick={hacer('deshacer')} disabled={ocupado} className="ml-auto !px-3 !py-1.5 !text-xs">
          {ocupado ? giro : <Undo2 size={13} {...ICONO} />}
          Deshacer
        </Boton>
        {error && <Aviso>{error.texto}</Aviso>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {conAnalisis && estado === 'lista' && (
        <>
          <Boton principal onClick={hacer('knox')} disabled={ocupado}>
            {ocupado ? giro : <Bot size={15} {...ICONO} />}
            Que lo haga Knox
          </Boton>
          <Boton onClick={hacer('yo')} disabled={ocupado}>
            <Video size={15} {...ICONO} />
            Lo grabo yo
          </Boton>
        </>
      )}
      {estado === 'error' && (
        <Boton principal onClick={hacer('reintentar')} disabled={ocupado}>
          {ocupado ? giro : <RotateCcw size={15} {...ICONO} />}
          Reintentar
        </Boton>
      )}
      <Boton onClick={hacer('descartar')} disabled={ocupado} className="!border-transparent !bg-transparent !shadow-none text-fg/55 hover:text-fg">
        <X size={15} {...ICONO} />
        Descartar
      </Boton>
      {error && <Aviso>{error.texto}</Aviso>}
    </div>
  )
}
