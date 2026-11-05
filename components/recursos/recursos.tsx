import Image from 'next/image'
import { FinalCta } from '@/components/home/final-cta'
import { formatNewsDate } from '@/components/news/format'
import { SECCIONES, rutaDeSeccion, type Recurso, type Seccion } from '@/lib/recursos/lista'
import { RECURSOS as T } from './textos'
import '../news/news.css'
import './recursos.css'

type Props = {
  seccion: Seccion
  items: Recurso[]
  cuantos: Record<Seccion, number>
  pagina: number
  hayMas: boolean
}

// /es/recursos: arriba las tres pestañas (son enlaces: funcionan sin JavaScript y cada una tiene su
// dirección), abajo las tarjetas de la que está abierta, lo más nuevo primero.
export function Recursos({ seccion, items, cuantos, pagina, hayMas }: Props) {
  const base = rutaDeSeccion(seccion)
  const s = T.secciones[seccion]

  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="rc-titulo">
        <div className="hm-wrap">
          <p className="hm-eyebrow">{T.eyebrow}</p>
          <h1 id="rc-titulo" className="hm-page-title">
            <span className="hm-hero__l1">{T.tituloLigero}</span> <span className="hm-hero__l2">{T.tituloFuerte}</span>
          </h1>
          <p className="hm-lead">{T.lead}</p>

          <nav className="rc-tabs" aria-label={T.pestanas}>
            {SECCIONES.map((k) => (
              <a
                key={k}
                href={rutaDeSeccion(k)}
                className={k === seccion ? 'rc-tab rc-tab--activa' : 'rc-tab hm-glass'}
                aria-current={k === seccion ? 'page' : undefined}
              >
                <span>{T.secciones[k].nombre}</span>
                <span className="rc-tab__n">{cuantos[k]}</span>
              </a>
            ))}
          </nav>
          <p className="rc-bajada">{s.bajada}</p>
        </div>
      </section>

      <section className="hm-section hm-section--tight" aria-label={s.nombre}>
        <div className="hm-wrap">
          {items.length === 0 ? (
            <div className="rc-vacio hm-glass">
              <p>{s.vacio}</p>
              {seccion !== 'guias' && cuantos.guias > 0 && (
                <a href={rutaDeSeccion('guias')} className="hm-btn hm-btn--solid">
                  {T.verGuias}
                </a>
              )}
            </div>
          ) : (
            <ul className="nw-grid">
              {items.map((r, i) => (
                <li key={r.clave}>
                  <a href={r.href} className="nw-card hm-glass">
                    {r.imagen ? (
                      <Image
                        src={r.imagen}
                        alt=""
                        width={1600}
                        height={900}
                        sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw"
                        priority={pagina === 1 && i < 3}
                      />
                    ) : (
                      <span className="rc-sin-foto" aria-hidden />
                    )}
                    <span className="nw-card__text">
                      <span className="nw-card__meta">
                        <span className="nw-tag">{r.etiqueta}</span>
                        <time className="nw-date" dateTime={r.fecha}>
                          {formatNewsDate(r.fecha, 'es')}
                        </time>
                      </span>
                      <h2 className="nw-card__title">{r.titulo}</h2>
                      <span className="nw-card__lead">{r.resumen}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {(pagina > 1 || hayMas) && (
            <nav className="nw-pager" aria-label={s.nombre}>
              {pagina > 1 ? <a href={pagina === 2 ? base : `${base}?p=${pagina - 1}`}>{T.mas}</a> : <span />}
              {hayMas && <a href={`${base}?p=${pagina + 1}`}>{T.anteriores}</a>}
            </nav>
          )}
        </div>
      </section>

      <FinalCta locale="es" />
    </main>
  )
}
