'use client'

import { useState, type ReactNode } from 'react'
import { anchosEmbudo, estadoItem, filaCaliente, horaDecimal, listos, TIPO_POST } from '@/lib/knox/centro/armar'
import { ESTADO_CHEQUEO, haceLargo } from '@/lib/knox/centro/conexiones'
import { compacto, diaCorto, diaYHora, dolares, entero, hace, hora, nombreDia, porcentaje, tituloDeDia } from '@/lib/knox/centro/formato'
import { hoyCR } from '@/lib/calendario/fechas'
import type { Embudo, Esperando } from '@/lib/knox/centro/tipos'
import { ESTADO_PROGRAMADA, posicionesDia, rangoDia } from '@/lib/knox/centro/vistas/armar'
import type { CuentaRedes, DiaAgenda, PostTop, Programada, VistaAgenda, VistaConexiones, VistaRedes, VistaVentas } from '@/lib/knox/centro/vistas/tipos'
import type { CanalKnox } from '@/lib/knox/conversar/tipos'
import { Linea } from './paneles'
import { useMedida } from './medida'

// Las vistas del Centro de mando que se abren desde la barra de arriba: Ventas, Redes, Agenda y Conexiones. El mismo
// vidrio, naranja, letra mono y esquinas que Hoy. datos: undefined mientras llega la primera vez; null en una parte:
// esa fuente no respondió («—»).

const RAYA = '—'
const CANAL: Record<CanalKnox, string> = { instagram: 'Instagram', whatsapp: 'WhatsApp', messenger: 'Messenger' }

const Flecha = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
)

// El marco: el título, el botón para abrir la pantalla vieja del panel (secundario) y Knox en pequeño
export function MarcoVista(p: { titulo: string; sub: string; enlace?: { texto: string; href: string }; mini: ReactNode; clase: string; children: ReactNode }) {
  return (
    <section className="vista" aria-label={p.titulo}>
      <header className="vista-cab">
        <div>
          <h1>{p.titulo}</h1>
          <p className="sub2">{p.sub}</p>
        </div>
        <div className="acciones">
          {p.enlace && (
            <a className="boton2" href={p.enlace.href}>
              {p.enlace.texto}
              <Flecha />
            </a>
          )}
          {p.mini}
        </div>
      </header>
      <div className={`vista-grid ${p.clase}`}>{p.children}</div>
    </section>
  )
}

function Panel(p: { ix: string; titulo: string; tag?: ReactNode; area: string; children: ReactNode; clase?: string }) {
  return (
    <section className={`glass hud panel pv${p.clase ? ` ${p.clase}` : ''}`} style={{ gridArea: p.area }}>
      <div className="ph">
        <span className="ix">{p.ix}</span>
        <span className="pt">{p.titulo}</span>
        {p.tag != null && <span className="tag">{p.tag}</span>}
      </div>
      <div className="pv-cuerpo">{p.children}</div>
    </section>
  )
}

const Cargando = () => (
  <div className="pv-vacio cargando">
    <i className="dot late" />
    Leyendo…
  </div>
)
const Vacio = ({ children }: { children: ReactNode }) => <div className="pv-vacio vacio">{children}</div>

// Si todavía no llegó, «Leyendo…»; si no respondió, «—»; si llegó, lo de adentro
function Parte<T>({ valor, children }: { valor: T | null | undefined; children: (v: T) => ReactNode }) {
  if (valor === undefined) return <Cargando />
  if (valor === null) return <Vacio>{RAYA}</Vacio>
  return <>{children(valor)}</>
}

// Ventas -------------------------------------------------------------------------------------------------------------

function EmbudoGrande({ e }: { e: Embudo }) {
  const a = anchosEmbudo(e)
  const pasos: [keyof Embudo, string][] = [
    ['llegaron', 'Llegaron'],
    ['conversando', 'Conversando'],
    ['propuesta', 'Propuesta'],
    ['ganados', 'Ganados'],
  ]
  return (
    <div className="embudo-g">
      {pasos.map(([clave, nombre], i) => {
        const antes = i > 0 ? e[pasos[i - 1][0]] : null
        const pct = antes !== null ? porcentaje(e[clave], antes) : null
        return (
          <div key={clave} className="eg-fila">
            <span className="eg-nombre">{nombre}</span>
            <u>
              <i className={clave === 'ganados' ? 'or' : undefined} style={{ width: `${a[clave]}%` }} />
            </u>
            <b>{entero(e[clave])}</b>
            <span className="eg-pct">{pct ? `${pct} del paso anterior` : ''}</span>
          </div>
        )
      })}
    </div>
  )
}

// Cada pipeline como columnas: una por etapa, en el orden del pipeline, tan alta como las oportunidades que tiene
function Pipelines({ lista }: { lista: VistaVentas['pipelines'] & object }) {
  if (lista.length === 0) return <Vacio>Todavía no hay pipelines en el CRM.</Vacio>
  return (
    <div className="pipelines">
      {lista.map((p) => {
        const max = Math.max(1, ...p.etapas.map((e) => e.cuantas))
        return (
          <div key={p.nombre} className="pipeline">
            <div className="pl-cab">
              <b>{p.nombre}</b>
              <span>
                {entero(p.abiertas)} abiertas{p.valor > 0 ? ` · ${dolares(p.valor)}` : ''}
              </span>
            </div>
            <div className="columnas-et" style={{ gridTemplateColumns: `repeat(${p.etapas.length}, minmax(0, 1fr))` }}>
              {p.etapas.map((e) => (
                <div key={e.nombre} className={`col-et${e.cuantas === max && e.cuantas > 0 ? ' mayor' : ''}`}>
                  <b>{entero(e.cuantas)}</b>
                  <div className="barra-et">
                    <i style={{ height: `${e.cuantas ? Math.max(2, (e.cuantas / max) * 100) : 0}%` }} />
                  </div>
                  <span className="et-nombre" title={e.nombre}>
                    {e.nombre}
                  </span>
                  <span className="et-valor">{e.valor > 0 ? dolares(e.valor) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Columnas({ valores }: { valores: number[] }) {
  const W = 100
  const H = 40
  const max = Math.max(1, ...valores)
  const ancho = W / valores.length
  return (
    <svg className="columnas" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {valores.map((v, i) => {
        const h = v ? Math.max(2, (v / max) * (H - 2)) : 0.6
        return <rect key={i} x={i * ancho + ancho * 0.18} y={H - h} width={ancho * 0.64} height={h} rx="0.6" className={i === valores.length - 1 ? 'hoy' : undefined} />
      })}
    </svg>
  )
}

function ListaEsperando({ datos, ahora }: { datos: Esperando; ahora: Date | null }) {
  if (datos.conversaciones.length === 0) return <Vacio>Nadie te está esperando. ¡Vas al día!</Vacio>
  const caliente = filaCaliente(datos.conversaciones)
  return (
    <div className="lista-msg">
      {datos.conversaciones.map((c, i) => (
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
      ))}
    </div>
  )
}

export function VistaVentasPaneles({ datos, ahora }: { datos: VistaVentas | undefined; ahora: Date | null }) {
  const momento = ahora ?? new Date(0)
  return (
    <>
      <Panel ix="01" titulo="Camino a la venta" tag="Este mes" area="emb">
        <Parte valor={datos?.embudo}>{(e) => <EmbudoGrande e={e} />}</Parte>
      </Panel>
      <Panel
        ix="02"
        titulo="Oportunidades abiertas, por etapa"
        tag={datos?.pipelines ? `${entero(datos.pipelines.reduce((s, p) => s + p.abiertas, 0))} abiertas` : undefined}
        area="pip"
      >
        <Parte valor={datos?.pipelines}>{(l) => <Pipelines lista={l} />}</Parte>
      </Panel>
      <Panel ix="03" titulo="Personas nuevas" tag="30 días" area="lea">
        <Parte valor={datos?.leads}>
          {(l) => (
            <div className="leads30">
              <div className="foll">
                <div className="n">{entero(l.total)}</div>
                <div className="l">
                  {l.total === 1 ? 'persona nueva' : 'personas nuevas'}
                  <br />
                  en 30 días
                </div>
              </div>
              <div className="src">
                {l.porCanal.map((c) => (
                  <div key={c.canal}>
                    {c.canal}
                    <u>
                      <i style={{ width: `${c.total ? Math.max(6, (c.total / Math.max(1, l.porCanal[0].total)) * 100) : 0}%` }} />
                    </u>
                    <b>{c.total}</b>
                  </div>
                ))}
              </div>
              <Columnas valores={l.porDia} />
              <div className="eje">
                <span>{diaCorto(l.desde).toUpperCase()}</span>
                <span>HOY</span>
              </div>
            </div>
          )}
        </Parte>
      </Panel>
      <Panel ix="04" titulo="Lo último que se movió" area="mov">
        <Parte valor={datos?.movidas}>
          {(m) =>
            m.length === 0 ? (
              <Vacio>Todavía no hay oportunidades.</Vacio>
            ) : (
              <div className="movidas">
                {m.map((o, i) => (
                  <div key={`${o.nombre}-${i}`} className="movida">
                    <div style={{ minWidth: 0 }}>
                      <b>{o.nombre}</b>
                      {o.contacto !== o.nombre && <span>{o.contacto}</span>}
                    </div>
                    <span className={`ch${o.estado === 'ganada' ? ' or' : ''}`}>{o.estado === 'abierta' ? o.etapa : o.estado}</span>
                    <span className="mv-valor">{o.valor > 0 ? dolares(o.valor) : ''}</span>
                    <span className="mt">{ahora ? hace(o.en, momento) : ''}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Parte>
      </Panel>
      <Panel ix="05" titulo="Te están esperando" tag={datos?.esperando ? `${datos.esperando.total} sin responder` : undefined} area="esp">
        <Parte valor={datos?.esperando}>{(e) => <ListaEsperando datos={e} ahora={ahora} />}</Parte>
      </Panel>
    </>
  )
}

// Redes --------------------------------------------------------------------------------------------------------------

function Cuenta({ c, id }: { c: CuentaRedes; id: string }) {
  const [caja, medida] = useMedida<HTMLDivElement>()
  return (
    <div className="cuenta-red">
      <div className="foll">
        <div className="n">{entero(c.seguidores)}</div>
        <div className="l">
          seguidores
          <br />
          <span style={{ color: 'var(--ink)' }}>{typeof c.semana === 'number' ? `+${entero(c.semana)}` : RAYA}</span> esta semana
        </div>
      </div>
      {/* La línea se dibuja a la medida de su caja */}
      <div className="linea-caja" ref={caja}>
        {medida.ancho > 0 && <Linea serie={c.serie} desde={c.desde} ancho={medida.ancho} alto={Math.max(60, medida.alto - 16)} id={id} />}
      </div>
      <div className="stats">
        <div className="inset">
          <b>{typeof c.vistas === 'number' ? compacto(c.vistas) : RAYA}</b>
          <span>lo vieron</span>
        </div>
        <div className="inset">
          <b>{typeof c.guardados === 'number' ? compacto(c.guardados) : RAYA}</b>
          <span>lo guardaron</span>
        </div>
        <div className="inset">
          <b>{typeof c.compartidos === 'number' ? compacto(c.compartidos) : RAYA}</b>
          <span>lo compartieron</span>
        </div>
      </div>
    </div>
  )
}

function Miniatura({ p }: { p: PostTop }) {
  const [rota, setRota] = useState(false)
  return (
    <div className="top-img">
      {p.imagen && !rota ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imagen} alt="" referrerPolicy="no-referrer" onError={() => setRota(true)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mascota" src="/knox/pulgar.webp" alt="" />
      )}
    </div>
  )
}

function Top5({ lista }: { lista: PostTop[] }) {
  if (lista.length === 0) return <Vacio>No hubo publicaciones en los últimos 30 días.</Vacio>
  const cifra = (v: number | null) => (typeof v === 'number' ? compacto(v) : RAYA)
  return (
    <div className="top5">
      {lista.map((p, i) => {
        const tarjeta = (
          <>
            <Miniatura p={p} />
            <span className="top-n">{String(i + 1).padStart(2, '0')}</span>
            <div className="top-txt">
              <span className="pk">
                {TIPO_POST[p.tipo] ?? 'Post'} · {diaYHora(p.en)}
              </span>
              <b>{p.titulo}</b>
            </div>
            <div className="top-num">
              <div>
                <b>{cifra(p.vistas)}</b>
                <span>vistas</span>
              </div>
              <div>
                <b>{cifra(p.alcance)}</b>
                <span>alcance</span>
              </div>
              <div>
                <b>{cifra(p.guardados)}</b>
                <span>guardados</span>
              </div>
              <div>
                <b>{cifra(p.compartidos)}</b>
                <span>compartidos</span>
              </div>
            </div>
          </>
        )
        return p.enlace ? (
          <a key={`${p.en}-${i}`} className="top-card inset" href={p.enlace} target="_blank" rel="noreferrer">
            {tarjeta}
          </a>
        ) : (
          <div key={`${p.en}-${i}`} className="top-card inset">
            {tarjeta}
          </div>
        )
      })}
    </div>
  )
}

function Proximas({ lista, ahora }: { lista: Programada[]; ahora: Date | null }) {
  if (lista.length === 0) return <Vacio>No hay nada programado para los próximos 7 días.</Vacio>
  const hoy = ahora ? hoyCR(ahora) : ''
  const porDia = new Map<string, Programada[]>()
  for (const p of lista) {
    const d = hoyCR(new Date(p.en))
    porDia.set(d, [...(porDia.get(d) ?? []), p])
  }
  return (
    <div className="proximas">
      {[...porDia].map(([dia, items]) => (
        <div key={dia} className="px-dia">
          <span className="px-nombre">{hoy ? nombreDia(dia, hoy) : dia}</span>
          {items.map((p, i) => (
            <div key={`${p.en}-${i}`} className="px-fila">
              <span className="t">{hora(p.en)}</span>
              <span className="ch">{TIPO_POST[p.tipo] ?? 'Post'}</span>
              <span className="px-titulo">{p.titulo}</span>
              <span className={`ch${p.estado === 'error' || p.estado === 'borrador' ? ' or' : ''}`}>{ESTADO_PROGRAMADA[p.estado] ?? p.estado}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function VistaRedesPaneles({ datos, ahora }: { datos: VistaRedes | undefined; ahora: Date | null }) {
  const momento = ahora ?? new Date(0)
  const cuenta = (i: 0 | 1) => (datos === undefined ? undefined : (datos.cuentas[i] ?? null))
  return (
    <>
      {([0, 1] as const).map((i) => (
        <Panel
          key={i}
          ix={`0${i + 1}`}
          titulo="Instagram"
          tag={cuenta(i) ? `@${cuenta(i)!.usuario}` : i === 1 ? 'Colaboración' : undefined}
          area={i === 0 ? 'c1' : 'c2'}
        >
          <Parte valor={cuenta(i)}>{(c) => <Cuenta c={c} id={`red-${i}`} />}</Parte>
        </Panel>
      ))}
      <Panel ix="03" titulo="Lo que sale" tag="7 días" area="pro">
        <Parte valor={datos?.proximas}>{(l) => <Proximas lista={l} ahora={ahora} />}</Parte>
      </Panel>
      <Panel ix="04" titulo="Las 5 que más gustaron" tag="30 días" area="top">
        <Parte valor={datos?.top}>{(l) => <Top5 lista={l} />}</Parte>
      </Panel>
      <Panel ix="05" titulo="Comentarios recientes" tag="7 días" area="com">
        <Parte valor={datos?.comentarios}>
          {(l) =>
            l.length === 0 ? (
              <Vacio>Nadie comentó esta semana.</Vacio>
            ) : (
              <div className="comentarios">
                {l.map((c, i) => (
                  <div key={`${c.en}-${i}`} className="comentario">
                    <div className="cm-cab">
                      <b>@{c.usuario}</b>
                      <span className="mt">{ahora ? hace(c.en, momento) : ''}</span>
                    </div>
                    <p>{c.texto}</p>
                    <span className="cm-sobre">en «{c.publicacion}»</span>
                  </div>
                ))}
              </div>
            )
          }
        </Parte>
      </Panel>
    </>
  )
}

// Agenda -------------------------------------------------------------------------------------------------------------

const TIPO_ITEM = { cita: 'Cita', post: 'Post', tarea: 'Tarea' } as const

const BLOQUE = 52

// El día como una regla de horas: cada cosa en su hora (sin taparse) y, si es hoy, la línea de ahora. Si no caben,
// en lista
// rango: la regla de horas (la misma para los dos días, así las filas quedan a la par)
function DiaGrande({ d, ahora, rango }: { d: DiaAgenda; ahora: Date | null; rango: { desde: number; hasta: number } }) {
  const [caja, medida] = useMedida<HTMLDivElement>()
  const momento = ahora ?? new Date(0)
  const esHoy = !!ahora && d.dia === hoyCR(ahora)
  const horas = d.items.map((i) => horaDecimal(i.en))
  const ahoraH = esHoy ? horaDecimal(momento.toISOString()) : null
  const tops = medida.alto > 0 ? posicionesDia(horas, medida.alto, rango, BLOQUE) : null
  const y = (h: number) => ((h - rango.desde) / (rango.hasta - rango.desde)) * medida.alto
  const fila = (i: DiaAgenda['items'][number], k: number, top?: number) => {
    const e = ahora ? estadoItem(i, momento) : { texto: '', clase: 'luego' as const }
    return (
      <div key={`${i.en}-${k}`} className={`dg-item ${e.clase}`} style={top === undefined ? undefined : { top }}>
        <span className="t">{hora(i.en)}</span>
        <span className="w">
          <span>{i.titulo}</span>
          <small>{i.detalle ?? TIPO_ITEM[i.tipo]}</small>
        </span>
        <span className="st">{e.texto}</span>
      </div>
    )
  }
  return (
    <div className="dia-g" ref={caja}>
      {medida.alto > 0 && tops && (
        <>
          {Array.from({ length: rango.hasta - rango.desde + 1 }, (_, k) => rango.desde + k).map((h) => (
            <div key={h} className="dg-hora" style={{ top: y(h) }}>
              <span>{String(h % 24).padStart(2, '0')}:00</span>
            </div>
          ))}
          {ahoraH !== null && ahoraH >= rango.desde && ahoraH <= rango.hasta && (
            <div className="dg-ahora" style={{ top: y(ahoraH) }}>
              <span>Ahora {hora(momento.toISOString())}</span>
            </div>
          )}
        </>
      )}
      {d.items.length === 0 ? (
        <Vacio>Nada en la agenda.</Vacio>
      ) : tops ? (
        d.items.map((i, k) => fila(i, k, tops[k]))
      ) : medida.alto > 0 ? (
        <div className="dg-lista">{d.items.map((i, k) => fila(i, k))}</div>
      ) : null}
    </div>
  )
}

export function VistaAgendaPaneles({ datos, ahora }: { datos: VistaAgenda | undefined; ahora: Date | null }) {
  const hoy = ahora ? hoyCR(ahora) : ''
  const momento = ahora ?? new Date(0)
  const dias = datos?.dias ?? [undefined, undefined]
  const todos = (datos?.dias ?? []).flatMap((d) => d.items)
  const rango = rangoDia(
    todos.map((i) => horaDecimal(i.en)),
    ahora ? horaDecimal(momento.toISOString()) : null,
  )
  const siguiente = ahora ? todos.find((i) => !i.hecho && !i.fallo && Date.parse(i.en) > momento.getTime()) : undefined
  const sinCitas = datos?.faltan.includes('citas')
  return (
    <>
      {dias.slice(0, 2).map((d, i) => (
        <Panel
          key={i}
          ix={`0${i + 1}`}
          titulo={d ? `${hoy ? nombreDia(d.dia, hoy) : ''} · ${tituloDeDia(d.dia)}` : i === 0 ? 'Hoy' : 'Mañana'}
          tag={d && ahora && d.items.length ? `${listos(d.items, momento)} de ${d.items.length} listas` : undefined}
          area={i === 0 ? 'd1' : 'd2'}
        >
          {d === undefined ? <Cargando /> : <DiaGrande d={d} ahora={ahora} rango={rango} />}
        </Panel>
      ))}
      <Panel ix="03" titulo="En resumen" area="res">
        {datos === undefined ? (
          <Cargando />
        ) : (
          <div className="resumen">
            {(['cita', 'post', 'tarea'] as const).map((t) => (
              <div key={t} className="rs-fila">
                <span>{t === 'cita' ? 'Citas' : t === 'post' ? 'Publicaciones' : 'Tareas'}</span>
                {datos.dias.slice(0, 2).map((d) => (
                  <b key={d.dia}>
                    {d.items.filter((i) => i.tipo === t).length}
                    <small>{hoy ? nombreDia(d.dia, hoy).toLowerCase() : ''}</small>
                  </b>
                ))}
              </div>
            ))}
            <div className="rs-prox">
              <span className="cl">Lo próximo</span>
              {siguiente ? (
                <>
                  <b>{hora(siguiente.en)}</b>
                  <span>{siguiente.titulo}</span>
                </>
              ) : (
                <span>Nada más por ahora.</span>
              )}
            </div>
            {sinCitas && <p className="rs-falta">No se pudieron leer las citas.</p>}
          </div>
        )}
      </Panel>
    </>
  )
}

// Conexiones ---------------------------------------------------------------------------------------------------------

// El anillo de «todo junto»: cuántas están conectadas de todas
function Anillo({ conectadas, total }: { conectadas: number; total: number }) {
  const r = 86
  const largo = 2 * Math.PI * r
  const parte = total > 0 ? conectadas / total : 0
  return (
    <svg className="cx-anillo" viewBox="0 0 220 220" aria-hidden>
      <circle cx="110" cy="110" r={r + 14} fill="none" stroke="#fff" strokeOpacity=".08" strokeDasharray="1 4" />
      <circle cx="110" cy="110" r={r} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="6" />
      <circle
        cx="110"
        cy="110"
        r={r}
        fill="none"
        stroke="#ff6d28"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${largo * parte} ${largo}`}
        transform="rotate(-90 110 110)"
        className="cx-avance"
      />
    </svg>
  )
}

export function VistaConexionesPaneles({ datos, ahora }: { datos: VistaConexiones | undefined; ahora: Date | null }) {
  const momento = ahora ?? new Date()
  const lista = datos?.chequeos ?? []
  const conectadas = lista.filter((c) => c.estado === 'conectado').length
  const revisar = lista.filter((c) => c.estado !== 'conectado')
  return (
    <>
      <Panel ix="01" titulo="Todo junto" area="res">
        {datos === undefined ? (
          <Cargando />
        ) : (
          <div className="cx-resumen">
            <div className="cx-gauge">
              <Anillo conectadas={conectadas} total={lista.length} />
              <div className="cx-cifra">
                <b>{conectadas}</b>
                <span>de {lista.length} conectadas</span>
              </div>
            </div>
            <div className="cx-revisar">
              <span className="cl">{revisar.length ? 'Para revisar' : 'Todo está conectado'}</span>
              {revisar.map((c) => (
                <div key={c.clave} className="cx-fila">
                  <i />
                  <span>{c.nombre}</span>
                  <b>{ESTADO_CHEQUEO[c.estado]}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
      <div className="cx-grid">
        {datos === undefined
          ? null
          : lista.map((c, i) => (
              <section key={c.clave} className={`glass hud panel pv conexion ${c.estado}`}>
                <div className="ph">
                  <span className="ix">{String(i + 2).padStart(2, '0')}</span>
                  <span className="pt">{c.nombre}</span>
                </div>
                <div className="cx-estado">
                  <i />
                  {ESTADO_CHEQUEO[c.estado]}
                </div>
                <p className="cx-detalle">{c.detalle}</p>
                {c.uso && c.uso.limite > 0 && (
                  <u className="cx-uso">
                    <i style={{ width: `${Math.min(100, (c.uso.usado / c.uso.limite) * 100)}%` }} />
                  </u>
                )}
                <span className="cx-revisado">Revisado {haceLargo(c.revisado, momento)}</span>
              </section>
            ))}
      </div>
    </>
  )
}
