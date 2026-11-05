import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { FormularioEliminar } from '@/components/eliminar-datos/formulario'
import { leerCodigo } from '@/lib/eliminar-datos/solicitud'
import { estadoDeSolicitud, type Estado } from '@/lib/eliminar-datos/servidor'
import { SITE_URL } from '@/lib/seo'
import { ELIMINAR } from './content'
import '@/components/home/legal.css'
import '@/components/eliminar-datos/eliminar-datos.css'

// Eliminación de datos: la dirección que tiene Meta para la app (instrucciones y formulario). Los avisos
// automáticos de Meta (POST) los recibe /api/meta/eliminar-datos. Con ?codigo= muestra cómo va una solicitud.

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ codigo?: string | string[] }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return {
    title: ELIMINAR[locale].titulo,
    alternates: {
      canonical: `${SITE_URL}/${locale}/eliminar-datos`,
      languages: { es: `${SITE_URL}/es/eliminar-datos`, en: `${SITE_URL}/en/eliminar-datos` },
    },
  }
}

const fecha = (iso: string, locale: 'es' | 'en') =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CR', { dateStyle: 'long', timeZone: 'America/Costa_Rica' }).format(new Date(iso))

async function buscar(codigo: string | null): Promise<Estado | null | 'error'> {
  if (!codigo) return null
  try {
    return await estadoDeSolicitud(codigo)
  } catch (err) {
    console.error('[eliminar-datos] no se pudo consultar el estado', err)
    return 'error'
  }
}

export default async function EliminarDatosPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  const t = ELIMINAR[locale]
  const crudo = (await searchParams).codigo
  const pedido = typeof crudo === 'string' ? crudo : undefined
  const codigo = leerCodigo(pedido)
  const encontrado = await buscar(codigo)

  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="ed-title">
        <div className="hm-wrap">
          <h1 id="ed-title" className="hm-page-title lg-title">
            {t.titulo}
          </h1>
          <p className="hm-lead">{t.actualizado}</p>
        </div>
      </section>

      <section className="hm-section lg" aria-label={t.titulo}>
        <div className="hm-wrap lg__wrap">
          <article className="lg-doc">
            <p>{t.intro}</p>
            {t.secciones.map((s) => (
              <section key={s.titulo}>
                <h2>{s.titulo}</h2>
                {s.parrafos.map((p, i) =>
                  typeof p === 'string' ? (
                    <p key={i}>{p}</p>
                  ) : (
                    <ul key={i}>
                      {p.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
            <p className="ed-privacidad">
              {t.privacidad.antes}
              <a href={`/${locale}/privacidad`}>{t.privacidad.enlace}</a>
              {t.privacidad.despues}
            </p>
          </article>

          <section className="ed-bloque hm-glass" aria-labelledby="ed-form-title">
            <h2 id="ed-form-title">{t.formulario.titulo}</h2>
            <p className="ed-bloque__ayuda">{t.formulario.ayuda}</p>
            <FormularioEliminar locale={locale} t={t.formulario} />
          </section>

          <section id="estado" className="ed-bloque hm-glass" aria-labelledby="ed-estado-title">
            <h2 id="ed-estado-title">{t.estado.titulo}</h2>
            <p className="ed-bloque__ayuda">{t.estado.ayuda}</p>
            {pedido !== undefined && (
              <p className="ed-resultado" role="status">
                {encontrado === 'error'
                  ? t.formulario.errorGeneral
                  : encontrado
                    ? encontrado.estado === 'completada'
                      ? t.estado.completada(fecha(encontrado.completada_en ?? encontrado.creada_en, locale))
                      : t.estado.recibida(fecha(encontrado.creada_en, locale))
                    : t.estado.noExiste}
              </p>
            )}
            <form method="get" action={`/${locale}/eliminar-datos#estado`} className="ed-consulta">
              <label htmlFor="ed-codigo" className="ed-campo__etiqueta">
                {t.estado.campo}
              </label>
              <div className="ed-consulta__fila">
                <input
                  id="ed-codigo"
                  name="codigo"
                  className="ed-input"
                  placeholder="BR-ABCD2345"
                  defaultValue={codigo ?? pedido ?? ''}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={20}
                />
                <button type="submit" className="hm-btn hm-btn--glass hm-glass">
                  {t.estado.consultar}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}
