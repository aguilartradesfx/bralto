import Image from 'next/image'
import { FinalCta } from '@/components/home/final-cta'
import type { Guia, Visible } from '@/lib/guias/contenido'
import authorPhoto from '../../app/[locale]/sobre-nosotros/alejandro-aguilar.webp'
import { Bloques } from './bloques'
import { Candado } from './candado'
import { FondoQuieto } from './fondo-quieto'
import { IrAGuia } from './ir-a-guia'
import { IrDirecto } from './ir-directo'
import { TAMANOS_PORTADA } from './portada'
import '../news/news.css'
import './guias.css'

type Props = {
  guia: Omit<Guia, 'abierto' | 'bloqueado'> // los bloques llegan ya filtrados en `visibles`
  visibles: { abierto: Visible[]; bloqueado: Visible[] }
  secciones: { id: string; texto: string }[]
  conAcceso: boolean
  recienAbierta: boolean
  origen?: string
}

// Una guía en una sola columna centrada: arriba el título centrado y la foto del post a lo ancho;
// después unas líneas abiertas que se difuminan hasta el «Ver todo» (o, con acceso, la guía completa
// en tarjetas). Todo comparte el mismo ancho y los mismos bordes. Cierra con la invitación del sitio.
export function GuiaArticulo({ guia, visibles, secciones, conAcceso, recienAbierta, origen }: Props) {
  return (
    <main className="gu">
      <FondoQuieto />
      <section className="hm-hero hm-hero--page hm-hero--fit gu-cabeza" aria-labelledby="gu-titulo">
        <div className="hm-wrap gu-hero">
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
          {guia.imagenUrl && (
            <figure className="gu-hero__foto">
              <Image src={guia.imagenUrl} alt="" width={1080} height={1350} sizes={TAMANOS_PORTADA} priority />
            </figure>
          )}
        </div>
      </section>

      <section className="hm-section hm-section--tight gu-main">
        <div className="hm-wrap gu-col">
          {/* Cerrada, el texto empieza enseguida (en el teléfono el índice empujaba todo hacia abajo);
              lo que trae la guía se ve en la ventana del candado */}
          {conAcceso && secciones.length > 1 && <IrDirecto secciones={secciones} conAcceso={conAcceso} />}

          <article id="articulo" className="gu-cuerpo">
            <div className={conAcceso ? 'gu-abierto' : 'gu-abierto gu-abierto--cortado'}>
              <Bloques bloques={visibles.abierto} />
            </div>
            {conAcceso ? (
              <div id="guia" className="gu-completa">
                {recienAbierta && <IrAGuia />}
                <p className="gu-sello">Guía completa</p>
                <Bloques bloques={visibles.bloqueado} />
              </div>
            ) : (
              <Candado slug={guia.slug} titulo={guia.titulo} incluye={guia.incluye} imagen={guia.imagenUrl} origen={origen} />
            )}
          </article>

          {conAcceso && guia.fuenteUrl && (
            <aside className="nw-source gu-fuente gu-tarjeta" aria-label="Fuente">
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
