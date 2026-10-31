'use client'

import { Fragment, memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { Palabra } from '@/lib/knox/centro/subtitulo'
import { BARRAS, C, envolvente, NARANJA, ondaQuieta, P, f, arco, svgAnillosVoz, svgLideres, svgNucleoAbajo, svgNucleoArriba, svgSegmentos } from './geometria'

// El centro del Centro de mando: Knox dentro de los anillos, las cuatro anotaciones, lo que está diciendo y los
// botones. La onda y el anillo de avance los mueve el cuadro a cuadro de centro.tsx (por las refs), sin React.

export type FaseVoz = 'cargando' | 'revisando' | 'esperando' | 'hablando' | 'pausado' | 'terminado' | 'error'

export type RefsHud = {
  nucleo: RefObject<HTMLDivElement | null>
  onda: RefObject<SVGGElement | null>
  ondaDentro: RefObject<SVGGElement | null>
  arco: RefObject<SVGPathElement | null>
  punta: RefObject<SVGGElement | null>
  barra: RefObject<HTMLElement | null>
  tiempo: RefObject<HTMLElement | null>
}

export type Anotacion = { valor: string; detalle: string }

const QUIETA = ondaQuieta()
// La onda antes del primer cuadro (y en el HTML del servidor): la del diseño, bajita
const INICIAL = BARRAS.map(({ j, grados }) => {
  const L = 3 + 42 * QUIETA[j] * envolvente(j) * 0.3
  const [a, b] = P(C, C, 180, grados)
  const [x, y] = P(C, C, 180 + L, grados)
  const [g, h] = P(C, C, 175, grados)
  const [m, n] = P(C, C, 175 - L * 0.22, grados)
  return { a, b, x, y, g, h, m, n, o: 0.28 + (0.72 * L) / 45 }
})

const ABAJO = svgNucleoAbajo()
const SEGMENTOS = svgSegmentos()
const ANILLOS = svgAnillosVoz()
const ARRIBA = svgNucleoArriba()
const LIDERES = svgLideres()

function Mascota({ pose, visible }: { pose: 'senalando' | 'pulgar'; visible: boolean }) {
  const src = `/knox/${pose}.webp`
  return (
    <div className={`knox${visible ? '' : ' oculto'}`} style={{ ['--kc-mascara' as string]: `url(${src})` }} aria-hidden={!visible}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ghost" src={src} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="k" src={src} alt={visible ? 'Knox' : ''} />
      <div className="scan" />
    </div>
  )
}

function Nucleo({ fase, refs, onOrbe, tocar }: { fase: FaseVoz; refs: RefsHud; onOrbe: (() => void) | null; tocar: boolean }) {
  return (
    <div className="core" ref={refs.nucleo} data-fase={fase}>
      <svg viewBox="0 0 580 580" width="580" height="580" aria-hidden>
        <g dangerouslySetInnerHTML={{ __html: ABAJO }} />
        <g className="seg" dangerouslySetInnerHTML={{ __html: SEGMENTOS }} />
        <g dangerouslySetInnerHTML={{ __html: ANILLOS }} />
        {(fase === 'revisando' || fase === 'cargando') && (
          <path className="giro" d={arco(C, C, 226, 0, 64)} fill="none" stroke={NARANJA} strokeWidth="2.5" strokeLinecap="round" filter="url(#kc-glow)" />
        )}
        <path ref={refs.arco} d="" fill="none" stroke={NARANJA} strokeWidth="2.5" strokeLinecap="round" filter="url(#kc-glow)" />
        <g ref={refs.punta} style={{ display: 'none' }}>
          <circle r="10" fill={NARANJA} fillOpacity=".16" />
          <circle r="4" fill="#ffd3bd" filter="url(#kc-glow)" />
        </g>
        <g ref={refs.onda} filter="url(#kc-glow)">
          {INICIAL.map((l, i) => (
            <line key={i} x1={f(l.a)} y1={f(l.b)} x2={f(l.x)} y2={f(l.y)} stroke={NARANJA} strokeOpacity={l.o.toFixed(2)} strokeWidth="1.7" strokeLinecap="round" />
          ))}
        </g>
        <g ref={refs.ondaDentro}>
          {INICIAL.map((l, i) => (
            <line key={i} x1={f(l.g)} y1={f(l.h)} x2={f(l.m)} y2={f(l.n)} stroke="#fff" strokeOpacity=".2" strokeWidth="1.2" strokeLinecap="round" />
          ))}
        </g>
        <g dangerouslySetInnerHTML={{ __html: ARRIBA }} />
      </svg>
      <Mascota pose="senalando" visible={fase === 'hablando'} />
      <Mascota pose="pulgar" visible={fase !== 'hablando'} />
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
  onOrbe: (() => void) | null
  onEscuchar: () => void
  onActualizar: () => void
  onPedirAprobar: () => void
  onAprobar: () => void
  onCancelar: () => void
}) {
  const ocupado = p.fase === 'revisando' || p.fase === 'cargando'
  const subtitulo = useMemo(
    () => (p.subtitulo ? <Subtitulo clave={p.subtitulo.clave} palabras={p.subtitulo.palabras} tenue={p.subtitulo.tenue} /> : <p className="sub" />),
    [p.subtitulo],
  )
  return (
    <section className={`center${p.confirmar ? ' pregunta' : ''}`} aria-label="Knox">
      <NucleoQuieto fase={p.fase} refs={p.refs} onOrbe={p.onOrbe} tocar={p.fase === 'esperando'} />
      <Anotaciones reviso={p.reviso} modo={p.modo} proximo={p.proximo} />
      <div className="speak">
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
