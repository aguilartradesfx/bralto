import { AlertTriangle, ExternalLink, Instagram, Loader2, Music2 } from 'lucide-react'
import { FORMATO_LABEL } from '@/lib/ideas/analisis'
import type { IdeaFila } from '@/lib/ideas/cola'
import { haceCuanto, numerosDe } from '@/lib/ideas/vista'
import { ICONO } from '@/components/crm/piezas'
import { Acciones } from '@/components/ideas/acciones'

const TITULO = 'mb-2 text-[11px] font-medium uppercase tracking-wide text-fg/40'

// Una idea: de dónde salió, sus números, por qué pegó, tu versión y qué hacer con ella
export function TarjetaIdea({ idea, ahora }: { idea: IdeaFila; ahora: string }) {
  const { metricas: m, analisis: a } = idea
  const RedIcono = idea.red === 'instagram' ? Instagram : Music2
  const hace = haceCuanto(m?.publicado_en ?? null, new Date(ahora))
  const analizando = idea.estado === 'pendiente' || idea.estado === 'analizando'
  const origen = [idea.red === 'instagram' ? 'Instagram' : 'TikTok', m?.cuenta && `@${m.cuenta}`, hace && `salió ${hace}`, m?.duracion_s && `${m.duracion_s} s`]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="pn-glass rounded-[16px] p-4 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <p className="flex items-center gap-1.5 text-[13px] text-fg/55">
            <RedIcono size={14} {...ICONO} className="shrink-0" />
            <span className="truncate">{origen}</span>
          </p>
          <h2 className="mt-1 text-[15px] font-semibold leading-snug text-fg">{a?.tema ?? (analizando ? 'Analizando el video…' : 'Sin análisis')}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {a && (
            <span className="pn-pill" title="Qué tan cerca está de IA y negocios">
              De tu tema: <span className="tabular-nums">{a.de_tu_tema}/10</span>
            </span>
          )}
          <a href={idea.url} target="_blank" rel="noopener noreferrer" className="pn-btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
            Ver el original
            <ExternalLink size={12} {...ICONO} />
          </a>
        </div>
      </header>

      {m && (
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {numerosDe(m, idea.red).map((n) => (
            <div key={n.label} className="rounded-[12px] bg-fg/[0.03] px-3 py-2.5 ring-1 ring-inset ring-fg/[0.06]">
              <dt className="text-[12px] text-fg/50">{n.label}</dt>
              {n.valor ? (
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg" style={n.destacado ? { color: 'var(--pn-accent-ink)' } : undefined}>
                  {n.valor}
                </dd>
              ) : (
                <dd className="mt-1 text-[12px] leading-5 text-fg/40">{n.nota}</dd>
              )}
            </div>
          ))}
        </dl>
      )}

      {analizando && (
        <p role="status" className="mt-4 flex items-center gap-2 text-[13px] text-fg/55">
          <Loader2 size={14} {...ICONO} className="animate-spin" />
          {idea.error ? 'Falló una vez y lo estoy intentando de nuevo…' : 'Buscando los números y mirando el video. Tarda 1 o 2 minutos.'}
        </p>
      )}
      {idea.estado === 'error' && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-[13px] text-red-300">
          <AlertTriangle size={14} {...ICONO} className="mt-0.5 shrink-0" />
          <span>No se pudo analizar: {idea.error ?? 'error desconocido'}</span>
        </p>
      )}

      {a && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section aria-label="Por qué pegó">
            <h3 className={TITULO}>Por qué pegó</h3>
            <p className="text-[13px] text-fg/50">{FORMATO_LABEL[a.formato]}</p>
            {a.gancho.texto && (
              <p className="mt-2 text-sm text-fg/85">
                <span className="text-fg/50">Gancho: </span>«{a.gancho.texto}»{a.gancho.por_que && <span className="text-fg/60"> — {a.gancho.por_que}</span>}
              </p>
            )}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg/80 marker:text-fg/30">
              {a.por_que_pego.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {a.por_que_guardan && (
              <p className="mt-2 text-sm text-fg/70">
                <span className="text-fg/50">Lo guardan o lo comparten porque </span>
                {a.por_que_guardan.charAt(0).toLowerCase() + a.por_que_guardan.slice(1)}
              </p>
            )}
            {a.partes.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[13px] font-medium text-fg/55 hover:text-fg">Cómo está armado</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-fg/75 marker:text-fg/30">
                  {a.partes.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </details>
            )}
          </section>

          <section aria-label="Tu versión" className="rounded-[12px] bg-[var(--pn-accent-soft)] p-4 ring-1 ring-inset ring-[var(--pn-accent-line)]">
            <h3 className={TITULO}>Tu versión</h3>
            <p className="text-[15px] font-semibold text-fg">{a.tu_version.titulo}</p>
            <p className="mt-1 text-sm text-fg/75">{a.tu_version.idea}</p>
            <p className="mt-3 text-[13px] font-medium text-fg/55">3 ganchos</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-fg/85 marker:text-fg/30">
              {a.tu_version.ganchos.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ol>
            <p className="mt-3 text-[13px] font-medium text-fg/55">Guion</p>
            <ol className="mt-1 space-y-1 text-sm text-fg/80">
              {a.tu_version.guion.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
            {a.tu_version.comenta && (
              <p className="mt-3 text-sm text-fg/70">
                Cierre: «Comenta <span className="font-semibold text-fg">{a.tu_version.comenta}</span>»
              </p>
            )}
          </section>
        </div>
      )}

      <footer className="mt-5 border-t border-fg/[0.06] pt-4">
        <Acciones id={idea.id} estado={idea.estado} decision={idea.decision} conAnalisis={Boolean(a)} />
      </footer>
    </article>
  )
}
