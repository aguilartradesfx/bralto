'use client'

import { Fragment, memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import dynamic from 'next/dynamic'
import type { Palabra } from '@/lib/knox/centro/subtitulo'
import { C, NARANJA, arco, svgAnillosVoz, svgLideres, svgNucleoAbajo, svgSegmentos } from './geometria'
import type { LeerOrbe } from './orbe'

// El centro del Centro de mando: el orbe dentro de los anillos, las cuatro anotaciones, lo que Knox está diciendo (con
// su cara al lado) y los botones. El anillo de avance lo mueve el cuadro a cuadro de centro.tsx (por las refs), sin
// React; el orbe se mueve solo y le pregunta al centro qué hace Knox.

// El orbe trae three.js: se baja aparte y solo en el navegador
const Orbe = dynamic(() => import('./orbe'), { ssr: false })

// saludando: Knox habla mientras revisa (su saludo al abrir, «ya casi», «Ahora sí, acá el reporte»)
export type FaseVoz = 'cargando' | 'revisando' | 'saludando' | 'esperando' | 'hablando' | 'pausado' | 'terminado' | 'error'

export type RefsHud = {
  nucleo: RefObject<HTMLDivElement | null>
  arco: RefObject<SVGPathElement | null>
  punta: RefObject<SVGGElement | null>
  barra: RefObject<HTMLElement | null>
  tiempo: RefObject<HTMLElement | null>
}

export type Anotacion = { valor: string; detalle: string }

const ABAJO = svgNucleoAbajo()
const SEGMENTOS = svgSegmentos()
const ANILLOS = svgAnillosVoz()
const LIDERES = svgLideres()

// Los anillos van encima del orbe, como un visor sobre la luz
function Nucleo({ fase, refs, onOrbe, tocar, leer }: { fase: FaseVoz; refs: RefsHud; onOrbe: (() => void) | null; tocar: boolean; leer: LeerOrbe }) {
  return (
    <div className="core" ref={refs.nucleo} data-fase={fase}>
      <Orbe leer={leer} />
      <svg viewBox="0 0 580 580" width="580" height="580" aria-hidden>
        <g dangerouslySetInnerHTML={{ __html: ABAJO }} />
        <g className="seg" dangerouslySetInnerHTML={{ __html: SEGMENTOS }} />
        <g dangerouslySetInnerHTML={{ __html: ANILLOS }} />
        {(fase === 'revisando' || fase === 'cargando' || fase === 'saludando') && (
          <path className="giro" d={arco(C, C, 226, 0, 64)} fill="none" stroke={NARANJA} strokeWidth="2.5" strokeLinecap="round" filter="url(#kc-glow)" />
        )}
        <path ref={refs.arco} d="" fill="none" stroke={NARANJA} strokeWidth="2.5" strokeLinecap="round" filter="url(#kc-glow)" />
        <g ref={refs.punta} style={{ display: 'none' }}>
          <circle r="10" fill={NARANJA} fillOpacity=".16" />
          <circle r="4" fill="#ffd3bd" filter="url(#kc-glow)" />
        </g>
      </svg>
      {onOrbe && <button type="button" className="orbe-toque" onClick={onOrbe} aria-label={fase === 'hablando' ? 'Pausar a Knox' : 'Escuchar a Knox'} />}
      {tocar && onOrbe && (
        <button type="button" className="tocar" onClick={onOrbe}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4v16l13-8z" />
          </svg>
          Toca para escuchar a Knox
        </button>
      )}
    </div>
  )
}

// El núcleo no cambia con cada palabra del subtítulo: solo con la fase
const NucleoQuieto = memo(Nucleo)

function Anotaciones({ reviso, modo, proximo }: { reviso: Anotacion; modo: Anotacion; proximo: Anotacion }) {
  const fila = (cl: string, a: Anotacion) => (
    <>
      <div className="cl">{cl}</div>
      <div className="cv">
        {a.valor}
        <span>{a.detalle}</span>
      </div>
    </>
  )
  return (
    <>
      <svg className="abs" style={{ inset: 0, width: 872, height: 758, pointerEvents: 'none' }} aria-hidden dangerouslySetInnerHTML={{ __html: LIDERES }} />
      <div className="callouts">
        <div className="co l" style={{ top: 58 }}>
          {fila('Revisó', reviso)}
        </div>
        <div className="co l" style={{ top: 478 }}>
          {fila('Voz', { valor: 'Agustín', detalle: 'español' })}
        </div>
        <div className="co r" style={{ top: 58 }}>
          {fila('Modo', modo)}
        </div>
        <div className="co r" style={{ top: 478 }}>
          {fila('Próximo aviso', proximo)}
        </div>
      </div>
    </>
  )
}

export type Estado = { texto: string; late: boolean; barra: 'avance' | 'busca' | null }

// La cara de Knox, al lado de lo que va diciendo (como en una llamada): se ilumina con su voz mientras habla y late
// mientras revisa. Tocarla pausa o sigue, igual que el orbe
function Cara({ fase, onToque }: { fase: FaseVoz; onToque: (() => void) | null }) {
  const habla = fase === 'hablando' || fase === 'saludando'
  const clase = `cara${habla ? ' habla' : fase === 'revisando' || fase === 'cargando' ? ' revisa' : ''}`
  const fotos = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={habla ? undefined : 'oculto'} src="/knox/senalando.webp" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={habla ? 'oculto' : undefined} src="/knox/pulgar.webp" alt="" />
    </>
  )
  if (!onToque) return <div className={clase}>{fotos}</div>
  return (
    <button type="button" className={clase} onClick={onToque} aria-label={fase === 'hablando' ? 'Pausar a Knox' : 'Escuchar a Knox'}>
      {fotos}
    </button>
  )
}

function Subtitulo({ clave, palabras, tenue }: { clave: string; palabras: Palabra[]; tenue: boolean }) {
  const largo = palabras.reduce((n, p) => n + p.texto.length + 1, 0) > 120
  return (
    <p key={clave} className={`sub entra${largo ? ' largo' : ''}${tenue ? ' tenue' : ''}`} aria-live="polite">
      {palabras.map((p, i) => {
        const clase = p.estado === 'actual' ? 'cur' : p.estado === 'falta' ? 'next' : undefined
        return (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span className={clase}>{p.numero ? <b>{p.texto}</b> : p.texto}</span>
          </Fragment>
        )
      })}
    </p>
  )
}

const Icono = {
  repetir: (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  actualizar: (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden>
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  microfono: (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  ),
}

function Confirmar(p: { pregunta: string; uno: boolean; enviando: boolean; onSi: () => void; onNo: () => void }) {
  const si = useRef<HTMLButtonElement>(null)
  const { onNo, enviando } = p
  useEffect(() => {
    si.current?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !enviando) onNo()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onNo, enviando])
  return (
    <div className="confirma" role="dialog" aria-modal="true" aria-labelledby="kc-pregunta">
      <p id="kc-pregunta">{p.pregunta}</p>
      <small>
        {p.uno ? 'Le llega a esa persona en su chat.' : 'A cada persona le llega en su chat.'} Solo salen las de quienes escribieron en las últimas
        24 horas.
      </small>
      <div className="fila">
        <button ref={si} type="button" className="btn solid" onClick={p.onSi} disabled={p.enviando}>
          {p.enviando ? 'Mandando…' : p.uno ? 'Sí, mándala' : 'Sí, mándalas'}
        </button>
        <button type="button" className="btn gl" onClick={p.onNo} disabled={p.enviando}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function Hud(p: {
  fase: FaseVoz
  refs: RefsHud
  estado: Estado
  subtitulo: { clave: string; palabras: Palabra[]; tenue: boolean } | null
  reviso: Anotacion
  modo: Anotacion
  proximo: Anotacion
  borradores: number
  conAudio: boolean
  confirmar: { pregunta: string; uno: boolean } | null
  enviando: boolean
  leerOrbe: LeerOrbe
  onOrbe: (() => void) | null
  onEscuchar: () => void
  onActualizar: () => void
  onPedirAprobar: () => void
  onAprobar: () => void
  onCancelar: () => void
}) {
  const ocupado = p.fase === 'revisando' || p.fase === 'cargando' || p.fase === 'saludando'
  const subtitulo = useMemo(
    () => (p.subtitulo ? <Subtitulo clave={p.subtitulo.clave} palabras={p.subtitulo.palabras} tenue={p.subtitulo.tenue} /> : <p className="sub" />),
    [p.subtitulo],
  )
  return (
    <section className={`center${p.confirmar ? ' pregunta' : ''}`} aria-label="Knox">
      <NucleoQuieto fase={p.fase} refs={p.refs} onOrbe={p.onOrbe} tocar={p.fase === 'esperando'} leer={p.leerOrbe} />
      <Anotaciones reviso={p.reviso} modo={p.modo} proximo={p.proximo} />
      <div className="speak">
        <Cara fase={p.fase} onToque={p.onOrbe} />
        <div className="dice">
          <div className="status">
            <i className={`dot${p.estado.late ? ' late' : ' quieto'}`} />
            {p.estado.texto}
            {p.estado.barra && (
              <span className={`bar${p.estado.barra === 'busca' ? ' busca' : ''}`}>
                <i ref={p.estado.barra === 'avance' ? (p.refs.barra as RefObject<HTMLElement>) : undefined} />
              </span>
            )}
            <span className="tm" ref={p.refs.tiempo as RefObject<HTMLSpanElement>} />
          </div>
          {subtitulo}
        </div>
      </div>
      <div className="acts">
        {p.borradores > 0 ? (
          <>
            <button type="button" className="btn solid" onClick={p.onPedirAprobar} disabled={p.enviando}>
              Sí, escríbeles
            </button>
            <a className="btn gl" href="/crm/mensajes">
              Muéstrame primero
            </a>
          </>
        ) : (
          <>
            <button type="button" className="btn solid" onClick={p.onEscuchar} disabled={!p.conAudio || ocupado}>
              {Icono.repetir}
              Escuchar de nuevo
            </button>
            <button type="button" className="btn gl" onClick={p.onActualizar} disabled={ocupado}>
              {Icono.actualizar}
              {ocupado ? 'Revisando…' : 'Actualizar'}
            </button>
          </>
        )}
        <button type="button" className="mic" disabled aria-label="Muy pronto: háblale a Knox">
          {Icono.microfono}
        </button>
        <span className="hint">Muy pronto: háblale a Knox</span>
      </div>
      {p.confirmar && <Confirmar pregunta={p.confirmar.pregunta} uno={p.confirmar.uno} enviando={p.enviando} onSi={p.onAprobar} onNo={p.onCancelar} />}
    </section>
  )
}
