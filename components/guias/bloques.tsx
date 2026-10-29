import { trozos, type Visible } from '@/lib/guias/contenido'
import { Copiar } from './copiar'

// Los bloques de una guía. El texto solo trae negrita, código y enlaces https (lib/guias/contenido.ts)

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

export function Bloques({ bloques }: { bloques: Visible[] }) {
  return (
    <>
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case 'subtitulo':
            return <h2 key={i}>{b.texto}</h2>
          case 'parrafo':
            return (
              <p key={i}>
                <Linea texto={b.texto} />
              </p>
            )
          case 'nota':
            return (
              <aside key={i} className="gu-nota hm-glass">
                <p>
                  <Linea texto={b.texto} />
                </p>
              </aside>
            )
          case 'lista':
            return (
              <ul key={i} className="gu-lista">
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Linea texto={item} />
                  </li>
                ))}
              </ul>
            )
          case 'paso':
            return (
              <div key={i} className="gu-paso">
                <span className="gu-paso__n" aria-hidden="true">
                  {b.numero}
                </span>
                <div>
                  <h3>
                    <span className="gu-oculto">Paso {b.numero}: </span>
                    {b.titulo}
                  </h3>
                  {b.texto && (
                    <p>
                      <Linea texto={b.texto} />
                    </p>
                  )}
                </div>
              </div>
            )
          case 'codigo':
            return (
              <div key={i} className="gu-codigo">
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
              <p key={i}>
                <a className="gu-enlace hm-btn hm-btn--glass hm-glass" href={b.url} target="_blank" rel="noopener">
                  {b.texto} ↗
                </a>
              </p>
            )
        }
      })}
    </>
  )
}
