import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { codigoValido, invitacionVigente, type Fallo } from '@/lib/meta/conectar'
import { buscarInvitacion, cuentasDeInvitacion, type CuentaConectada } from '@/lib/meta/conectar-servidor'
import { CONECTAR } from './content'
import '@/components/home/legal.css'
import '@/components/conectar/conectar.css'

// «Conectar cuentas»: la página del enlace de cada cliente. El código del enlace es lo único que da acceso,
// así que queda fuera de los buscadores y de la analítica (lib/host-routing.ts).

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Conectar cuentas', robots: { index: false, follow: false } }

type Props = {
  params: Promise<{ locale: string; codigo: string }>
  searchParams: Promise<{ listo?: string | string[]; error?: string | string[] }>
}

const FALLOS: Fallo[] = ['cancelado', 'sin_cuentas', 'fallo']

async function cargar(codigo: string): Promise<{ cliente: string; cuentas: CuentaConectada[] } | null | 'error'> {
  if (!codigoValido(codigo)) return null
  try {
    const invitacion = await buscarInvitacion(codigo)
    if (!invitacion || !invitacionVigente(invitacion.expira_en, Date.now())) return null
    return { cliente: invitacion.cliente, cuentas: await cuentasDeInvitacion(codigo) }
  } catch (e) {
    console.error('[conectar] no se pudo cargar la invitación', e instanceof Error ? e.message : e)
    return 'error'
  }
}

export default async function ConectarPage({ params, searchParams }: Props) {
  const { locale: crudo, codigo } = await params
  const locale = crudo === 'en' ? 'en' : 'es'
  setRequestLocale(locale)
  const t = CONECTAR[locale]
  const q = await searchParams
  const datos = await cargar(codigo)

  if (datos === null || datos === 'error') {
    const texto = datos === 'error' ? { titulo: t.titulo, texto: t.fallos.fallo } : t.vencido
    return (
      <main>
        <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="cx-title">
          <div className="hm-wrap">
            <h1 id="cx-title" className="hm-page-title lg-title">{texto.titulo}</h1>
            <p className="hm-lead">{texto.texto}</p>
          </div>
        </section>
      </main>
    )
  }

  const fallo = FALLOS.find((f) => f === q.error)
  const iniciar = `/api/meta/conectar/iniciar?codigo=${encodeURIComponent(codigo)}&idioma=${locale}`

  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="cx-title">
        <div className="hm-wrap">
          <h1 id="cx-title" className="hm-page-title lg-title">{t.titulo}</h1>
          <p className="hm-lead">{t.paraCliente(datos.cliente)}</p>
        </div>
      </section>

      <section className="hm-section lg" aria-label={t.titulo}>
        <div className="hm-wrap lg__wrap">
          <article className="lg-doc">
            {q.listo === '1' && datos.cuentas.length > 0 && <p className="cx-aviso cx-aviso--bien" role="status">{t.listo}</p>}
            {fallo && <p className="cx-aviso cx-aviso--mal" role="alert">{t.fallos[fallo]}</p>}

            {datos.cuentas.length > 0 && (
              <section>
                <h2>{t.conectadas}</h2>
                <ul>
                  {datos.cuentas.map((c) => (
                    <li key={c.pagina_id}>
                      {c.pagina_nombre}
                      {' · '}
                      {c.instagram_usuario ? `@${c.instagram_usuario}` : t.sinInstagram}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2>{t.queHace.titulo}</h2>
              <ul>
                {t.queHace.lista.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section>
              <h2>{t.queNoHace.titulo}</h2>
              <p>{t.queNoHace.texto}</p>
            </section>

            <div className="cx-accion">
              <a className="hm-btn hm-btn--solid" href={iniciar}>{datos.cuentas.length > 0 ? t.otraCuenta : t.boton}</a>
              <p className="cx-ayuda">{t.ayuda}</p>
            </div>

            <p className="cx-legal">
              {t.legal.antes} <a href={`/${locale}/privacidad`}>{t.legal.privacidad}</a>{t.legal.y}{' '}
              <a href={`/${locale}/terminos`}>{t.legal.terminos}</a> {locale === 'en' ? 'and' : 'y'}{' '}
              <a href={`/${locale}/eliminar-datos`}>{t.legal.eliminar}</a>.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
