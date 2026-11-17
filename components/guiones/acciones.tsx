'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Undo2, X } from 'lucide-react'
import { puedeDescartar, puedeReabrir, type AccionGuion } from '@/lib/guiones/reglas'
import type { EstadoGuion } from '@/lib/guiones/tipos'
import { Aviso, Boton, ICONO } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

const QUIETO = '!border-transparent !bg-transparent !shadow-none text-fg/55 hover:text-fg'

// «Descartar» (con confirmación) y «Volver a abrir» / «Reintentar». Al cambiar, la tarjeta se queda donde está
// (`alCambiar`) para que se vea cómo quedó y se pueda deshacer.
export function Acciones({ id, estado, conVideos, alCambiar }: { id: string; estado: EstadoGuion; conVideos: boolean; alCambiar(): void }) {
  const { enviar, ocupado, error } = useEnvio()
  const [confirmando, setConfirmando] = useState(false)

  async function hacer(accion: AccionGuion) {
    const r = await enviar(`/api/guiones/${id}`, 'POST', { accion })
    if (!r) return
    setConfirmando(false)
    alCambiar()
  }

  const giro = <Loader2 size={15} {...ICONO} className="animate-spin" />
  const reabrir = puedeReabrir(estado)
  const descartar = puedeDescartar(estado)
  if (!reabrir && !descartar) return null

  if (confirmando) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-fg/80">
          ¿Descartar este guion? {estado === 'listo' ? 'Ya no va a salir en «Por grabar».' : 'El servidor ya no lo va a editar.'} Lo puedes volver a abrir
          desde «Todos».
        </p>
        <div className="flex flex-wrap gap-2">
          <Boton principal onClick={() => void hacer('descartar')} disabled={ocupado} className="min-h-11">
            {ocupado ? giro : <X size={15} {...ICONO} />}
            Sí, descartar
          </Boton>
          <Boton onClick={() => setConfirmando(false)} disabled={ocupado} className="min-h-11">
            No
          </Boton>
        </div>
        {error && <Aviso>{error.texto}</Aviso>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {reabrir && (
        <Boton principal={estado === 'error'} onClick={() => void hacer('reabrir')} disabled={ocupado} className="min-h-11">
          {ocupado ? giro : estado === 'error' && conVideos ? <RotateCcw size={15} {...ICONO} /> : <Undo2 size={15} {...ICONO} />}
          {estado === 'error' && conVideos ? 'Reintentar la edición' : 'Volver a abrir'}
        </Boton>
      )}
      {descartar && (
        <Boton onClick={() => setConfirmando(true)} disabled={ocupado} className={`min-h-11 ${QUIETO}`}>
          <X size={15} {...ICONO} />
          Descartar
        </Boton>
      )}
      {error && <Aviso>{error.texto}</Aviso>}
    </div>
  )
}
