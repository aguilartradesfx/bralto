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
  pais?: string | null // el país que detecta Vercel por la IP: el selector del WhatsApp arranca en él
}

// Una guía. Si pide datos (contenido descargable) y la persona no se ha registrado, la página es solo
// el cuadro del registro, sin adelanto del texto (pedido de Alejandro: «si les interesa, que dejen sus
// datos; si no, ni modo»). Si no, la guía entera en una sola columna centrada: arriba el título y la
// foto del post, después el texto con los pasos en tarjetas. Cierra con la invitación del sitio.
export function GuiaArticulo({ guia, visibles, secciones, conAcceso, recienAbierta, origen, pais }: Props) {
  if (!conAcceso) {
    return (
      <main className="gu">
        <FondoQuieto />
        <Candado
          slug={guia.slug}
          titulo={guia.titulo}
          incluye={guia.incluye}
          imagen={guia.imagenUrl}
          boton={guia.boton}
          origen={origen}
          pais={pais}
        />
      </main>
    )
  }

  return (
    <main className="gu">
      <FondoQuieto />
      {recienAbierta && <IrAGuia />}
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
          {secciones.length > 1 && <IrDirecto secciones={secciones} />}

          <article id="articulo" className="gu-cuerpo">
            <div className="gu-abierto">
              <Bloques bloques={visibles.abierto} />
            </div>
            <div id="guia" className="gu-completa">
              {/* El sello marca dónde empieza lo que se abrió con el registro; sin registro no hace falta */}
              {guia.pideDatos && <p className="gu-sello">Guía completa</p>}
              <Bloques bloques={visibles.bloqueado} />
            </div>
          </article>

          {guia.fuenteUrl && (
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
