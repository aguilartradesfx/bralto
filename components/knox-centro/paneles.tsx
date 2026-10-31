'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  anchosEmbudo,
  barrasMejor,
  contraAyer,
  estadoItem,
  filaCaliente,
  fraseMejor,
  horaDecimal,
  listos,
  pieEsperando,
  suavizar,
  TRAMOS,
  visibles,
} from '@/lib/knox/centro/armar'
import { colones, compacto, diaCorto, diaYHora, entero, fechaCabecera, hace, hora, reloj, tituloDia } from '@/lib/knox/centro/formato'
import { etiquetaCorreo } from '@/lib/knox/centro/conexiones'
import { caben } from '@/lib/knox/centro/escena'
import type { Centro, Conexion, Dia, Embudo as DatosEmbudo, Esperando as DatosEsperando, Instagram as DatosInstagram, Mejor as DatosMejor, Pulso as DatosPulso } from '@/lib/knox/centro/tipos'
import type { CanalKnox } from '@/lib/knox/conversar/tipos'
import type { Vista } from '@/lib/knox/centro/vistas/tipos'
import { sumarDias } from '@/lib/calendario/fechas'
import { curvaSuave, f, NARANJA, P, svgRadar } from './geometria'

// Los paneles del Centro de mando, con los datos que llegan de /api/knox/centro. null: esa fuente no respondió («—»).

export type Panel = 'clientes' | 'esperando' | 'instagram' | 'mejor' | 'dia' | 'dolar'

const RAYA = '—'
const CANAL: Record<CanalKnox, string> = { instagram: 'Instagram', whatsapp: 'WhatsApp', messenger: 'Messenger' }

const Flecha = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

// Cabecera ---------------------------------------------------------------------------------------------------------

// fijo: la hora de la revisión visual (con datos de ejemplo)
function Reloj({ fijo }: { fijo: Date | null }) {
  const [ahora, setAhora] = useState<Date | null>(null)
  useEffect(() => {
    if (fijo) return
    setAhora(new Date())
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [fijo])
  const momento = fijo ?? ahora
  const r = momento ? reloj(momento) : null
  return (
    <div className="clock" aria-label="Hora de Costa Rica">
      {r ? r.hora : '--:--'}
      <span>{r ? r.segundos : ':--'}</span>
    </div>
  )
}

const PESTANAS: [Vista, string][] = [
  ['hoy', 'Hoy'],
  ['ventas', 'Ventas'],
  ['redes', 'Redes'],
  ['agenda', 'Agenda'],
  ['conexiones', 'Conexiones'],
]

// Las pestañas cambian de vista sin salir de /knox (el enlace sirve para abrirla directo)
export function Cabecera(p: {
  centro: Centro | null
  iniciales: string
  ahora: Date | null
  relojFijo: Date | null
  hablaDolar: boolean
  vista: Vista
  onVista: (v: Vista) => void
}) {
  const t = p.centro?.temperatura
  const usd = p.centro?.dolar
  return (
    <header className="glass top">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src="/logo-white.svg" alt="Bralto" />
      <div className="sep" />
      <span className="brand-k">KNOX</span>
      <span className="brand-s">Centro de mando</span>
      <nav className="nav" aria-label="Vistas">
        {PESTANAS.map(([v, nombre]) => (
          <a
            key={v}
            href={v === 'hoy' ? '/knox' : `/knox?vista=${v}`}
            className={p.vista === v ? 'on' : undefined}
            aria-current={p.vista === v ? 'page' : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return
              e.preventDefault()
              p.onVista(v)
            }}
          >
            {p.vista === v && <i className="dot" />}
            {nombre}
          </a>
        ))}
      </nav>
      <div className="tr">
        <div className="meta">
          San José · <b>{typeof t === 'number' ? `${Math.round(t)}°` : RAYA}</b>
          <br />
          {p.ahora ? fechaCabecera(p.ahora) : RAYA}
        </div>
        <div className={`fx${p.hablaDolar ? ' habla' : ''}`}>
          USD <b>{typeof usd === 'number' ? colones(usd) : RAYA}</b>
          <span className="up">venta</span>
        </div>
        <Reloj fijo={p.relojFijo} />
        <div className="av" aria-label="Tu cuenta">
          {p.iniciales}
          <i />
        </div>
      </div>
    </header>
  )
}

// 01 · Clientes nuevos ------------------------------------------------------------------------------------------------

const RADAR_FIJO = svgRadar()

export function Clientes({ datos, habla }: { datos: Centro['clientes']; habla: boolean }) {
  const comparado = datos ? contraAyer(datos.hoy, datos.ayer) : null
  const max = Math.max(1, ...(datos?.porCanal.map((c) => c.total) ?? [0]))
  const n = datos?.puntos.length ?? 0
  return (
    <div className={`glass hud panel${habla ? ' habla' : ''}`} style={{ flex: '280 1 0px' }}>
      <div className="ph">
        <span className="ix">01</span>
        <span className="pt">Clientes nuevos</span>
        <span className="tag">
          <i className="dot late" />
          En vivo
        </span>
      </div>
      <div className="radar-wrap">
        <div className="radar">
          <div className="barrido">
            <div className="sweep" />
            <i className="borde" />
          </div>
          <svg width="196" height="196" className="abs" style={{ inset: 0 }} aria-hidden>
            <g dangerouslySetInnerHTML={{ __html: RADAR_FIJO }} />
            {datos?.puntos.map((pt, i) => {
              const [x, y] = P(98, 98, pt.radio * 96, pt.angulo)
              if (i === n - 1) {
                return (
                  <g key={i}>
                    <circle cx={f(x)} cy={f(y)} r="14" fill="none" stroke={NARANJA} strokeOpacity=".25" />
                    <circle cx={f(x)} cy={f(y)} r="8.5" fill="none" stroke={NARANJA} strokeOpacity=".55" />
                    <circle cx={f(x)} cy={f(y)} r="3.6" fill={NARANJA} />
                    <circle cx={f(x)} cy={f(y)} r="3.6" fill={NARANJA} filter="url(#kc-rg)" />
                  </g>
                )
              }
              const o = 0.3 + (0.6 * (i + 1)) / n
              return (
                <g key={i}>
                  <circle cx={f(x)} cy={f(y)} r="2.6" fill="#fff" fillOpacity={o.toFixed(2)} />
                  <circle cx={f(x)} cy={f(y)} r="6" fill="#fff" fillOpacity={(o * 0.12).toFixed(3)} />
                </g>
              )
            })}
          </svg>
        </div>
        <div>
          <div className="big">{datos ? datos.hoy : RAYA}</div>
          <div className="big-l">{datos?.hoy === 1 ? 'persona nueva hoy' : 'personas nuevas hoy'}</div>
          {comparado && (
            <div className="delta">
              <svg className="ic" viewBox="0 0 24 24" aria-hidden>
                {comparado.sube === null ? (
                  <path d="M6 9h12M6 15h12" />
                ) : comparado.sube ? (
                  <>
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </>
                ) : (
                  <>
                    <path d="m19 12-7 7-7-7" />
                    <path d="M12 5v14" />
                  </>
                )}
              </svg>
              {comparado.texto}
            </div>
          )}
          <div className="src">
            {(datos?.porCanal ?? [
              { canal: 'Instagram', total: null },
              { canal: 'WhatsApp', total: null },
              { canal: 'Sitio web', total: null },
            ]).map((c) => (
              <div key={c.canal}>
                {c.canal}
                <u>
                  <i style={{ width: `${c.total ? Math.max(6, (c.total / max) * 100) : 0}%` }} />
                </u>
                <b>{c.total ?? RAYA}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 02 · Te están esperando ---------------------------------------------------------------------------------------------

// alto: el del panel (con más alto caben más conversaciones)
export function Esperando({ datos, ahora, habla, alto }: { datos: DatosEsperando | null; ahora: Date | null; habla: boolean; alto: number }) {
  const lista = datos ? datos.conversaciones.slice(0, caben.esperando(alto)) : []
  const caliente = filaCaliente(lista)
  return (
    <div className={`glass hud panel${habla ? ' habla' : ''}`} style={{ flex: '268 1 0px' }}>
      <div className="ph">
        <span className="ix">02</span>
        <span className="pt">Te están esperando</span>
        <span className="tag">{datos ? (datos.total ? `${datos.total} sin responder` : 'Al día') : RAYA}</span>
      </div>
      {!datos ? (
        <div className="lista-vacia vacio">{RAYA}</div>
      ) : datos.conversaciones.length === 0 ? (
        <div className="lista-vacia vacio">
          Nadie te está esperando.
          <br />
          ¡Vas al día!
        </div>
      ) : (
        lista.map((c, i) => (
          <a key={c.id} className={`msg${i === caliente ? ' hot' : ''}`} href={`/crm/mensajes/${c.id}`}>
            <div className="ini">{c.iniciales}</div>
            <div style={{ minWidth: 0 }}>
              <div className="mn">
                <span className="nom">{c.nombre}</span>
                <span className="ch">{CANAL[c.canal]}</span>
                {c.insignia && <span className="ch or">{c.insignia}</span>}
              </div>
              <div className="ms">{c.texto}</div>
            </div>
            <div className="mt">{c.en && ahora ? hace(c.en, ahora) : ''}</div>
          </a>
        ))
      )}
      <a className="mfoot" href="/crm/mensajes" style={{ marginTop: 'auto' }}>
        <span>{datos ? pieEsperando(datos.borradores.length, datos.total) : 'Abrir los mensajes'}</span>
        <Flecha />
      </a>
    </div>
  )
}

// 03 · Camino a la venta ----------------------------------------------------------------------------------------------

export function Embudo({ datos }: { datos: DatosEmbudo | null }) {
  const a = datos ? anchosEmbudo(datos) : { llegaron: 0, conversando: 0, propuesta: 0, ganados: 0 }
  const filas: [keyof DatosEmbudo, string][] = [
    ['llegaron', 'Llegaron'],
    ['conversando', 'Conversando'],
    ['propuesta', 'Propuesta'],
    ['ganados', 'Ganados'],
  ]
  return (
    <div className="glass hud panel" style={{ flex: '174 1 0px' }}>
      <div className="ph">
        <span className="ix">03</span>
        <span className="pt">
          Camino a la venta<small>Este mes</small>
        </span>
      </div>
      <div className="fun">
        {filas.map(([clave, nombre]) => (
          <div key={clave}>
            {nombre}
            <u>
              <i className={clave === 'ganados' ? 'or' : undefined} style={{ width: `${a[clave]}%` }} />
            </u>
            <b>{datos ? entero(datos[clave]) : RAYA}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

// 04 · Instagram -------------------------------------------------------------------------------------------------------

// La línea de seguidores. ancho y alto: los del dibujo (sin las fechas de abajo); id: para no repetir los de los degradados
export function Linea({ serie, desde, ancho = 412, alto = 70, id = 'ig' }: { serie: number[] | null; desde: string | null; ancho?: number; alto?: number; id?: string }) {
  const W = ancho
  const H = alto
  const pad = 4
  const guias = [0, 1, 2].map((i) => 4 + (i * (H - 4)) / 2)
  if (!serie || serie.length < 2 || !desde) {
    return (
      <svg width={W} height={H + 16} className="spark" aria-hidden>
        {guias.map((y) => (
          <line key={y} x1="0" x2={W} y1={f(y)} y2={f(y)} stroke="#fff" strokeOpacity=".05" />
        ))}
        <text className="kc-svgmono" x={W / 2} y={H / 2} fill="#fff" fillOpacity=".3" fontSize="9" letterSpacing="1.2" textAnchor="middle">
          SIN LA LÍNEA DE 30 DÍAS
        </text>
      </svg>
    )
  }
  const n = serie.length
  const mn = Math.min(...serie) - 3
  const mx = Math.max(...serie) + 2
  const X = (i: number) => pad + (i * (W - 2 * pad - 20)) / (n - 1)
  const Y = (v: number) => H - ((v - mn) / (mx - mn || 1)) * (H - 10)
  const puntos = serie.map((v, i) => [X(i), Y(v)] as [number, number])
  const linea = curvaSuave(puntos)
  const medio = Math.round((n - 1) / 2)
  const [lx, ly] = puntos[n - 1]
  return (
    <svg width={W} height={H + 16} className="spark" aria-hidden>
      <defs>
        <linearGradient id={`kc-ar-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`kc-sg-${id}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {guias.map((y) => (
        <line key={y} x1="0" x2={W} y1={f(y)} y2={f(y)} stroke="#fff" strokeOpacity=".05" />
      ))}
      <path d={`${linea}L${f(X(n - 1))} ${H}L${f(X(0))} ${H}Z`} fill={`url(#kc-ar-${id})`} />
      <path d={linea} fill="none" stroke="#f4f4f4" strokeWidth="1.6" />
      <circle cx={f(lx)} cy={f(ly)} r="9" fill={NARANJA} fillOpacity=".18" />
      <circle cx={f(lx)} cy={f(ly)} r="4" fill={NARANJA} filter={`url(#kc-sg-${id})`} />
      <circle cx={f(lx)} cy={f(ly)} r="4" fill={NARANJA} stroke="#0b0b0b" strokeWidth="1.5" />
      {(
        [
          [diaCorto(desde).toUpperCase(), X(0), 'start'],
          [diaCorto(sumarDias(desde, medio)).toUpperCase(), X(medio), 'middle'],
          ['HOY', X(n - 1), 'middle'],
        ] as const
      ).map(([t, x, a]) => (
        <text key={t} className="kc-svgmono" x={f(x)} y={H + 14} fill="#fff" fillOpacity=".38" fontSize="9" letterSpacing="1.2" textAnchor={a}>
          {t}
        </text>
      ))}
    </svg>
  )
}

const cifra = (v: number | null | undefined) => (typeof v === 'number' ? compacto(v) : RAYA)

// alto: el del panel (lo que crece, lo toma la línea)
export function Instagram({ datos, habla, alto }: { datos: DatosInstagram | null; habla: boolean; alto: number }) {
  return (
    <div className={`glass hud panel${habla ? ' habla' : ''}`} style={{ flex: '290 1 0px' }}>
      <div className="ph">
        <span className="ix">04</span>
        <span className="pt">
          Instagram<small>{datos ? `@${datos.usuario}` : ''}</small>
        </span>
        <span className="tag">30 días</span>
      </div>
      <div className="foll">
        <div className="n">{datos ? entero(datos.seguidores) : RAYA}</div>
        <div className="l">
          seguidores
          <br />
          <span style={{ color: 'var(--ink)' }}>{typeof datos?.semana === 'number' ? `+${entero(datos.semana)}` : RAYA}</span> esta semana
        </div>
      </div>
      <Linea serie={datos?.serie ?? null} desde={datos?.desde ?? null} alto={Math.max(70, 70 + alto - 290)} />
      <div className="stats">
        <div className="inset">
          <b>{cifra(datos?.vistas)}</b>
          <span>lo vieron</span>
        </div>
        <div className="inset">
          <b>{cifra(datos?.guardados)}</b>
          <span>lo guardaron</span>
        </div>
        <div className="inset">
          <b>{cifra(datos?.compartidos)}</b>
          <span>lo compartieron</span>
        </div>
      </div>
    </div>
  )
}

// 05 · El que más gustó ------------------------------------------------------------------------------------------------

function Miniatura({ m }: { m: DatosMejor }) {
  const [rota, setRota] = useState(false)
  const contenido = (
    <>
      {m.imagen && !rota ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="foto" src={m.imagen} alt="" referrerPolicy="no-referrer" onError={() => setRota(true)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mascota" src="/knox/pulgar.webp" alt="" />
      )}
      {m.tipo === 'reel' && (
        <span className="pl">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4v16l13-8z" />
          </svg>
        </span>
      )}
    </>
  )
  return m.enlace ? (
    <a className="thumb" href={m.enlace} target="_blank" rel="noreferrer" aria-label="Ver el post en Instagram">
      {contenido}
    </a>
  ) : (
    <div className="thumb">{contenido}</div>
  )
}

export function Mejor({ datos, habla }: { datos: DatosMejor | false | null; habla: boolean }) {
  const barras = datos ? barrasMejor(datos) : null
  const frase = datos ? fraseMejor(datos) : null
  return (
    <div className={`glass hud panel${habla ? ' habla' : ''}`} style={{ flex: '208 1 0px' }}>
      <div className="ph">
        <span className="ix">05</span>
        <span className="pt">El que más gustó</span>
        {datos && <span className="tag">{datos.tipo === 'reel' ? 'Reel' : datos.tipo === 'carrusel' ? 'Carrusel' : 'Foto'}</span>}
      </div>
      {!datos ? (
        <div className="vacio" style={{ height: 130, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          {datos === false ? 'No publicaste en los últimos 30 días.' : RAYA}
        </div>
      ) : (
        <div className="post">
          <Miniatura m={datos} />
          <div style={{ minWidth: 0 }}>
            <div className="pk">{diaYHora(datos.en)}</div>
            <div className="ptitle">{datos.titulo}</div>
            {barras && (
              <div className="cmp">
                <div>
                  Este
                  <u>
                    <i className="este" style={{ width: `${barras.este}%` }} />
                  </u>
                </div>
                <div>
                  Los demás
                  <u>
                    <i className="demas" style={{ width: `${barras.demas}%` }} />
                  </u>
                </div>
              </div>
            )}
            {frase && (
              <div className="cmp-note">
                {frase.antes}
                <b>{frase.fuerte}</b>
                {frase.despues}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 06 · Tu día ----------------------------------------------------------------------------------------------------------

export function TuDia({ datos, ahora, habla, alto }: { datos: Dia | null; ahora: Date | null; habla: boolean; alto: number }) {
  const momento = ahora ?? new Date(0)
  const items = datos?.items ?? []
  const cupo = caben.dia(alto)
  const vis = ahora ? visibles(items, momento, cupo) : items.slice(0, cupo)
  const etiqueta = !datos
    ? RAYA
    : datos.faltan.length === 1
      ? `Sin ${datos.faltan[0]}`
      : datos.faltan.length > 1
        ? 'Faltan datos'
        : items.length
          ? `${ahora ? listos(items, momento) : 0} de ${items.length} ${items.length === 1 ? 'lista' : 'listas'}`
          : 'Libre'
  return (
    <div className={`glass hud panel${habla ? ' habla' : ''}`} style={{ flex: '224 1 0px' }}>
      <div className="ph">
        <span className="ix">06</span>
        <span className="pt">Tu día</span>
        <span className="tag">{etiqueta}</span>
      </div>
      {!datos || items.length === 0 ? (
        <div className="vacio" style={{ height: 150, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          {datos ? 'Hoy no tienes citas, posts ni tareas.' : RAYA}
        </div>
      ) : (
        <div className="ag">
          {vis.map((i, k) => {
            const e = ahora ? estadoItem(i, momento) : { texto: '', clase: 'luego' as const }
            return (
              <div key={`${i.en}-${k}`} className={`ai ${e.clase}`}>
                <span className="t">{hora(i.en)}</span>
                <i className="nd" />
                <span className="w">
                  <span>{i.titulo}</span>
                  {i.detalle && <small>{i.detalle}</small>}
                </span>
                <span className="st">{e.texto}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 07 · Pulso del día ---------------------------------------------------------------------------------------------------

const ICONO = {
  post: '<path d="M9.5 7.5v9l7-4.5z" fill="currentColor" stroke="none"/>',
  cita: '<rect x="6" y="7" width="12" height="11" rx="2"/><path d="M9.5 5v3M14.5 5v3M6 11h12"/>',
  propuesta: '<path d="M14 5H8.5A1.5 1.5 0 0 0 7 6.5v11A1.5 1.5 0 0 0 8.5 19h7a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 5v3h3"/>',
}

// ancho: el del dibujo (el lienzo menos los dos bloques de los lados)
function PulsoSvg({ datos, ahora, ancho }: { datos: DatosPulso; ahora: Date; ancho: number }) {
  const W = ancho
  const base = 88
  const X = (h: number) => 14 + ((h - 6) * (W - 48)) / 17
  const centro = (k: number) => 6.25 + k / 2
  const nowH = horaDecimal(ahora.toISOString())
  const kAhora = Math.min(TRAMOS - 1, Math.max(0, Math.floor((nowH - 6) * 2)))
  // Lo de hoy se suaviza solo con lo que ya pasó (los tramos que vienen están en cero)
  const hoy = useMemo(() => [...suavizar(datos.hoy.slice(0, kAhora + 1)), ...datos.hoy.slice(kAhora + 1)], [datos.hoy, kAhora])
  const habitual = useMemo(() => suavizar(datos.habitual), [datos.habitual])
  // El tramo de ahora va por la mitad: la línea no baja de lo que venía
  const vAhora = Math.max(hoy[kAhora], hoy[kAhora - 1] ?? 0)
  const hayAhora = nowH >= 6 && nowH < 23
  const finPasado = Math.min(23, Math.max(6, nowH))
  const completos = hoy.filter((_, k) => k < kAhora || nowH >= 23)
  const futuro = habitual.filter((_, k) => centro(k) > finPasado)
  const mx = Math.max(0.5, vAhora, ...completos, ...futuro)
  const Y = (v: number) => base - (0.1 + (0.9 * v) / mx) * 60

  // Lo que pasó (línea llena) y lo que suele venir a esta hora (punteada, desde ahora)
  const ptsPasado: [number, number][] = nowH > 6 ? [[X(6), Y(hoy[0])]] : []
  hoy.forEach((v, k) => {
    if ((k < kAhora || nowH >= 23) && centro(k) < finPasado) ptsPasado.push([X(centro(k)), Y(v)])
  })
  if (nowH > 6) ptsPasado.push([X(finPasado), Y(nowH >= 23 ? hoy[TRAMOS - 1] : vAhora)])
  const ptsFuturo: [number, number][] = nowH < 23 ? [[X(finPasado), Y(nowH > 6 ? vAhora : habitual[0])]] : []
  habitual.forEach((v, k) => {
    if (centro(k) > finPasado) ptsFuturo.push([X(centro(k)), Y(v)])
  })
  if (nowH < 23) ptsFuturo.push([X(23), Y(habitual[TRAMOS - 1])])
  const lineaPasado = ptsPasado.length > 1 ? curvaSuave(ptsPasado) : ''
  const lineaFuturo = ptsFuturo.length > 1 ? curvaSuave(ptsFuturo) : ''
  const yEn = (instante: string) => {
    const k = Math.min(TRAMOS - 1, Math.max(0, Math.floor((horaDecimal(instante) - 6) * 2)))
    return Y(k === kAhora && hayAhora ? vAhora : hoy[k])
  }

  // Las marcas de arriba: lo que ya pasó, lo siguiente (en naranja) y lo de después
  const siguiente = datos.marcas.findIndex((m) => Date.parse(m.en) > ahora.getTime())
  const xs = datos.marcas.map((m) => X(horaDecimal(m.en)))
  const nx = X(finPasado)
  const etiquetaAhora = `AHORA ${hora(ahora.toISOString())}`
  // El «AHORA» va a la izquierda de la línea; si ahí hay una marca, a la derecha; si tampoco, debajo de las marcas
  const libre = (desde: number) => desde >= 0 && desde + 96 <= W && !xs.some((x) => x + 13 > desde && x - 13 < desde + 96)
  const pill = libre(nx - 104) ? { x: nx - 104, y: 0 } : libre(nx + 8) ? { x: nx + 8, y: 0 } : { x: Math.min(W - 96, Math.max(0, nx - 104)), y: 26 }
  // El nombre de una marca no tapa la siguiente ni el «AHORA»
  const conNombre = (i: number) => {
    const fin = xs[i] + 18 + datos.marcas[i].etiqueta.length * 6.6
    if ((xs[i + 1] ?? Infinity) - 13 < fin) return false
    return !(hayAhora && pill.y === 0 && xs[i] + 18 < pill.x + 96 && fin > pill.x)
  }

  return (
    <svg className="pulso-svg" viewBox={`0 0 ${W} 126`} aria-label="Actividad de hoy">
      <defs>
        <linearGradient id="kc-pa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="kc-pg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: 18 }, (_, i) => 6 + i).map((h) => (
        <g key={h}>
          <line x1={f(X(h))} x2={f(X(h))} y1="30" y2={base} stroke="#fff" strokeOpacity={h % 2 ? 0.025 : 0.05} />
          {h % 2 === 0 && h <= 22 && (
            <text className="kc-svgmono" x={f(X(h))} y={base + 20} fill="#fff" fillOpacity=".38" fontSize="9.5" letterSpacing="1" textAnchor="middle">
              {String(h).padStart(2, '0')}:00
            </text>
          )}
        </g>
      ))}
      <line x1="0" x2={W} y1={base} y2={base} stroke="#fff" strokeOpacity=".14" />
      {lineaPasado && <path d={`${lineaPasado}L${f(X(finPasado))} ${base}L${f(X(6))} ${base}Z`} fill="url(#kc-pa)" />}
      {lineaPasado && <path d={lineaPasado} fill="none" stroke="#f4f4f4" strokeWidth="1.6" />}
      {lineaFuturo && <path d={lineaFuturo} fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="1.4" strokeDasharray="3 5" />}
      {datos.clientes.map((en, i) => (
        <circle key={i} cx={f(X(horaDecimal(en)))} cy={f(yEn(en))} r="3.4" fill="#0b0b0b" stroke="#fff" strokeWidth="1.4" />
      ))}
      {datos.marcas.map((m, i) => {
        const x = xs[i]
        const y = 11
        const estado = siguiente === -1 || i < siguiente ? 'hecho' : i === siguiente ? 'siguiente' : 'luego'
        const color = estado === 'siguiente' ? NARANJA : '#f4f4f4'
        return (
          <g key={`${m.tipo}-${m.en}-${i}`}>
            <line x1={f(x)} x2={f(x)} y1={y + 11} y2={f(yEn(m.en))} stroke={color} strokeOpacity={estado === 'siguiente' ? 0.6 : 0.22} strokeDasharray="2 3" />
            <circle
              cx={f(x)}
              cy={y}
              r="11"
              fill={estado === 'hecho' ? 'rgba(255,255,255,.12)' : '#0b0b0b'}
              stroke={color}
              strokeOpacity={estado === 'luego' ? 0.35 : estado === 'siguiente' ? 0.9 : 0.35}
              filter={estado === 'siguiente' ? 'url(#kc-pg)' : undefined}
            />
            <g
              transform={`translate(${f(x - 12)} ${y - 12})`}
              color={color}
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: ICONO[m.tipo] }}
            />
            {conNombre(i) && (
              <text className="kc-svgsora" x={f(x + 18)} y={y + 3.5} fill="#fff" fillOpacity={estado === 'hecho' ? 0.45 : 0.75} fontSize="11">
                {m.etiqueta}
              </text>
            )}
          </g>
        )
      })}
      {hayAhora && (
        <g>
          <line x1={f(nx)} x2={f(nx)} y1="2" y2={base + 6} stroke={NARANJA} strokeWidth="1.5" filter="url(#kc-pg)" />
          <circle cx={f(nx)} cy={f(Y(vAhora))} r="10" fill={NARANJA} fillOpacity=".18" />
          <circle cx={f(nx)} cy={f(Y(vAhora))} r="4.2" fill={NARANJA} filter="url(#kc-pg)" />
          <rect x={f(pill.x)} y={pill.y} width="96" height="20" rx="10" fill="#120c09" stroke={NARANJA} strokeOpacity=".45" />
          <text className="kc-svgmono" x={f(pill.x + 48)} y={pill.y + 13.6} fill={NARANJA} fontSize="9.5" fontWeight="500" letterSpacing="1.4" textAnchor="middle">
            {etiquetaAhora}
          </text>
        </g>
      )}
    </svg>
  )
}

const ESTADO_CONEXION: Record<Exclude<Conexion, null>, string> = { conectado: '', caido: 'Sin conexión', 'por-conectar': 'Por conectar' }

// etiqueta: lo que dice a la derecha, si no es lo de siempre (el correo: «Conectado (2)» o «1 de 2»)
function FilaConexion({ nombre, estado, bien, etiqueta }: { nombre: string; estado: Conexion | undefined; bien: string; etiqueta?: string | null }) {
  const malo = estado === 'caido' || estado === 'por-conectar'
  return (
    <div>
      <i className={estado == null ? 'x' : malo ? 'p' : undefined} />
      {nombre}
      <span className={malo ? 'p' : undefined}>{estado == null ? RAYA : (etiqueta ?? (estado === 'conectado' ? bien : ESTADO_CONEXION[estado]))}</span>
    </div>
  )
}

// onConexiones: tocar la sección 08 abre la vista Conexiones
export function Pulso(p: { datos: DatosPulso | null; conexiones: Centro['conexiones'] | null; ahora: Date | null; ancho: number; onConexiones: () => void }) {
  const c = p.conexiones
  return (
    <footer className="glass hud pulse">
      <div className="pl-l">
        <div className="ph" style={{ margin: 0 }}>
          <span className="ix">07</span>
          <span className="pt">Pulso del día</span>
        </div>
        <div className="t2">{p.ahora ? tituloDia(p.ahora) : RAYA}</div>
        <div className="t3">
          Lo que pasó hoy
          <br />y lo que viene.
        </div>
      </div>
      <div className="vline" style={{ left: 258 }} />
      {p.datos && p.ahora ? (
        <PulsoSvg datos={p.datos} ahora={p.ahora} ancho={p.ancho - 640} />
      ) : (
        <div className="pulso-vacio vacio">{RAYA}</div>
      )}
      <div className="vline" style={{ right: 282 }} />
      <div
        className="pl-r"
        id="conexiones"
        role="button"
        tabIndex={0}
        aria-label="Ver las conexiones"
        onClick={p.onConexiones}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          p.onConexiones()
        }}
      >
        <div className="ph" style={{ margin: 0 }}>
          <span className="ix">08</span>
          <span className="pt">Conexiones</span>
        </div>
        <div className="cn">
          <FilaConexion nombre="Instagram" estado={c?.instagram} bien="Conectado" />
          <FilaConexion nombre="WhatsApp" estado={c?.whatsapp} bien="Conectado" />
          <FilaConexion nombre="Sitio web" estado={c?.sitio} bien="En línea" />
          <FilaConexion nombre="Correo" estado={c?.correo} bien="Conectado" etiqueta={etiquetaCorreo(c?.correoCuentas)} />
        </div>
      </div>
    </footer>
  )
}

