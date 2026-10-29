import Image from 'next/image'
import { FinalCta } from '@/components/home/final-cta'
import type { Guia, Visible } from '@/lib/guias/contenido'
import authorPhoto from '../../app/[locale]/sobre-nosotros/alejandro-aguilar.webp'
import { Bloques } from './bloques'
import { Candado } from './candado'
import { IrAGuia } from './ir-a-guia'
import '../news/news.css'
import './guias.css'

type Props = {
  guia: Omit<Guia, 'abierto' | 'bloqueado'> // los bloques llegan ya filtrados en `visibles`
  visibles: { abierto: Visible[]; bloqueado: Visible[] }
  conAcceso: boolean
  recienAbierta: boolean
  origen?: string
}

// Una guía: firmada por Alejandro, lo abierto primero y después el candado o el resto.
// Cierra con la invitación de siempre del sitio (el diagnóstico).
export function GuiaArticulo({ guia, visibles, conAcceso, recienAbierta, origen }: Props) {
  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="gu-titulo">
        <div className="hm-wrap nw-head">
          <p className="hm-eyebrow">{guia.etiqueta}</p>
          <h1 id="gu-titulo" className="nw-title">
            {guia.titulo}
          </h1>
          <p className="hm-lead">{guia.resumen}</p>
          <div className="nw-byline">
            <Image src={authorPhoto} alt="" width={44} height={44} className="nw-byline__photo" />
            <span>
              <a href="/es/sobre-nosotros" className="nw-byline__name">
                Alejandro Aguilar
              </a>
              <span className="nw-byline__meta">CEO Bralto</span>
            </span>
          </div>
        </div>
      </section>

      <section className="hm-section hm-section--tight nw-main">
        <div className="hm-wrap">
          <article className="nw-body gu-cuerpo">
            <Bloques bloques={visibles.abierto} />
            {conAcceso ? (
              <div id="guia" className="gu-completa">
                {recienAbierta && <IrAGuia />}
                <p className="gu-sello">Guía completa</p>
                <Bloques bloques={visibles.bloqueado} />
              </div>
            ) : (
              <Candado slug={guia.slug} incluye={guia.incluye} origen={origen} />
            )}
          </article>

          {guia.fuenteUrl && (
            <aside className="nw-source hm-glass" aria-label="Fuente">
              <span className="hm-eyebrow">Fuente</span>
              <a href={guia.fuenteUrl} target="_blank" rel="noopener">
                {guia.fuenteNombre ?? guia.fuenteUrl}
              </a>
            </aside>
          )}
        </div>
      </section>

      <FinalCta locale="es" />
    </main>
  )
}
