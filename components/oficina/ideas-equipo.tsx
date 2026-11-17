'use client'

import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import type { EstadoIdea, Idea, Post, Ronda } from '@/lib/oficina/tipos'
import { accionIdea, avisoRonda, contarIdeas, cuandoCorto, filtrarIdeas, focoAlDecidir, type FiltroIdeas } from '@/lib/oficina/foro'
import { fechaCR, horaCR } from '@/lib/oficina/horario'
import { HORAS_TERTULIA } from '@/lib/oficina/turnos'
import { nombreDe, type AgenteSnap } from '@/lib/oficina/pagina'
import { Cara } from './cara'
import { citar } from './ficha'
import { traerYBrillar } from './foro'

// Las ideas del equipo, como el boceto: lo que salió del chat y del foro, en una tabla (la idea y por qué, quién, de
// qué post salió, cuándo y su estado) con «Me sirve» y «No va». Tocar el que ya está puesto lo deshace; «No va» tacha
// la idea. El filtro lo lleva la Oficina («Ver ideas» abre en Nuevas, o en Todas si no queda ninguna nueva). Si la idea
// que decidiste sale del filtro, el foco pasa al mismo botón de la fila siguiente (o al título). Con foco, baja hasta
// esa idea y la hace brillar; vez cambia cada vez que se pide (así, pedir otra vez la misma idea la vuelve a traer).

type Accion = 'sirve' | 'no_va' | 'deshacer'

const FILTROS: [FiltroIdeas, string][] = [['todas', 'Todas'], ['nueva', 'Nuevas'], ['sirve', 'Me sirven'], ['no_va', 'No van']]
const ESTADO: Record<EstadoIdea, string> = { nueva: 'Nueva', sirve: 'Te sirve', no_va: 'No va' }
const SIN_IDEAS: Record<FiltroIdeas, string> = {
  todas: `Todavía no hay ideas del equipo. Salen del chat y del foro, después de la tertulia, que corre tres veces al día: ${HORAS_TERTULIA}.`,
  nueva: 'No hay ideas nuevas: ya respondiste todas.',
  sirve: 'Todavía no marcaste ninguna con «Me sirve».',
  no_va: 'Todavía no marcaste ninguna con «No va».',
}

// «Todas» sin ninguna idea: si la tertulia de hoy ya corrió, cuándo sale lo primero; si falló o se saltó, el aviso
function vacioTodas(p: { proxima: string | null, ronda: Ronda | null, ahora: Date }): string {
  if (p.proxima) return `La tertulia de hoy ya corrió. Las ideas van saliendo con las publicaciones, desde las ${horaCR(new Date(p.proxima))}.`
  const aviso = avisoRonda(p.ronda, fechaCR(p.ahora))
  if (aviso) return `${aviso}.`
  return SIN_IDEAS.todas
}

type Comun = {
  foro: Post[]
  agentes: AgenteSnap[]
  retratos: Record<string, string>
  ahora: Date
  abrirFicha(id: string): void
  irPost(id: string): void
}
type Boton = 'sirve' | 'no_va'

export function IdeasEquipo(p: Comun & {
  ideas: Idea[]
  proxima: string | null
  ronda: Ronda | null
  foco: string | null
  vez: number
  filtro: FiltroIdeas
  cambiarFiltro(f: FiltroIdeas): void
  decidir(id: string, accion: Accion): void
}) {
  const caja = useRef<HTMLDivElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)
  // a dónde va el foco cuando la idea que decidiste sale del filtro (su botón desaparece)
  const focoTras = useRef<ReturnType<typeof focoAlDecidir>>(null)
  const cuentas = contarIdeas(p.ideas)
  const lista = filtrarIdeas(p.ideas, p.filtro)

  useEffect(() => {
    if (!p.foco) return
    const el = caja.current?.querySelector<HTMLElement>(`[data-of-foco="${CSS.escape(p.foco)}"]`)
    if (el) traerYBrillar(el, { block: 'center', enfocar: true })
  }, [p.foco, p.vez])

  // ya sin la fila: si el foco se cayó con su botón, pasa al mismo botón de la siguiente o al título
  useLayoutEffect(() => {
    const f = focoTras.current
    if (!f) return
    focoTras.current = null
    const activo = document.activeElement
    if (activo && activo !== document.body && activo.isConnected) return
    if (f === 'titulo') return titulo.current?.focus()
    caja.current?.querySelector<HTMLElement>(`[data-of-foco="${CSS.escape(f.id)}"] .of-${f.boton === 'sirve' ? 'si' : 'no'}`)?.focus({ preventScroll: true })
  })
  const tocar = (i: Idea, boton: Boton) => {
    focoTras.current = focoAlDecidir(lista, i, boton, p.filtro)
    p.decidir(i.id, accionIdea(i, boton))
  }

  return (
    <div className="of-v-ideas" ref={caja}>
      <div className="of-ideas-cab">
        <div>
          <h2 ref={titulo} tabIndex={-1}>
            Ideas del equipo
          </h2>
          <p>Lo bueno que sale del chat y del foro cae aquí. Tú decides: «Me sirve» o «No va».</p>
        </div>
        <div className="of-filtros" role="group" aria-label="Qué ideas ver">
          {FILTROS.map(([f, texto]) => (
            <button key={f} type="button" className="of-filtro" aria-pressed={p.filtro === f} onClick={() => p.cambiarFiltro(f)}>
              {texto} ({cuentas[f]})
            </button>
          ))}
        </div>
      </div>
      <div className="of-tabla">
        <div className="of-idea of-enc" aria-hidden="true">
          <span>La idea</span>
          <span>Quién</span>
          <span>De dónde salió</span>
          <span>Cuándo</span>
          <span className="of-der">¿Te sirve?</span>
        </div>
        {lista.length ? (
          <ul className="of-ideas-lista">
            {lista.map((i) => (
              <Fila key={i.id} i={i} c={p} tocar={tocar} />
            ))}
          </ul>
        ) : (
          <p className="of-ideas-vacio">{p.filtro === 'todas' && !p.ideas.length ? vacioTodas(p) : SIN_IDEAS[p.filtro]}</p>
        )}
      </div>
    </div>
  )
}

function Fila({ i, c, tocar }: { i: Idea; c: Comun; tocar(i: Idea, boton: Boton): void }) {
  const idTexto = useId()
  const autor = c.agentes.find((a) => a.id === i.de)
  const post = i.post_id ? c.foro.find((x) => x.id === i.post_id) ?? null : null
  return (
    <li className={`of-idea of-i-${i.estado}`} data-of-foco={i.id} tabIndex={-1}>
      <div className="of-idea-tx">
        <span id={idTexto}>{i.texto}</span>
        {i.por_que && <small>Por qué: {i.por_que}</small>}
      </div>
      {autor ? (
        <button type="button" className="of-idea-quien" data-of-ficha onClick={() => c.abrirFicha(i.de)}>
          <Cara agente={autor} url={c.retratos[i.de]} px={24} />
          <span>
            {autor.nombre}
            <small>{autor.oficio}</small>
          </span>
        </button>
      ) : (
        <span className="of-idea-quien">
          <span>{nombreDe(i.de, c.agentes)}</span>
        </span>
      )}
      <div className="of-idea-de">
        {post ? (
          <>
            <button type="button" className="of-lnk" onClick={() => c.irPost(post.id)}>
              {citar(post.titulo)}
            </button>
            <small>Post de {nombreDe(post.de, c.agentes)} en el Foro</small>
          </>
        ) : (
          <small>De un post viejo del foro</small>
        )}
      </div>
      <div className="of-idea-cuando">{cuandoCorto(new Date(i.mostrar_desde), c.ahora)}</div>
      <div className="of-idea-acc">
        <span className={`of-est of-est-${i.estado}`}>{ESTADO[i.estado]}</span>
        <button type="button" className="of-btn of-si" aria-pressed={i.estado === 'sirve'} aria-describedby={idTexto} onClick={() => tocar(i, 'sirve')}>
          Me sirve
        </button>
        <button type="button" className="of-btn of-no" aria-pressed={i.estado === 'no_va'} aria-describedby={idTexto} onClick={() => tocar(i, 'no_va')}>
          No va
        </button>
      </div>
    </li>
  )
}
