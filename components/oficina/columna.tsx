'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { FilaTeToca, Marca, Proximo, Pub } from '@/lib/oficina/tipos'
import { dondeLinea, type LineaChat } from '@/lib/oficina/chat'
import type { Seccion } from '@/lib/oficina/direccion'
import { proximos as listaProximos } from '@/lib/oficina/estado'
import { ahoraFicha } from '@/lib/oficina/ficha'
import { enlaceSeguro, lineaAhora, lineaFalla, momentoCR, nombreDe, type AgenteSnap } from '@/lib/oficina/pagina'
import type { LugarSala } from '@/lib/oficina/sala'
import type { Visita } from '@/lib/oficina/visitas'
import { COL } from './pixel/vista'
import { Cara } from './cara'
import { BotonIcono, NOMBRE } from './grande'

// La columna de la derecha: Para ti (con «Te toca»), el Chat y Ahora / Falló / Lo próximo.
// Cada caja se ve en la columna ('normal'), al lado ('lado', el tercio de la derecha) o en grande ('grande', en la
// ventana de grande.tsx): la misma caja con más espacio, la letra más grande en grande y las listas sin cortar.
export type Tamano = 'normal' | 'lado' | 'grande'

type Abrir = (modo: 'lado' | 'grande') => void

// «Ver»: abre lo que te dejó en otra pestaña y lo marca como visto (la página lo quita de «Para ti»)
export function Ver({ m, ver }: { m: Marca; ver(m: Marca): void }) {
  if (!enlaceSeguro(m.enlace)) return null
  return (
    <a
      className="of-btn of-chico of-pri of-ver"
      href={m.enlace}
      target="_blank"
      rel="noopener"
      onClick={() => ver(m)}
      onAuxClick={(e) => {
        if (e.button === 1) ver(m)
      }}
    >
      Ver
    </a>
  )
}

// Los botones del encabezado de una sección: en la columna, ◧ «Al lado» (si se puede) y ⤢ «En grande»; al lado, ⤢ y ✕.
// En grande van en la ventana (grande.tsx). Los de la columna llevan data-of-abre: al cerrar, el foco vuelve a ellos.
export function Acciones(p: { id: Seccion; tamano: Tamano; puedeLado: boolean; abrir: Abrir; cerrar(): void }) {
  if (p.tamano === 'grande') return null
  const normal = p.tamano === 'normal'
  return (
    <span className="of-acc">
      {normal && p.puedeLado && (
        <BotonIcono tipo="lado" etiqueta={`Ver ${NOMBRE[p.id]} al lado`} titulo="Al lado" abre={`${p.id}-lado`} onClick={() => p.abrir('lado')} />
      )}
      <BotonIcono
        tipo="grande"
        etiqueta={`Ver ${NOMBRE[p.id]} en grande`}
        titulo="En grande"
        abre={normal ? `${p.id}-grande` : undefined}
        onClick={() => p.abrir('grande')}
      />
      {!normal && <BotonIcono tipo="cerrar" etiqueta="Cerrar" titulo="Cerrar" onClick={p.cerrar} />}
    </span>
  )
}

// cuenta: el número de la caja (el de «Para ti»). En grande, el título va en la ventana: aquí solo queda lo de debajo.
export function Caja(p: {
  id: Seccion
  titulo: string
  sub?: string
  cuenta?: number
  tamano: Tamano
  puedeLado: boolean
  abrir: Abrir
  cerrar(): void
  children: ReactNode
}) {
  const cuenta = p.cuenta != null && <span className="of-cuenta">{p.cuenta}</span>
  const sub = p.sub && <span className="of-sub">{p.sub}</span>
  return (
    <section className={`of-caja of-${p.id} of-t-${p.tamano}`} data-of-caja={p.id} aria-label={p.titulo}>
      {p.tamano === 'grande' ? (
        (cuenta || sub) && (
          <div className="of-caja-h of-caja-sub">
            {cuenta}
            {sub}
          </div>
        )
      ) : (
        <div className="of-caja-h">
          <h2>{p.titulo}</h2>
          {cuenta}
          {sub}
          <Acciones id={p.id} tamano={p.tamano} puedeLado={p.puedeLado} abrir={p.abrir} cerrar={p.cerrar} />
        </div>
      )}
      <div className="of-caja-cuerpo">{p.children}</div>
    </section>
  )
}

// ---------- Para ti ----------
// «Te dejaron»: lo que dejaron los Knox, con su «Ver». «Te toca»: lo que solo tú puedes hacer, con su botón.
// El número de la caja es lo que no has visto más lo que te toca (el mismo de la mesa «PARA TI» de la maqueta).
export function ParaTi(p: {
  entregas: Marca[]
  teToca: FilaTeToca[]
  agentes: AgenteSnap[]
  retratos: Record<string, string>
  ahora: Date
  tamano: Tamano
  puedeLado: boolean
  abrir: Abrir
  cerrar(): void
  ver(m: Marca): void
  abrirFicha(id: string): void
  irIdeas(): void
}) {
  const ids = new Set(p.agentes.map((a) => a.id))
  const px = p.tamano === 'grande' ? 48 : 24
  return (
    <Caja
      id="parati"
      titulo="Para ti"
      sub={p.tamano === 'grande' ? 'Lo que te dejaron y lo que te toca' : undefined}
      cuenta={p.entregas.length + p.teToca.length}
      tamano={p.tamano}
      puedeLado={p.puedeLado}
      abrir={p.abrir}
      cerrar={p.cerrar}
    >
      <p className="of-grupo">TE DEJARON</p>
      {p.entregas.length ? (
        <ul className="of-lista">
          {p.entregas.map((m) => {
            const ag = p.agentes.find((a) => a.id === m.agente)
            const abrir = ids.has(m.agente) ? () => p.abrirFicha(m.agente) : undefined
            return (
              <li className="of-it" key={m.id}>
                <Cara agente={ag} url={p.retratos[m.agente]} px={px} alTocar={abrir} />
                <button type="button" className="of-it-tx" data-of-ficha onClick={abrir} disabled={!abrir}>
                  <b>{nombreDe(m.agente, p.agentes)}</b> · {m.texto}
                  <small>{momentoCR(new Date(m.creado_en), p.ahora)}</small>
                </button>
                {enlaceSeguro(m.enlace) ? <Ver m={m} ver={p.ver} /> : <span />}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="of-vacio">Nada nuevo por ahora.</p>
      )}
      {p.teToca.length > 0 && (
        <>
          <p className="of-grupo of-toca">TE TOCA</p>
          <ul className="of-lista">
            {p.teToca.map((f) => (
              <li className="of-it" key={f.clave}>
                <span className="of-ico" aria-hidden="true">
                  {f.n}
                </span>
                <div className="of-it-tx">
                  <b>{f.texto}</b>
                  {f.sub && <small>{f.sub}</small>}
                </div>
                {f.href === '#ideas' ? (
                  <button type="button" className="of-btn of-chico of-pri" onClick={p.irIdeas}>
                    {f.boton}
                  </button>
                ) : enlaceSeguro(f.href) ? (
                  <a className="of-btn of-chico of-pri" href={f.href} target="_blank" rel="noopener">
                    {f.boton}
                  </a>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Caja>
  )
}

// ---------- Chat ----------
// Lo que hablan entre ellos y lo que pasó de verdad, por hora. Arranca abajo y solo baja solo si ya estabas abajo.
// Las líneas de una charla dicen dónde fue, discreto: «en el café», «en la sala» o «en la oficina de Lynx».
// Al lado y en grande, la lista llena el alto que hay.
export function Chat(p: {
  lineas: LineaChat[]
  escribiendo: string | null
  dormida: boolean
  agentes: AgenteSnap[]
  retratos: Record<string, string>
  ahora: Date
  tamano: Tamano
  puedeLado: boolean
  abrir: Abrir
  cerrar(): void
  abrirFicha(id: string): void
  irIdea(id: string): void
}) {
  const lista = useRef<HTMLOListElement>(null)
  const abajo = useRef(true)
  const conocidas = useRef<Set<string> | null>(null)
  const relojes = useRef(new Set<ReturnType<typeof setTimeout>>())
  const [nuevas, setNuevas] = useState<ReadonlySet<string>>(() => new Set())
  const clave = (l: LineaChat) => `${l.tipo}:${l.id}`
  const firma = p.lineas.map(clave).join('|')

  // la que acaba de llegar se ilumina un ratito (no las que ya estaban al abrir la página). Cada tanda apaga la suya,
  // aunque llegue otra antes, y su reloj se borra al sonar; los que quedan se cancelan al desmontar.
  useEffect(() => {
    const todas = firma ? firma.split('|') : []
    const antes = conocidas.current
    conocidas.current = new Set(todas)
    if (!antes) return
    const recien = todas.filter((k) => !antes.has(k))
    if (!recien.length) return
    setNuevas((s) => new Set([...s, ...recien]))
    const reloj = setTimeout(() => {
      relojes.current.delete(reloj)
      setNuevas((s) => new Set([...s].filter((k) => !recien.includes(k))))
    }, 1800)
    relojes.current.add(reloj)
  }, [firma])
  useEffect(() => {
    const r = relojes.current
    return () => {
      r.forEach(clearTimeout)
      r.clear()
    }
  }, [])

  useLayoutEffect(() => {
    const el = lista.current
    if (el && abajo.current) el.scrollTop = el.scrollHeight
  }, [firma])

  const ids = new Set(p.agentes.map((a) => a.id))
  const nombre = (id: string) => (id === 'ale' ? 'Ale' : nombreDe(id, p.agentes))
  const px = p.tamano === 'grande' ? 48 : 24

  return (
    <Caja
      id="chat"
      titulo="Chat"
      sub={p.dormida ? 'Hablan dormidos: nada de trabajo' : 'Lo que hablan entre ellos'}
      tamano={p.tamano}
      puedeLado={p.puedeLado}
      abrir={p.abrir}
      cerrar={p.cerrar}
    >
      <ol
        className="of-chat-lista"
        ref={lista}
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget
          abajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
        }}
      >
        {p.lineas.map((l) => {
          const k = clave(l)
          const puede = ids.has(l.de)
          const donde = dondeLinea(l, nombre)
          return (
            <li
              key={k}
              className={`of-msg${l.tipo === 'sueno' ? ' of-sueno' : ''}${nuevas.has(k) ? ' of-nuevo' : ''}${puede ? '' : ' of-quieta'}`}
              data-of-ficha
              onClick={(e) => {
                // la carita y «💡 Idea» se encargan de lo suyo
                if (puede && !(e.target as Element).closest('button')) p.abrirFicha(l.de)
              }}
            >
              <Cara agente={p.agentes.find((a) => a.id === l.de)} url={p.retratos[l.de]} px={px} alTocar={puede ? () => p.abrirFicha(l.de) : undefined} />
              <div className="of-msg-cuerpo">
                <span className="of-msg-cab">
                  <b>{nombre(l.de)}</b>
                  {l.para && <> → {nombre(l.para)}</>}
                  {donde && <span className="of-msg-donde"> · {donde}</span>}
                </span>
                <span className="of-msg-tx">
                  {l.texto}
                  {l.idea_id && (
                    <>
                      {' '}
                      <button type="button" className="of-chip-idea" onClick={() => p.irIdea(l.idea_id as string)}>
                        💡 Idea
                      </button>
                    </>
                  )}
                </span>
              </div>
              <span className="of-msg-h">{momentoCR(new Date(l.cuando), p.ahora)}</span>
            </li>
          )
        })}
        {!p.lineas.length && <li className="of-vacio of-chat-vacio">{p.dormida ? 'Todos duermen. Nadie dice nada.' : 'Todavía nadie ha dicho nada hoy.'}</li>}
      </ol>
      {p.escribiendo && (
        <div className="of-chat-pie">
          <span className="of-escribe" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            {nombre(p.escribiendo)} {p.dormida ? 'habla dormido…' : 'está escribiendo…'}
          </span>
        </div>
      )}
    </Caja>
  )
}

// ---------- Ahora / Falló / Lo próximo ----------
// Con más espacio (al lado y en grande): todos los Knox con lo que hace cada uno o hasta cuándo descansa (lo mismo que
// dice su ficha, también si está en la sala o de visita), las fallas y los 20 próximos (con el día cuando no es hoy).
const PROXIMOS_AMPLIO = 20

export function Ahora(p: {
  agentes: AgenteSnap[]
  marcas: Marca[]
  paraTi: Marca[]
  proximos: Proximo[] // los 5 que manda el servidor
  pubs: Pub[] // con más espacio, «Lo próximo» completo se arma con estas
  sala: Record<string, LugarSala> // quién está en la sala y dónde
  visitas: Record<string, Visita> // quién está de visita y en la oficina de quién
  dormida: boolean
  ahora: Date
  tamano: Tamano
  puedeLado: boolean
  abrir: Abrir
  cerrar(): void
  abrirFicha(id: string): void
}) {
  const ids = new Set(p.agentes.map((a) => a.id))
  const amplio = p.tamano !== 'normal'
  // dormida: los que se quedan despiertos (Echo atiende a la gente; los demás, de guardia)
  const guardia = (a: AgenteSnap) => (a.id === 'echo' ? 'Atiende a la gente' : 'De guardia')
  const vivos = p.dormida
    ? p.agentes.filter((a) => a.despierto_siempre)
    : p.agentes.filter((a) => a.estado === 'trabajando' || a.estado === 'publicando' || a.estado === 'a-medias')
  const fallaron = p.agentes.filter((a) => a.estado === 'fallo')
  const sub = p.dormida
    ? vivos.length ? `Todos duermen menos ${vivos.length}` : 'Todos duermen'
    : vivos.length ? `${vivos.length} en lo suyo` : undefined
  const equipo = amplio ? p.agentes.slice().sort((x, y) => x.puesto - y.puesto) : vivos
  const nombre = (id: string) => nombreDe(id, p.agentes)
  const queHace = (a: AgenteSnap) => {
    if (amplio) {
      return ahoraFicha(a, {
        marcas: p.marcas, paraTi: p.paraTi, ahora: p.ahora, dormida: p.dormida, lugar: p.sala[a.id] ?? null, visita: p.visitas[a.id] ?? null, nombreDe: nombre,
      })
    }
    if (p.dormida) return a.despierto_siempre ? guardia(a) : 'Duerme'
    return lineaAhora(a, p.marcas, p.paraTi, p.ahora) ?? 'En lo suyo'
  }
  const proximos = amplio ? listaProximos(p.agentes, p.pubs, p.ahora, PROXIMOS_AMPLIO, (d) => momentoCR(d, p.ahora)) : p.proximos

  return (
    <Caja id="ahora" titulo="Ahora" sub={sub} tamano={p.tamano} puedeLado={p.puedeLado} abrir={p.abrir} cerrar={p.cerrar}>
      <div className="of-ahora-sec">
        {amplio && <h3>EL EQUIPO</h3>}
        {equipo.length ? (
          equipo.map((a) => (
            <button type="button" className="of-fila" data-of-ficha key={a.id} onClick={() => p.abrirFicha(a.id)}>
              <span className="of-dot" style={{ background: COL[p.dormida && !a.despierto_siempre ? 'durmiendo' : a.estado] }} />
              <span className="of-tx">
                <b>{a.nombre}</b> <em>{queHace(a)}</em>
              </span>
            </button>
          ))
        ) : (
          <p className="of-vacio">{p.dormida ? 'Todos duermen.' : 'Nadie está trabajando en este momento.'}</p>
        )}
      </div>

      <div className="of-ahora-sec of-rojo">
        <h3>FALLÓ</h3>
        {fallaron.length ? (
          fallaron.map((a) => {
            const cuando = lineaFalla(a, p.marcas, p.ahora)
            return (
              <button type="button" className="of-fila" data-of-ficha key={a.id} onClick={() => p.abrirFicha(a.id)}>
                <span className="of-dot" style={{ background: COL.fallo }} />
                <span className="of-tx">
                  <b>{a.nombre}</b> <em>{lineaAhora(a, p.marcas, p.paraTi, p.ahora) ?? 'Algo no le salió'}</em>
                  {cuando && <small>{cuando}</small>}
                </span>
              </button>
            )
          })
        ) : (
          <p className="of-vacio">Nada falló.</p>
        )}
      </div>

      <div className="of-ahora-sec">
        <h3>LO PRÓXIMO</h3>
        {proximos.length ? (
          proximos.map((n, i) => {
            const conFicha = ids.has(n.agente)
            return (
              <button
                type="button"
                className="of-fila"
                data-of-ficha
                key={`${n.agente}-${n.cuando}-${i}`}
                onClick={conFicha ? () => p.abrirFicha(n.agente) : undefined}
                disabled={!conFicha}
              >
                <span className="of-h">{p.dormida ? <span className="of-pausa">en pausa</span> : n.cuando}</span>
                <span className="of-tx">
                  <b>{nombreDe(n.agente, p.agentes)}</b> <em>{n.texto}</em>
                </span>
              </button>
            )
          })
        ) : (
          <p className="of-vacio">Nada programado por ahora.</p>
        )}
      </div>
    </Caja>
  )
}
