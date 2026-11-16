'use client'

import type { Marca, Proximo } from '@/lib/oficina/tipos'
import { lineaAhora, lineaFalla, marcaDeAhora, momentoCR, nombreDe, type AgenteSnap } from '@/lib/oficina/pagina'
import { COL } from './pixel/vista'

// Solo se abren enlaces web o del mismo sitio (una marca mal escrita no puede meter un «javascript:»)
export const enlaceSeguro = (e: string | null): e is string => !!e && /^(https?:\/\/|\/)/i.test(e)

// «Ver»: abre lo que te dejó en otra pestaña y lo marca como visto (la página lo quita de «Para ti»)
export function Ver({ m, ver }: { m: Marca; ver(m: Marca): void }) {
  if (!enlaceSeguro(m.enlace)) return null
  return (
    <a
      className="of-ver"
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

// El panel de al lado: Ahora, Para ti, Falló y Lo próximo. Cada línea abre la ficha de su Knox
export function Panel(p: {
  agentes: AgenteSnap[]
  marcas: Marca[]
  paraTi: Marca[]
  proximos: Proximo[]
  dormida: boolean
  ahora: Date
  abrir(id: string): void
  ver(m: Marca): void
}) {
  const ids = new Set(p.agentes.map((a) => a.id))
  const enAccion = p.agentes.filter((a) => a.estado === 'trabajando' || a.estado === 'publicando' || a.estado === 'a-medias')
  const fallaron = p.agentes.filter((a) => a.estado === 'fallo')

  return (
    <aside className="of-lado" aria-label="Lo de ahora">
      <section className="of-box">
        <h2>Ahora</h2>
        {enAccion.length ? (
          enAccion.map((a) => (
            <div className="of-fila" key={a.id}>
              <button type="button" className="of-fila-btn" data-of-ficha onClick={() => p.abrir(a.id)}>
                <span className="of-dot" style={{ background: COL[a.estado] }} />
                <span className="of-tx">
                  <b>{a.nombre}</b> <em>· {a.oficio}</em>
                  <small>{lineaAhora(a, p.marcas, p.paraTi, p.ahora) ?? 'En lo suyo'}</small>
                </span>
              </button>
            </div>
          ))
        ) : (
          <p className="of-vacia">{p.dormida ? 'Todos duermen.' : 'Nadie está trabajando en este momento.'}</p>
        )}
      </section>

      <section className="of-box naranja">
        <h2>Para ti</h2>
        {p.paraTi.length ? (
          p.paraTi.map((m) => {
            const oficio = p.agentes.find((a) => a.id === m.agente)?.oficio
            return (
              <div className="of-fila" key={m.id}>
                <button type="button" className="of-fila-btn" data-of-ficha onClick={() => ids.has(m.agente) && p.abrir(m.agente)}>
                  <span className="of-dot" style={{ background: COL.listo }} />
                  <span className="of-tx">
                    <b>{nombreDe(m.agente, p.agentes)}</b>
                    {oficio && <em> · {oficio}</em>}
                    <small>
                      {m.texto} · {momentoCR(new Date(m.creado_en), p.ahora)}
                    </small>
                  </span>
                </button>
                <Ver m={m} ver={p.ver} />
              </div>
            )
          })
        ) : (
          <p className="of-vacia">Nada nuevo para ti.</p>
        )}
      </section>

      <section className="of-box rojo">
        <h2>Falló</h2>
        {fallaron.length ? (
          fallaron.map((a) => {
            const cuando = lineaFalla(a, p.marcas, p.ahora)
            return (
              <div className="of-fila" key={a.id}>
                <button type="button" className="of-fila-btn" data-of-ficha onClick={() => p.abrir(a.id)}>
                  <span className="of-dot" style={{ background: COL.fallo }} />
                  <span className="of-tx">
                    <b>{a.nombre}</b> <em>· {a.oficio}</em>
                    <small>{marcaDeAhora(a, p.marcas, p.paraTi)?.texto ?? 'Algo no le salió'}</small>
                    {cuando && <small>{cuando}</small>}
                  </span>
                </button>
              </div>
            )
          })
        ) : (
          <p className="of-vacia">Nada falló.</p>
        )}
      </section>

      <section className="of-box">
        <h2>Lo próximo</h2>
        {p.dormida ? (
          <p className="of-pausa">en pausa</p>
        ) : p.proximos.length ? (
          p.proximos.map((n, i) => {
            const contenido = (
              <>
                <span className="of-h">{n.cuando}</span>
                <span className="of-tx">
                  <b>{nombreDe(n.agente, p.agentes)}</b> · {n.texto}
                </span>
              </>
            )
            return (
              <div className="of-fila" key={`${n.agente}-${n.cuando}-${i}`}>
                {ids.has(n.agente) ? (
                  <button type="button" className="of-fila-btn" data-of-ficha onClick={() => p.abrir(n.agente)}>
                    {contenido}
                  </button>
                ) : (
                  <div className="of-fila-btn" style={{ cursor: 'default' }}>
                    {contenido}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <p className="of-vacia">Nada programado por ahora.</p>
        )}
      </section>
    </aside>
  )
}
