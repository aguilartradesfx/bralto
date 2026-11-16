'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Comentario, Foto, Post, Social } from '@/lib/oficina/tipos'
import {
  avisoRonda, contarIdeas, cuandoCorto, debateAbierto, filtrarForo, fotosDelEquipo, listaDeNombres, quienesComentan, type FiltroForo,
} from '@/lib/oficina/foro'
import { fechaCR } from '@/lib/oficina/horario'
import { momentoCR, nombreDe, type AgenteSnap } from '@/lib/oficina/pagina'
import { Cara } from './cara'
import { Icono } from './grande'

// El foro del equipo, como el boceto: a la izquierda los filtros y los posts (cada uno con su carita, su hora, su
// texto, su foto, su «💡 Idea», el ♥ y los comentarios con un nivel de respuestas); al lado, el aviso de la ronda, el
// debate abierto, las fotos del equipo y las ideas que salieron. Todo lo que parece botón lleva a algún lado: las
// caritas y los nombres a su ficha, las fotos al visor, «💡 Idea» a esa idea y «Ir al debate» a su post.
// Con foco, baja hasta ese post y lo hace brillar; vez cambia cada vez que se pide (así, pedir otra vez el mismo post lo
// vuelve a traer).

const FILTROS: [FiltroForo, string][] = [['todo', 'Todo'], ['debate', 'Debates'], ['foto', 'Fotos'], ['idea', 'Con ideas']]
const SIN_POSTS: Record<FiltroForo, string> = {
  todo: '',
  debate: 'Todavía no hay debates.',
  foto: 'Todavía no hay fotos en el foro.',
  idea: 'Todavía ningún post trae ideas.',
}
const MINIATURAS = 6

const CORAZON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

// Baja hasta algo de la página y lo hace brillar un momento; con enfocar, el foco del teclado queda ahí (sin mover nada
// más). Con menos movimiento solo baja: sin animación, su fin nunca llegaría y la clase se quedaría puesta.
export function traerYBrillar(el: HTMLElement, op: { block: ScrollLogicalPosition; enfocar?: boolean }) {
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: op.block })
  if (op.enfocar) el.focus({ preventScroll: true })
  if (quieto) return
  el.classList.remove('of-brilla')
  void el.offsetWidth // vuelve a arrancar la animación aunque ya estuviera brillando
  el.classList.add('of-brilla')
  // el fin de su animación (el de una de adentro también sube hasta aquí). Al volver a arrancarla, la de antes se
  // cancela con la nueva ya andando: esa cancelación no apaga nada (se apaga cuando termina la nueva). Si se cancela sin
  // otra andando (React le cambió la clase), se limpia.
  const fin = (e: AnimationEvent) => {
    if (e.target !== el || (e.type === 'animationcancel' && el.getAnimations().length > 0)) return
    el.classList.remove('of-brilla')
    el.removeEventListener('animationend', fin)
    el.removeEventListener('animationcancel', fin)
  }
  el.addEventListener('animationend', fin)
  el.addEventListener('animationcancel', fin)
}

type Comun = {
  agentes: AgenteSnap[]
  retratos: Record<string, string>
  ahora: Date
  ideas: ReadonlySet<string> // las ideas que ya se ven: solo esas llevan «💡 Idea»
  abrirFicha(id: string): void
  irIdea(id: string): void
}

export function Foro(p: {
  social: Social
  agentes: AgenteSnap[]
  retratos: Record<string, string>
  ahora: Date
  foco: string | null
  vez: number
  abrirFicha(id: string): void
  abrirFoto(f: Foto): void
  irIdea(id: string): void
  irIdeas(): void
  irPost(id: string): void
  meGusta(id: string, si: boolean): void
}) {
  const caja = useRef<HTMLDivElement>(null)
  const [filtro, setFiltro] = useState<FiltroForo>('todo')
  const { foro, fotos } = p.social

  // Cada vez que se pide ver un post: si el filtro lo esconde, vuelve a «Todo» (antes de dibujar)
  const [vezVista, setVezVista] = useState(p.vez)
  if (vezVista !== p.vez) {
    setVezVista(p.vez)
    if (p.foco && !filtrarForo(foro, filtro).some((x) => x.id === p.foco)) setFiltro('todo')
  }
  useEffect(() => {
    if (!p.foco) return
    const el = caja.current?.querySelector<HTMLElement>(`[data-of-foco="${CSS.escape(p.foco)}"]`)
    if (el) traerYBrillar(el, { block: 'start', enfocar: true })
  }, [p.foco, p.vez])

  const comun: Comun = {
    agentes: p.agentes,
    retratos: p.retratos,
    ahora: p.ahora,
    ideas: new Set(p.social.ideas.map((i) => i.id)),
    abrirFicha: p.abrirFicha,
    irIdea: p.irIdea,
  }
  const lista = filtrarForo(foro, filtro)

  return (
    <div className="of-v-foro" ref={caja}>
      <div className="of-feed">
        {foro.length > 0 && (
          <div className="of-filtros" role="group" aria-label="Qué posts ver">
            {FILTROS.map(([f, texto]) => (
              <button key={f} type="button" className="of-filtro" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
                {texto}
              </button>
            ))}
          </div>
        )}
        {!foro.length ? (
          <p className="of-foro-vacio">Todavía no hay nada en el foro. La primera tertulia es a las 12:30 p. m.</p>
        ) : lista.length ? (
          lista.map((post) => (
            <Publicacion
              key={post.id}
              post={post}
              foto={post.foto_id ? fotos.find((f) => f.id === post.foto_id) ?? null : null}
              c={comun}
              abrirFoto={p.abrirFoto}
              meGusta={p.meGusta}
            />
          ))
        ) : (
          <p className="of-foro-vacio">{SIN_POSTS[filtro]}</p>
        )}
      </div>
      <AlLado {...p} />
    </div>
  )
}

function Publicacion(p: { post: Post; foto: Foto | null; c: Comun; abrirFoto(f: Foto): void; meGusta(id: string, si: boolean): void }) {
  const { post, c } = p
  const idTitulo = useId()
  const autor = c.agentes.find((a) => a.id === post.de)
  const abrir = autor ? () => c.abrirFicha(post.de) : undefined
  const likes = post.likes + (post.te_gusta ? 1 : 0)
  const n = post.comentarios.length
  return (
    <article className="of-post" data-of-foco={post.id} tabIndex={-1} aria-labelledby={idTitulo}>
      <div className="of-post-cab">
        <Cara agente={autor} url={c.retratos[post.de]} px={48} alTocar={abrir} />
        {abrir && autor ? (
          <button type="button" className="of-post-quien" data-of-ficha onClick={abrir}>
            <b>{autor.nombre}</b>
            <span>{autor.oficio}</span>
          </button>
        ) : (
          <span className="of-post-quien">
            <b>{nombreDe(post.de, c.agentes)}</b>
          </span>
        )}
        <span className="of-post-h">
          {cuandoCorto(new Date(post.mostrar_desde), c.ahora)}
          {post.tipo === 'debate' && <span className="of-etq">Debate</span>}
        </span>
      </div>
      <h3 className="of-post-tit" id={idTitulo}>
        {post.titulo}
      </h3>
      <p className="of-post-tx">
        {post.texto}
        <ChipIdea id={post.idea_id} c={c} />
      </p>
      {p.foto && <FotoPost foto={p.foto} titulo={post.titulo} abrirFoto={p.abrirFoto} />}
      <div className="of-post-acc">
        <button
          type="button"
          className="of-like"
          aria-pressed={post.te_gusta}
          aria-label={`Me gusta (${likes})`}
          onClick={() => p.meGusta(post.id, !post.te_gusta)}
        >
          {CORAZON}
          <span>{likes}</span>
        </button>
        <span className="of-cuantos">{n === 0 ? 'Sin comentarios' : n === 1 ? '1 comentario' : `${n} comentarios`}</span>
      </div>
      {n > 0 && (
        <ol className="of-hilo">
          {post.comentarios.map((k) => (
            <Comento key={k.id} k={k} c={c} />
          ))}
        </ol>
      )}
    </article>
  )
}

// «💡 Idea» lleva a esa idea en la pestaña Ideas (solo si ya se ve allá)
function ChipIdea({ id, c }: { id: string | null; c: Comun }) {
  if (!id || !c.ideas.has(id)) return null
  return (
    <>
      {' '}
      <button type="button" className="of-chip-idea" onClick={() => c.irIdea(id)}>
        💡 Idea
      </button>
    </>
  )
}

// La foto del post: se toca y se ve en grande. Si el enlace firmado ya no sirve, un aviso que no es botón.
function FotoPost({ foto, titulo, abrirFoto }: { foto: Foto; titulo: string; abrirFoto(f: Foto): void }) {
  const [rota, setRota] = useState<string | null>(null)
  if (rota === foto.url) return <div className="of-post-foto of-rota">No se pudo cargar la foto. Vuelve a intentarlo en un rato.</div>
  return (
    <button type="button" className="of-post-foto" onClick={() => abrirFoto(foto)} aria-label={`Ver en grande: ${foto.pie?.trim() || titulo}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado del bucket privado, de 1 hora */}
      <img src={foto.url} alt="" draggable={false} loading="lazy" onError={() => setRota(foto.url)} />
      <span className="of-foto-lupa" aria-hidden="true">
        <Icono tipo="grande" />
      </span>
    </button>
  )
}

function Comento({ k, c }: { k: Comentario; c: Comun }) {
  const ag = c.agentes.find((a) => a.id === k.de)
  const abrir = ag ? () => c.abrirFicha(k.de) : undefined
  return (
    <li className={`of-com${k.en_respuesta_a ? ' of-resp' : ''}`}>
      <Cara agente={ag} url={c.retratos[k.de]} px={24} alTocar={abrir} />
      <div className="of-com-cuerpo">
        <p className="of-com-cab">
          {abrir && ag ? (
            <button type="button" data-of-ficha onClick={abrir}>
              {ag.nombre}
            </button>
          ) : (
            <b>{nombreDe(k.de, c.agentes)}</b>
          )}
          {ag && ` · ${ag.oficio}`} · {momentoCR(new Date(k.mostrar_desde), c.ahora)}
        </p>
        <p className="of-com-tx">
          {k.texto}
          <ChipIdea id={k.idea_id} c={c} />
        </p>
      </div>
    </li>
  )
}

// Al lado del foro: el aviso de la ronda, el debate abierto, las fotos del equipo y las ideas que salieron
function AlLado(p: Parameters<typeof Foro>[0]) {
  const { foro, fotos, ideas, ronda } = p.social
  const aviso = avisoRonda(ronda, fechaCR(p.ahora))
  const debate = debateAbierto(foro, p.ahora)
  const minis = fotosDelEquipo(fotos, foro, p.agentes.map((a) => a.id), MINIATURAS)
  const faltan = p.agentes.filter((a) => !p.retratos[a.id]).length
  const nuevas = contarIdeas(ideas).nueva
  const nombre = (id: string) => nombreDe(id, p.agentes)

  return (
    <aside className="of-lado-foro" aria-label="Al lado del foro">
      {aviso && ronda && (
        <section className={`of-caja of-ronda of-ronda-${ronda.resultado}`} aria-label="La tertulia de hoy">
          <span className="of-dot" aria-hidden="true" />
          <p>{aviso}</p>
        </section>
      )}

      {debate && (
        <section className="of-caja" aria-label="Debate abierto">
          <div className="of-caja-h">
            <h2>Debate abierto</h2>
          </div>
          <p className="of-deb-tit">{debate.titulo}</p>
          <p className="of-vacio of-deb-sub">
            {debate.comentarios.length === 0
              ? 'Todavía nadie responde.'
              : `${debate.comentarios.length === 1 ? '1 respuesta' : `${debate.comentarios.length} respuestas`} · ${listaDeNombres(
                  quienesComentan(debate).map(nombre),
                )}`}
          </p>
          <button type="button" className="of-btn of-pri" onClick={() => p.irPost(debate.id)}>
            Ir al debate
          </button>
        </section>
      )}

      <section className="of-caja" aria-label="Fotos del equipo">
        <div className="of-caja-h">
          <h2>Fotos del equipo</h2>
        </div>
        {minis.length > 0 && (
          <ul className="of-mini-fotos">
            {minis.map((f) => {
              const etiqueta = f.tipo === 'retrato' ? nombre(f.agentes[0] ?? '') : f.pie?.trim() || 'Foto del equipo'
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
        )}
        {faltan > 0 && (
          <p className="of-vacio of-fotos-nota">
            {faltan < p.agentes.length
              ? faltan === 1
                ? 'Falta 1 foto: viene pronto.'
                : `Las fotos de los otros ${faltan} vienen pronto.`
              : minis.length
                ? 'Las fotos de cada uno vienen pronto.'
                : 'Las fotos del equipo vienen pronto.'}
          </p>
        )}
      </section>

      {ideas.length > 0 && (
        <section className="of-caja" aria-label="Salieron del foro">
          <div className="of-caja-h">
            <h2>Salieron del foro</h2>
          </div>
          <p className="of-salieron">
            {nuevas === 0
              ? 'Ya respondiste todas las ideas.'
              : nuevas === 1
                ? '1 idea nueva espera tu respuesta.'
                : `${nuevas} ideas nuevas esperan tu respuesta.`}
          </p>
          <button type="button" className="of-btn" onClick={p.irIdeas}>
            Ver ideas
          </button>
        </section>
      )}
    </aside>
  )
}
