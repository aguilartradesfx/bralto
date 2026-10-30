import Image from 'next/image'
import { agrupar, idSeccion, trozos, type Visible } from '@/lib/guias/contenido'
import { Copiar } from './copiar'

// Los bloques de una guía. Cada paso es una tarjeta con lo que le sigue (texto, comandos) y, si
// trae imagen, la imagen al lado en pantallas anchas. El texto solo trae negrita, código y enlaces https.

function Linea({ texto }: { texto: string }) {
  return (
    <>
      {trozos(texto).map((t, i) =>
        t.t === 'negrita' ? (
          <strong key={i}>{t.v}</strong>
        ) : t.t === 'codigo' ? (
          <code key={i}>{t.v}</code>
        ) : t.t === 'enlace' ? (
          <a key={i} href={t.url} target="_blank" rel="noopener">
            {t.v}
          </a>
        ) : (
          <span key={i}>{t.v}</span>
        ),
      )}
    </>
  )
}

function Bloque({ b }: { b: Visible }) {
  switch (b.tipo) {
    case 'subtitulo':
      return (
        <h2 id={idSeccion(b.texto)} className="gu-seccion">
          {b.texto}
        </h2>
      )
    case 'parrafo':
      return (
        <p>
          <Linea texto={b.texto} />
        </p>
      )
    case 'nota':
      return (
        <aside className="gu-nota gu-tarjeta">
          <p>
            <Linea texto={b.texto} />
          </p>
        </aside>
      )
    case 'lista':
      return (
        <ul className="gu-lista">
          {b.items.map((item, j) => (
            <li key={j}>
              <Linea texto={item} />
            </li>
          ))}
        </ul>
      )
    case 'codigo':
      return (
        <div className="gu-codigo">
          <div className="gu-codigo__barra">
            <span>{b.etiqueta ?? 'Terminal'}</span>
            <Copiar texto={b.codigo} />
          </div>
          <pre>
            <code>{b.codigo}</code>
          </pre>
        </div>
      )
    case 'enlace':
      return (
        <p>
          <a className="gu-enlace hm-btn hm-btn--solid" href={b.url} target="_blank" rel="noopener">
            {b.texto} ↗
          </a>
        </p>
      )
    case 'imagen':
      return (
        <figure className="gu-imagen">
          <Image src={b.src} alt={b.alt} width={b.ancho} height={b.alto} sizes="(min-width: 960px) 380px, 100vw" />
          {b.pie && <figcaption>{b.pie}</figcaption>}
        </figure>
      )
    case 'paso':
      return null // los pasos los arma Bloques como tarjeta
  }
}

export function Bloques({ bloques }: { bloques: Visible[] }) {
  return (
    <>
      {agrupar(bloques).map((g, i) => {
        if (g.tipo === 'bloque') return <Bloque key={i} b={g.bloque} />
        const p = g.paso
        if (p.tipo !== 'paso') return null
        return (
          <section key={i} className={`gu-paso gu-tarjeta${g.imagenes.length ? ' gu-paso--con-imagen' : ''}`}>
            <div className="gu-paso__texto">
              <div className="gu-paso__cabeza">
                <span className="gu-paso__n" aria-hidden="true">
                  {p.numero}
                </span>
                <h3>
                  <span className="gu-oculto">Paso {p.numero}: </span>
                  {p.titulo}
                </h3>
              </div>
              {p.texto && (
                <p>
                  <Linea texto={p.texto} />
                </p>
              )}
              {g.cuerpo.map((b, j) => (
                <Bloque key={j} b={b} />
              ))}
            </div>
            {g.imagenes.length > 0 && (
              <div className="gu-paso__imagenes">
                {g.imagenes.map((b, j) => (
                  <Bloque key={j} b={b} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
