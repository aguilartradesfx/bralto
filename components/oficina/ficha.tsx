'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { Aspecto, DiaSemana, Foto, Marca, Post, Pub } from '@/lib/oficina/tipos'
import type { LineaChat } from '@/lib/oficina/chat'
import type { LugarSala } from '@/lib/oficina/sala'
import { ahoraFicha, fotosDe, lugarDe, marcasDeHoy, notaProximo, proximosDeAgente, ultimoEnForo } from '@/lib/oficina/ficha'
import { horaCR } from '@/lib/oficina/horario'
import { ETIQUETA, enlaceSeguro, lineaFalla, momentoCR, nombreDe, recortar, type AgenteSnap } from '@/lib/oficina/pagina'
import { SH, SW, sprite } from './pixel/knox-sprite'
import { COL } from './pixel/vista'
import { Ver } from './columna'
import { Icono } from './grande'

// La ficha de un Knox, como el boceto: su foto (que se toca y abre el visor), quién es, sus números y, de arriba abajo,
// Ahora, Hoy, Te dejó, Lo próximo, Dónde trabaja, En el chat, En el foro, Sus fotos y sus últimos 7 días. Todo lo que
// parece botón lleva a algún lado; lo que va a otra página se abre en otra pestaña.
// Se abre al tocar un Knox (su oficina, su carita o su nombre) y se cierra con ×, Esc o tocando afuera; en el teléfono
// sube desde abajo.

// La foto pixel: el sprite de 28×38 ampliado un número entero de pixeles de pantalla (nítido en cualquier pantalla)
const ESCALA = 6

function FotoPixel({ aspecto, nombre, dormido }: { aspecto: Aspecto; nombre: string; dormido: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const clave = JSON.stringify(aspecto)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c) return
    const dpr = window.devicePixelRatio || 1
    const k = Math.max(1, Math.round(ESCALA * dpr))
    cv.width = SW * k
    cv.height = SH * k
    cv.style.width = `${(SW * k) / dpr}px`
    cv.style.height = `${(SH * k) / dpr}px`
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, cv.width, cv.height)
    c.drawImage(sprite(JSON.parse(clave) as Aspecto, { dormido }), 0, 0, SW * k, SH * k)
  }, [clave, dormido])
  return <canvas ref={ref} width={SW * ESCALA} height={SH * ESCALA} role="img" aria-label={`${nombre}, en pixel art`} />
}

// Arriba: el retrato, que abre el visor. Sin retrato, el Knox en pixel con «foto pronto», que no es botón (si el retrato
// existe pero no cargó, el pixel sin el letrero).
function Retrato({ a, foto, dormido, abrirFoto }: { a: AgenteSnap; foto: Foto | null; dormido: boolean; abrirFoto(f: Foto): void }) {
  const [rota, setRota] = useState<string | null>(null)
  if (foto && rota !== foto.url) {
    return (
      <button type="button" className="of-foto" onClick={() => abrirFoto(foto)} aria-label={`Ver la foto de ${a.nombre} en grande`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado del bucket privado, de 1 hora */}
        <img src={foto.url} alt="" draggable={false} onError={() => setRota(foto.url)} />
        <span className="of-foto-lupa" aria-hidden="true">
          <Icono tipo="grande" />
        </span>
      </button>
    )
  }
  return (
    <div className="of-foto">
      <FotoPixel aspecto={a.aspecto} nombre={a.nombre} dormido={dormido} />
      {!foto && <span className="of-pronto">foto pronto</span>}
    </div>
  )
}

function Seccion({ titulo, cuenta, children }: { titulo: string; cuenta?: number; children: ReactNode }) {
  return (
    <section className="of-fsec">
      <h3>
        {titulo}
        {cuenta ? <span className="of-cuenta">{cuenta}</span> : null}
      </h3>
      {children}
    </section>
  )
}

const Vacio = ({ children }: { children: ReactNode }) => <p className="of-fvacio">{children}</p>

// Los últimos 7 días: tareas terminadas por día (las marcas «termina»), el día con una falla en rojo
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const nombreDia = (d: DiaSemana) => (d.etiqueta === 'Hoy' ? 'hoy' : DIAS[new Date(`${d.dia}T12:00:00Z`).getUTCDay()])
const ALTO_MAX = 74

function Semana({ dias }: { dias: DiaSemana[] }) {
  if (!dias.length) return null
  const max = Math.max(1, ...dias.map((d) => d.tareas))
  const conFalla = dias.some((d) => d.falla)
  const leida = dias.map((d) => `${nombreDia(d)}, ${d.tareas}${d.falla ? ' y una falla' : ''}`).join('; ')
  return (
    <>
      <div className="of-semana" role="img" aria-label={`Tareas terminadas por día: ${leida}`}>
        {dias.map((d) => (
          <div key={d.dia} className={`of-sem-dia${d.etiqueta === 'Hoy' ? ' of-hoy' : ''}${d.tareas ? '' : ' of-cero'}${d.falla ? ' of-malo' : ''}`}>
            <span className="of-v">{d.tareas}</span>
            <span className="of-barra" style={{ height: d.tareas ? Math.max(4, Math.round((d.tareas / max) * ALTO_MAX)) : d.falla ? 4 : 2 }} />
            <span className="of-d">{d.etiqueta}</span>
          </div>
        ))}
      </div>
      <p className="of-semana-nota">
        Tareas terminadas cada día. Hoy todavía no termina.{conFalla && ' En rojo, los días en que algo falló.'}
      </p>
    </>
  )
}

const otraPestana = { target: '_blank', rel: 'noopener' } as const
// «…» alrededor de lo que dijo; las comillas que ya traía pasan a “…” (así no quedan dos » seguidas)
export const citar = (s: string) => `«${s.replace(/«/g, '“').replace(/»/g, '”')}»`

export function Ficha(p: {
  agente: AgenteSnap | null
  abierta: boolean
  agentes: AgenteSnap[]
  marcas: Marca[]
  paraTi: Marca[]
  pubs: Pub[]
  lineas: LineaChat[] // el chat de hoy, como se ve en la página
  fotos: Foto[]
  foro: Post[]
  lugar: LugarSala | null // dónde está en la sala, si está
  dormida: boolean
  ahora: Date
  cerrar(): void
  ver(m: Marca): void
  abrirFoto(f: Foto): void
  irPost(id: string): void
  refFicha: RefObject<HTMLElement | null>
}) {
  const antes = useRef<HTMLElement | null>(null)
  const a = p.agente
  const visible = p.abierta && !!a

  // al abrir, el foco va a la ficha (sin anillo: no es un botón); al cerrar vuelve a donde estaba (si era un botón del panel)
  useEffect(() => {
    if (p.abierta) {
      const activo = document.activeElement
      antes.current = activo instanceof HTMLElement && activo !== document.body ? activo : null
      p.refFicha.current?.focus({ preventScroll: true })
      return
    }
    const previo = antes.current
    antes.current = null
    if (previo && previo.isConnected && p.refFicha.current?.contains(document.activeElement)) previo.focus({ preventScroll: true })
  }, [p.abierta, p.refFicha])

  // cada ficha arranca arriba; si se cambia de Knox con la ficha abierta, el foco se queda en ella
  const id = a?.id ?? null
  useEffect(() => {
    const el = p.refFicha.current
    if (!el || !p.abierta || !id) return
    el.scrollTop = 0
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true })
  }, [id, p.abierta, p.refFicha])

  return (
    <aside
      ref={p.refFicha}
      className={`of-ficha${visible ? ' of-abierta' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={a ? `Ficha de ${a.nombre}` : 'Ficha'}
      aria-hidden={!visible}
      inert={!visible}
      tabIndex={-1}
    >
      <button type="button" className="of-cerrar" aria-label="Cerrar la ficha" onClick={p.cerrar}>
        ×
      </button>
      {a && <Contenido {...p} a={a} />}
    </aside>
  )
}

function Contenido(p: Parameters<typeof Ficha>[0] & { a: AgenteSnap }) {
  const { a } = p
  const nombre = (id: string) => nombreDe(id, p.agentes)
  const para = (id: string | null) => (id ? <small>{id === 'ale' ? 'Para ti' : `Para ${nombre(id)}`}</small> : null)

  const suyas = fotosDe(a.id, p.fotos, p.foro) // su retrato, si hay, va primero
  const retrato = suyas[0]?.tipo === 'retrato' ? suyas[0] : null
  const ahora = ahoraFicha(a, { marcas: p.marcas, paraTi: p.paraTi, ahora: p.ahora, dormida: p.dormida, lugar: p.lugar, nombreDe: nombre })
  const falla = a.estado === 'fallo' ? lineaFalla(a, p.marcas, p.ahora) : null
  const hoy = marcasDeHoy(a.id, p.marcas, p.ahora)
  const dejo = p.paraTi.filter((m) => m.agente === a.id)
  const proximos = proximosDeAgente(a, p.pubs, p.ahora, p.dormida)
  const nota = notaProximo(a, proximos, p.ahora, p.dormida)
  const donde = lugarDe(a.lugar)
  const dichas = p.lineas.filter((l) => l.de === a.id).slice(-3).reverse()
  const enForo = ultimoEnForo(a.id, p.foro)

  return (
    <>
      <Retrato a={a} foto={retrato} dormido={p.dormida && !a.despierto_siempre} abrirFoto={p.abrirFoto} />
      <div className="of-fcab">
        <h2>{a.nombre}</h2>
        <span className="of-estado">
          <span className="of-dot" style={{ background: COL[a.estado] }} />
          {ETIQUETA[a.estado]}
        </span>
      </div>
      <p className="of-rol">
        {a.oficio} · {a.area}
      </p>
      <div className="of-stats">
        <div className="of-stat">
          <b>{a.numeros.tareas.toLocaleString('es-CR')}</b>
          <span>tareas completadas</span>
        </div>
        <div className="of-stat">
          <b>{a.numeros.horas.toLocaleString('es-CR', { maximumFractionDigits: 1 })}</b>
          <span>horas trabajadas</span>
        </div>
        <div className="of-stat">
          <b>{a.numeros.diasSinFallar.toLocaleString('es-CR')}</b>
          <span>días sin fallar</span>
        </div>
      </div>
      {a.personalidad && <p className="of-perso">{a.personalidad}</p>}
      {a.frase && <p className="of-frase">{citar(a.frase)}</p>}

      <Seccion titulo="AHORA">
        <p className="of-fahora">
          {ahora}
          {falla && <small>{falla}</small>}
        </p>
      </Seccion>

      <Seccion titulo="HOY" cuenta={hoy.length}>
        {hoy.length ? (
          <ul className="of-flista">
            {hoy.map((m) => (
              <li className="of-fit" key={m.id}>
                <span className={`of-fit-h${m.tipo === 'falla' ? ' of-mal' : ''}`}>{horaCR(new Date(m.creado_en))}</span>
                <span className="of-fit-tx">
                  {m.texto}
                  {m.tipo === 'pasa' ? para(m.para) : m.tipo === 'entrega' ? para('ale') : null}
                </span>
                {enlaceSeguro(m.enlace) ? (
                  <a className="of-btn of-chico" href={m.enlace} {...otraPestana} aria-label={`Abrir: ${recortar(m.texto, 60)}`}>
                    Abrir
                  </a>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Vacio>{a.estado_fijo === 'pedido' ? 'Nada pedido hoy.' : 'Nada todavía hoy.'}</Vacio>
        )}
      </Seccion>

      <Seccion titulo="TE DEJÓ">
        {dejo.length ? (
          <ul className="of-flista">
            {dejo.map((m) => (
              <li className="of-fit" key={m.id}>
                <span className="of-fit-h">{momentoCR(new Date(m.creado_en), p.ahora)}</span>
                <span className="of-fit-tx">
                  <b>{m.texto}</b>
                </span>
                {enlaceSeguro(m.enlace) ? <Ver m={m} ver={p.ver} /> : <span />}
              </li>
            ))}
          </ul>
        ) : (
          <Vacio>Nada pendiente para ti.</Vacio>
        )}
      </Seccion>

      <Seccion titulo="LO PRÓXIMO">
        <ul className="of-flista">
          {nota && (
            <li className="of-fit of-solo">
              <span className="of-fit-tx">{nota}</span>
              <span />
            </li>
          )}
          {proximos.map((x, i) => (
            <li className="of-fit" key={`${x.cuando}-${i}`}>
              <span className="of-fit-h">{x.cuando}</span>
              <span className="of-fit-tx">{x.texto}</span>
              {x.href ? (
                // «Abrir» lleva a su lugar: la etiqueta dice cuál («Abrir el Calendario»)
                <a className="of-btn of-chico" href={x.href} {...otraPestana} aria-label={x.boton === 'Abrir' && donde ? `Abrir ${donde.texto}` : undefined}>
                  {x.boton}
                </a>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      </Seccion>

      {donde && (
        <Seccion titulo="DÓNDE TRABAJA">
          <div className="of-fit of-solo">
            <span className="of-fit-tx">
              Lo que hace queda en <b>{donde.texto}</b>
            </span>
            <a className="of-btn of-chico of-pri" href={donde.href} {...otraPestana}>
              {donde.boton}
            </a>
          </div>
        </Seccion>
      )}

      <Seccion titulo="EN EL CHAT">
        {dichas.length ? (
          <ul className="of-flista">
            {dichas.map((l) => (
              <li className={`of-fit of-cita${l.tipo === 'sueno' ? ' of-sueno' : ''}`} key={`${l.tipo}:${l.id}`}>
                <span className="of-fit-h">{momentoCR(new Date(l.cuando), p.ahora)}</span>
                <span className="of-fit-tx">
                  {citar(l.texto)}
                  {para(l.para)}
                </span>
                <span />
              </li>
            ))}
          </ul>
        ) : (
          <Vacio>Hoy no ha dicho nada en el chat.</Vacio>
        )}
      </Seccion>

      <Seccion titulo="EN EL FORO">
        {enForo ? (
          <div className="of-fit">
            <span className="of-fit-h">{momentoCR(new Date(enForo.cuando), p.ahora)}</span>
            <span className="of-fit-tx">
              {enForo.como}: {citar(recortar(enForo.texto, 90))}
            </span>
            <button type="button" className="of-btn of-chico" onClick={() => p.irPost(enForo.postId)}>
              Ver en el Foro
            </button>
          </div>
        ) : (
          <Vacio>Todavía no ha escrito nada en el foro.</Vacio>
        )}
      </Seccion>

      <Seccion titulo="SUS FOTOS">
        {suyas.length ? (
          <ul className="of-fotos">
            {suyas.map((f) => {
              const etiqueta = f.tipo === 'retrato' ? 'Su retrato' : f.pie?.trim() || 'Foto del equipo'
              return (
                <li key={f.id}>
                  <button type="button" className="of-mini" onClick={() => p.abrirFoto(f)} aria-label={`Ver en grande: ${etiqueta}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado del bucket privado, de 1 hora */}
                    <img src={f.url} alt="" draggable={false} loading="lazy" />
                    <span aria-hidden="true">{etiqueta}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <Vacio>Todavía no tiene fotos.</Vacio>
        )}
      </Seccion>

      <Seccion titulo="ÚLTIMOS 7 DÍAS">
        {a.estado_fijo === 'pendiente' ? (
          <Vacio>Todavía no trabaja: llega pronto.</Vacio>
        ) : (
          <>
            {a.estado_fijo === 'pedido' && <Vacio>Solo trabaja cuando le pides algo.</Vacio>}
            {(a.estado_fijo !== 'pedido' || a.semana.some((d) => d.tareas > 0)) && <Semana dias={a.semana} />}
          </>
        )}
      </Seccion>
    </>
  )
}
