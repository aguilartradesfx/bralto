import { getTranslations } from 'next-intl/server'
import { SectionHead, vars, type Locale } from './primitives'

type Layer = { title: string; body: string }

// Geometría del anillo (viewBox 1180 × 640): el sitio al centro y las 6 capas sobre una
// elipse ancha (aprovecha el ancho de pantalla y entra completa en alto), en sentido
// horario desde arriba a la izquierda. Optimizar vuelve a Atraer.
const CX = 590
const CY = 320
const RX = 440
const RY = 250
const HUB_R = 105
const ANGLES = [-120, -60, 0, 60, 120, 180]

const round = (n: number) => Math.round(n * 100) / 100
const pointAt = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)]
}

// En una elipse el arco no es proporcional al ángulo: se mide para que cada capa se
// encienda justo cuando el punto pasa por ella
function arcLength(fromDeg: number, toDeg: number, steps = 720): number {
  let [px, py] = pointAt(fromDeg)
  let total = 0
  for (let i = 1; i <= steps; i++) {
    const [x, y] = pointAt(fromDeg + ((toDeg - fromDeg) * i) / steps)
    total += Math.hypot(x - px, y - py)
    px = x
    py = y
  }
  return total
}
const PERIMETER = arcLength(-120, 240)
const FRACTIONS = ANGLES.map((deg) => round(arcLength(-120, deg) / PERIMETER))

const [SX, SY] = pointAt(-120).map(round)
const [OX, OY] = pointAt(60).map(round)
// Empieza en la capa 01 y da la vuelta completa
const RING = `M ${SX} ${SY} A ${RX} ${RY} 0 1 1 ${OX} ${OY} A ${RX} ${RY} 0 1 1 ${SX} ${SY}`

export async function Circuit({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.system' })
  const layers = t.raw('layers') as Layer[]

  return (
    <section id="como-funciona" className="hm-section hm-section--stage" aria-labelledby="hm-system-title">
      <div className="hm-wrap">
        <SectionHead compact center id="hm-system-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />

        <div className="hm-circuit">
          <svg className="hm-circuit__svg" viewBox="0 0 1180 640" aria-hidden="true" focusable="false">
            {ANGLES.map((deg) => {
              const [ax, ay] = pointAt(deg)
              const d = Math.hypot(ax - CX, ay - CY)
              const k = (HUB_R + 10) / d
              return (
                <line
                  key={deg}
                  className="hm-ring__spoke"
                  x1={round(CX + (ax - CX) * k)}
                  y1={round(CY + (ay - CY) * k)}
                  x2={round(ax)}
                  y2={round(ay)}
                />
              )
            })}
            <ellipse className="hm-ring" cx={CX} cy={CY} rx={RX} ry={RY} />
            <path className="hm-ring__trail" d={RING} pathLength={1} />
            <path className="hm-ring__dot" d={RING} pathLength={1} />
          </svg>

          <div className="hm-hub hm-glass hm-glass--thick">
            <span className="hm-hub__label">{t('hubLabel')}</span>
            <span className="hm-hub__title">{t('hubTitle')}</span>
          </div>

          <ol className="hm-circuit__layers">
            {layers.map((layer, k) => {
              const [x, y] = pointAt(ANGLES[k]).map(round)
              return (
                <li key={layer.title} className="hm-layer hm-glass hm-rv" style={vars({ x, y, f: FRACTIONS[k] })}>
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
