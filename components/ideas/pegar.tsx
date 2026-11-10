'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { resumenPegado } from '@/lib/ideas/vista'
import { Aviso, Boton, CAMPO, ICONO } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

type Respuesta = { nuevas: number; repetidas: number; noValidos: string[]; deMas: number }

// La caja para pegar uno o muchos enlaces de Instagram o TikTok
export function Pegar() {
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const { enviar, ocupado, error } = useEnvio()

  async function analizar(e: React.FormEvent) {
    e.preventDefault()
    setAviso(null)
    const r = await enviar<Respuesta>('/api/ideas', 'POST', { texto })
    if (!r) return
    setAviso({ ok: r.nuevas > 0, texto: resumenPegado(r) })
    if (r.nuevas > 0) setTexto('')
  }

  return (
    <form onSubmit={analizar} className="pn-glass rounded-[16px] p-4 sm:p-5">
      <label htmlFor="enlaces" className="mb-1 block text-sm font-semibold text-fg">
        Pega los enlaces
      </label>
      <p className="mb-3 text-[13px] text-fg/50">De Instagram o TikTok, uno o muchos. Te digo por qué pegó cada video y cómo hacer el tuyo.</p>
      <textarea
        id="enlaces"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={ocupado}
        rows={3}
        placeholder={'instagram.com/reel/…\ntiktok.com/@…/video/…'}
        className={`${CAMPO} resize-y font-mono text-[13px] leading-5`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Boton principal type="submit" disabled={ocupado || !texto.trim()}>
          {ocupado ? <Loader2 size={15} {...ICONO} className="animate-spin" /> : <Sparkles size={15} {...ICONO} />}
          Analizar
        </Boton>
        {error ? <Aviso>{error.texto}</Aviso> : aviso && <Aviso ok={aviso.ok}>{aviso.texto}</Aviso>}
      </div>
    </form>
  )
}
