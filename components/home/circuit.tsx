import { getTranslations } from 'next-intl/server'
import { SectionHead, vars, type Locale } from './primitives'

type Layer = { title: string; body: string }

// Geometría del anillo (viewBox 1100 × 760): el sitio al centro y las 6 capas sobre un
// círculo, en sentido horario desde arriba a la izquierda. Optimizar vuelve a Atraer.
const CX = 550
const CY = 380
const R = 300
const HUB_R = 118
const ANGLES = [-120, -60, 0, 60, 120, 180]
const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)].map((n) => Math.round(n * 100) / 100)
}
const [SX, SY] = point(-120, R)
const [OX, OY] = point(60, R)
// Empieza en la capa 01 y recorre el círculo completo: cada capa queda en k/6 del trazo
const RING = `M ${SX} ${SY} A ${R} ${R} 0 1 1 ${OX} ${OY} A ${R} ${R} 0 1 1 ${SX} ${SY}`

export async function Circuit({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.system' })
  const layers = t.raw('layers') as Layer[]

  return (
    <section id="como-funciona" className="hm-section" aria-labelledby="hm-system-title">
      <div className="hm-wrap">
        <SectionHead center id="hm-system-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />

        <div className="hm-circuit">
          <svg className="hm-circuit__svg" viewBox="0 0 1100 760" aria-hidden="true" focusable="false">
            {ANGLES.map((deg) => {
              const [x1, y1] = point(deg, HUB_R + 10)
              const [x2, y2] = point(deg, R)
              return <line key={deg} className="hm-ring__spoke" x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
            <circle className="hm-ring" cx={CX} cy={CY} r={R} />
            <path className="hm-ring__trail" d={RING} pathLength={1} />
            <path className="hm-ring__dot" d={RING} pathLength={1} />
          </svg>

          <div className="hm-hub hm-glass hm-glass--thick">
            <span className="hm-hub__label">{t('hubLabel')}</span>
            <span className="hm-hub__title">{t('hubTitle')}</span>
          </div>

          <ol className="hm-circuit__layers">
            {layers.map((layer, k) => {
              const [x, y] = point(ANGLES[k], R)
              return (
                <li key={layer.title} className="hm-layer hm-glass hm-rv" style={vars({ x, y, k })}>
                  <div className="hm-layer__top">
                    <span>{String(k + 1).padStart(2, '0')}</span>
                    <i className="hm-layer__led" aria-hidden="true" />
                  </div>
                  <h3>{layer.title}</h3>
                  <p>{layer.body}</p>
                </li>
              )
            })}
          </ol>
        </div>

        <p className="hm-closing hm-rv">
          {t('closingLight')} <span className="b">{t('closingBold')}</span>
        </p>
      </div>
    </section>
  )
}
