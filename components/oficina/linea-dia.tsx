'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { EstadoOficina, Marca, Proximo } from '@/lib/oficina/tipos'
import { horaCR } from '@/lib/oficina/horario'
import {
  SEP_PX, enlaceSeguro, lineaDelDia, listaDelDia, nombreDe, type AgenteSnap, type ClaseRaya, type EntradaDia, type RayaDia,
} from '@/lib/oficina/pagina'
import { COL } from './pixel/vista'
import { Acciones, Caja, type Tamano } from './columna'

const COLOR: Record<ClaseRaya, string> = {
  hecho: '#94a3b8',
  suave: '#64748b',
  sig: 'transparent',
  publicando: COL.publicando,
  listo: COL.listo,
  fallo: COL.fallo,
}

// Las medidas de la pista (oficina.css: .of-tl-fila y .of-dia-cuerpo; en grande, .of-dia-grande). En grande las
// etiquetas tienen letra de 12 px en vez de 10.5: la pista se mide como si fuera más angosta en esa misma proporción, así
// las etiquetas no se enciman.
const MEDIDAS = {
  normal: { nombre: 132, relleno: 28, letra: 1 },
  grande: { nombre: 150, relleno: 14, letra: 12 / 10.5 },
}
const PISTA_MIN = 620 // la pista nunca es más angosta: si no cabe, se desliza de lado
const CLAVE = 'oficina-dia' // '0' = plegada

type Props = {
  agentes: AgenteSnap[]
  marcas: Marca[]
  proximos: Proximo[]
  oficina: EstadoOficina
  ahora: Date
  tamano: Tamano
  puedeLado: boolean
  abrir(modo: 'lado' | 'grande'): void
  cerrar(): void
  abrirFicha(id: string): void
}

// La línea del día: lo que pasó hoy por área, la línea de ahora y lo que sigue. En la columna, el título la pliega (se
// recuerda) y cada nombre abre la ficha de su Knox. Al lado, donde a lo ancho no cabe, es una lista por hora; en grande,
// la línea a todo lo ancho y más alta, y cada raya es un botón con su frase y «Abrir» si tiene enlace.
export function LineaDia(p: Props) {
  return p.tamano === 'lado' ? <ListaDia {...p} /> : <Linea {...p} />
}

function Linea(p: Props) {
  const grande = p.tamano === 'grande'
  const medidas = MEDIDAS[grande ? 'grande' : 'normal']
  const ref = useRef<HTMLDivElement>(null)
  const idCuerpo = useId()
  const [ancho, setAncho] = useState(900)
  const [abierta, setAbierta] = useState(true)
  const [elegida, setElegida] = useState<string | null>(null) // la raya que tocaste (en grande)

  // cómo la dejaste la última vez (después de montar: así la del servidor y la del navegador coinciden)
  useEffect(() => {
    if (grande) return
    try {
      if (localStorage.getItem(CLAVE) === '0') setAbierta(false)
    } catch {
      /* sin almacenamiento: abierta */
    }
  }, [grande])
  const alternar = () => {
    const nueva = !abierta
    setAbierta(nueva)
    try {
      localStorage.setItem(CLAVE, nueva ? '1' : '0')
    } catch {
      /* no se pudo guardar: no pasa nada */
    }
  }

  // las etiquetas se acomodan con el ancho real de la pista para no encimarse
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const w = el.clientWidth - medidas.relleno - medidas.nombre
      if (w > 0) setAncho(Math.max(PISTA_MIN, Math.round(w)))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [medidas])

  const datos = { agentes: p.agentes, marcas: p.marcas, proximos: p.proximos, oficina: p.oficina }
  const dia = lineaDelDia(datos, p.ahora, ancho / medidas.letra)
  // «ahora» va a la izquierda de su línea; muy temprano en el día, a la derecha (si no, taparía «HOY»)
  const ahoraTx = dia.ahora < 10 ? { left: `calc(${dia.ahora}% + 5px)` } : { right: `calc(${100 - dia.ahora}% + 5px)` }
  const claveRaya = (r: RayaDia) => `${r.agente}|${r.titulo}`
  const rayaElegida = elegida ? dia.filas.flatMap((f) => f.rayas).find((r) => claveRaya(r) === elegida) ?? null : null

  const cuerpo = (
    <div className="of-dia-cuerpo" id={idCuerpo} ref={ref} hidden={!grande && !abierta}>
      <div className="of-tl-fila of-eje">
        <div className="of-tl-nom">HOY</div>
        <div className="of-tl-pista">
          {dia.ejes.map((e) => (
            <span key={e.texto + e.x} style={{ left: `${e.x}%` }}>
              {e.texto}
            </span>
          ))}
          <span className="of-tl-ahora-tx" style={ahoraTx}>
            ahora
          </span>
        </div>
      </div>
      {dia.filas.map((f) => (
        <div className="of-tl-fila" key={f.area}>
          <div className="of-tl-nom" title={f.area}>
            {f.area}
          </div>
          <div className="of-tl-pista">
            {dia.sueno && <div className="of-tl-sueno" style={{ left: `${dia.sueno.x}%`, width: `${dia.sueno.w}%` }} />}
            {f.rayas.map((r, i) =>
              grande ? (
                <button
                  key={`r${i}`}
                  type="button"
                  className={`of-tl-tb${r.clase === 'suave' ? ' of-suave' : r.clase === 'sig' ? ' of-sig' : ''}`}
                  style={{ left: `${r.x}%`, ['--of-c' as string]: COLOR[r.clase] }}
                  title={r.titulo}
                  aria-label={r.titulo}
                  aria-pressed={elegida === claveRaya(r)}
                  onClick={() => setElegida(elegida === claveRaya(r) ? null : claveRaya(r))}
                />
              ) : (
                <i
                  key={`r${i}`}
                  className={`of-tl-t${r.clase === 'suave' ? ' of-suave' : r.clase === 'sig' ? ' of-sig' : ''}`}
                  style={{ left: `${r.x}%`, background: COLOR[r.clase] }}
                  title={r.titulo}
                />
              ),
            )}
            {f.barras.map((b, i) => (
              <button
                key={`b${i}`}
                type="button"
                className="of-tl-b"
                style={{ left: `${b.x}%`, width: `${b.w}%`, background: COL[b.estado] }}
                title={b.titulo}
                aria-label={b.titulo}
                data-of-ficha
                onClick={() => p.abrirFicha(b.agente)}
              >
                {b.texto}
              </button>
            ))}
            {f.etiquetas.map((e, i) => (
              <button
                key={`e${i}`}
                type="button"
                className="of-tl-l"
                style={e.lado === 'der' ? { left: `calc(${e.x}% + ${SEP_PX}px)` } : { right: `calc(${100 - e.x}% + ${SEP_PX}px)` }}
                data-of-ficha
                onClick={() => p.abrirFicha(e.agente)}
              >
                {e.texto}
              </button>
            ))}
            {f.vacio && (
              <span className="of-tl-l of-gris" style={{ left: SEP_PX }}>
                {f.vacio}
              </span>
            )}
            <div className="of-tl-ahora" style={{ left: `${dia.ahora}%` }} />
          </div>
        </div>
      ))}
      {grande && <Detalle raya={rayaElegida} agentes={p.agentes} abrirFicha={p.abrirFicha} />}
      <ul className="of-tl-ley" aria-label="Qué quiere decir cada raya">
        <li>
          <i /> Terminó algo
        </li>
        <li>
          <i style={{ background: COL.publicando }} /> Publicó
        </li>
        <li>
          <i style={{ background: COL.listo }} /> Te dejó algo
        </li>
        <li>
          <i style={{ background: COL.fallo }} /> Falló
        </li>
        <li>
          <i className="of-sig" /> Lo que viene
        </li>
        <li>
          <i className="of-ley-ahora" /> Ahora
        </li>
        {p.oficina.dormida && (
          <li>
            <i className="of-ley-sueno" /> En pausa: la oficina duerme
          </li>
        )}
        <li>{grande ? 'Toca una raya para ver qué fue, o un nombre para ver su ficha' : 'Toca un nombre para ver su ficha'}</li>
      </ul>
    </div>
  )

  // en grande, el título y los botones van en la ventana
  if (grande) {
    return (
      <section className="of-dia of-dia-grande" data-of-caja="dia" aria-label="Línea del día">
        {cuerpo}
      </section>
    )
  }
  return (
    <section className="of-dia" data-of-caja="dia" aria-label="Línea del día">
      <div className="of-dia-cab">
        <h2 className="of-dia-h">
          <button type="button" className="of-dia-tog" aria-expanded={abierta} aria-controls={idCuerpo} onClick={alternar}>
            <span className="of-dia-tit">Línea del día</span>
            <span className="of-dia-sub">Lo hecho, lo de ahora y lo que viene, por área</span>
            <span className="of-flecha" aria-hidden="true">
              ▼
            </span>
          </button>
        </h2>
        <Acciones id="dia" tamano="normal" puedeLado={p.puedeLado} abrir={p.abrir} cerrar={p.cerrar} />
      </div>
      {cuerpo}
    </section>
  )
}

// En grande: la raya que tocaste, con su Knox (abre su ficha), su frase y «Abrir» si tiene enlace
function Detalle(p: { raya: RayaDia | null; agentes: AgenteSnap[]; abrirFicha(id: string): void }) {
  const r = p.raya
  return (
    <div className="of-tl-det" aria-live="polite">
      {r ? (
        <>
          <i className={`of-dl-m${marcaDe(r.clase)}`} style={r.clase === 'sig' ? undefined : { background: COLOR[r.clase] }} aria-hidden="true" />
          <p className="of-tl-det-tx">
            <button type="button" className="of-dl-quien" data-of-ficha onClick={() => p.abrirFicha(r.agente)}>
              {nombreDe(r.agente, p.agentes)}
            </button>{' '}
            {r.texto}
          </p>
          {enlaceSeguro(r.enlace) && (
            <a className="of-btn of-chico of-pri" href={r.enlace} target="_blank" rel="noopener">
              Abrir
            </a>
          )}
        </>
      ) : (
        <p className="of-vacio">Toca una raya para ver qué fue.</p>
      )}
    </div>
  )
}

const marcaDe = (c: ClaseRaya) => (c === 'sig' ? ' of-sig' : c === 'suave' ? ' of-suave' : '')

// Al lado: la lista por hora, de arriba abajo, con la raya de «Ahora» entre lo hecho y lo que sigue. Al abrir, «Ahora»
// queda a la vista en medio del panel.
function ListaDia(p: Props) {
  const lista = listaDelDia({ agentes: p.agentes, marcas: p.marcas, proximos: p.proximos, oficina: p.oficina }, p.ahora)
  const hechas = lista.filter((e) => !e.futuro)
  const siguen = lista.filter((e) => e.futuro)
  const raya = useRef<HTMLLIElement>(null)

  useLayoutEffect(() => {
    const el = raya.current
    const caja = el?.closest<HTMLElement>('.of-caja-cuerpo')
    if (!el || !caja) return
    caja.scrollTop += el.getBoundingClientRect().top - caja.getBoundingClientRect().top - caja.clientHeight / 2
  }, [])

  const entrada = (e: EntradaDia, i: number) => (
    <li className={`of-dl-it${e.futuro ? ' of-futuro' : ''}`} key={`${e.futuro ? 's' : 'h'}${i}-${e.agente}`}>
      <span className="of-dl-h">{e.cuando}</span>
      <i className={`of-dl-m${marcaDe(e.clase)}`} style={e.clase === 'sig' ? undefined : { background: COLOR[e.clase] }} aria-hidden="true" />
      <p className="of-dl-tx">
        <button type="button" className="of-dl-quien" data-of-ficha onClick={() => p.abrirFicha(e.agente)}>
          {nombreDe(e.agente, p.agentes)}
        </button>{' '}
        {e.texto}
      </p>
      {enlaceSeguro(e.enlace) ? (
        <a className="of-btn of-chico of-pri" href={e.enlace} target="_blank" rel="noopener">
          Abrir
        </a>
      ) : (
        <span />
      )}
    </li>
  )

  return (
    <Caja
      id="dia"
      titulo="Línea del día"
      sub="Lo hecho y lo que sigue, por hora"
      tamano="lado"
      puedeLado={p.puedeLado}
      abrir={p.abrir}
      cerrar={p.cerrar}
    >
      <ol className="of-dl">
        {hechas.length ? hechas.map(entrada) : <li className="of-vacio">Nada todavía hoy.</li>}
        <li className="of-dl-ahora" ref={raya}>
          <span>Ahora · {horaCR(p.ahora)}</span>
        </li>
        {siguen.map(entrada)}
        {p.oficina.dormida ? (
          <li className="of-vacio">Lo que sigue está en pausa: la oficina duerme.</li>
        ) : (
          !siguen.length && <li className="of-vacio">No hay nada más programado para hoy.</li>
        )}
      </ol>
    </Caja>
  )
}
