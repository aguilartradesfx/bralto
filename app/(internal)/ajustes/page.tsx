import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, BadgeCheck, CircleDashed, PlugZap, Sparkles, TriangleAlert, UserRound } from 'lucide-react'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { iniciales } from '@/lib/crm/tipos'
import { leerChequeos } from '@/lib/knox/centro/chequeos'
import { haceLargo } from '@/lib/knox/centro/conexiones'
import type { Chequeo, EstadoChequeo } from '@/lib/knox/centro/tipos'
import { PERMISSION_LABELS, type UserProfile } from '@/types/user-profiles'
import { PestañasAjustes } from '@/components/internal/ajustes/pestanas'
import { Apariencia, Fila } from '@/components/internal/ajustes/apariencia'
import { Pildora } from '@/components/internal/inicio/graficas'
import { ICONO } from '@/components/crm/piezas'
import type { Tono } from '@/lib/panel/inicio/calculos'

export const metadata = { title: 'Ajustes' }
export const dynamic = 'force-dynamic'

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  const admin = hasPermission(profile, 'is_admin')
  const { tab } = await searchParams
  const integraciones = admin && tab === 'integraciones'

  return (
    <div className="space-y-3 px-4 pb-12 md:px-8">
      <h1 className="sr-only">Ajustes</h1>
      <div className="pb-1">
        <PestañasAjustes activa={integraciones ? 'integraciones' : 'general'} admin={admin} />
      </div>
      {integraciones ? <Integraciones /> : <General correo={user.email ?? ''} perfil={profile} admin={admin} />}
    </div>
  )
}

function Caja({ icono: Icono, titulo, sub, accion, children, i = 0 }: { icono: typeof UserRound; titulo: string; sub?: string; accion?: React.ReactNode; children: React.ReactNode; i?: number }) {
  return (
    <section className="pn-glass pn-rise rounded-[14px] px-5 pb-2 pt-5" style={{ '--i': i } as React.CSSProperties}>
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-medium text-fg">
            <Icono size={14} {...ICONO} className="text-fg/45" />
            {titulo}
          </h2>
          {sub && <p className="mt-1 text-[12.5px] text-fg/45">{sub}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

function General({ correo, perfil, admin }: { correo: string; perfil: UserProfile | null; admin: boolean }) {
  const nombre = perfil?.full_name?.trim() || ''
  const permisos = perfil ? (Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[]).filter((k) => perfil[k]) : []
  return (
    <>
      <Caja
        icono={UserRound}
        titulo="Tu perfil"
        sub="Lo que ve tu equipo en el panel."
        accion={
          admin ? (
            <Link href="/usuarios" className="pn-btn-glass inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px]">
              Editar en Equipo
              <ArrowUpRight size={13} {...ICONO} />
            </Link>
          ) : undefined
        }
      >
        <Fila titulo="Nombre">{nombre || <span className="text-fg/40">Sin nombre todavía</span>}</Fila>
        <Fila titulo="Foto" detalle="Por ahora, tus iniciales.">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--pn-accent-soft)] text-[13px] font-medium text-[var(--pn-accent-ink)] ring-1 ring-inset ring-[var(--pn-accent-line)]">{iniciales(nombre || correo)}</span>
          <span className="pn-pronto">Subir foto · pronto</span>
        </Fila>
        <Fila titulo="Correo" detalle="Con el que entras al panel.">
          <span className="break-all">{correo}</span>
          <span className="pn-pill !text-[11.5px]">
            <BadgeCheck size={12} {...ICONO} className="text-[var(--pn-c-verde)]" />
            Verificado
          </span>
        </Fila>
        <Fila titulo="Rol">{perfil?.is_admin ? 'Administrador: ve y cambia todo' : 'Colaborador'}</Fila>
        {!perfil?.is_admin && (
          <Fila titulo="Lo que puedes abrir">
            {permisos.length ? permisos.map((k) => <span key={k} className="pn-pill !text-[11.5px]">{PERMISSION_LABELS[k]}</span>) : <span className="text-fg/40">Nada todavía. Pídele acceso a un administrador.</span>}
          </Fila>
        )}
      </Caja>

      <Caja icono={Sparkles} titulo="Apariencia" sub="Cómo se ve el panel en este navegador." i={1}>
        <Apariencia />
      </Caja>

      {admin && (
        <a href="https://knox.bralto.io" className="pn-banda pn-rise group flex flex-wrap items-center gap-4 overflow-hidden rounded-[12px] px-5 py-3.5 text-[13px]" style={{ '--i': 2 } as React.CSSProperties}>
          <span className="flex items-center gap-2 font-medium">
            <Sparkles size={14} {...ICONO} />
            Knox · centro de mando
          </span>
          <span className="flex-1 opacity-80">Tu asistente te cuenta el día en voz alta en knox.bralto.io.</span>
          <span className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[12px] ring-1 ring-inset ring-current transition-transform group-hover:translate-x-0.5">
            Abrir Knox
            <ArrowUpRight size={13} {...ICONO} />
          </span>
        </a>
      )}
    </>
  )
}

const TONO: Record<EstadoChequeo, Tono> = { conectado: 'verde', caido: 'rojo', 'por-conectar': 'gris', 'se-va': 'ambar' }
const ESTADO: Record<EstadoChequeo, string> = { conectado: 'Conectado', caido: 'Revisar', 'por-conectar': 'Por conectar', 'se-va': 'Se va a apagar' }

async function Integraciones() {
  let chequeos: Chequeo[] = []
  let fallo = false
  try {
    chequeos = await leerChequeos()
  } catch (err) {
    console.error('[ajustes] chequeos:', err instanceof Error ? err.message : err)
    fallo = true
  }
  const ahora = new Date()
  const conectadas = chequeos.filter((c) => c.estado === 'conectado').length
  return (
    <Caja icono={PlugZap} titulo="Integraciones" sub={fallo ? 'No se pudieron revisar ahora. Prueba de nuevo en un rato.' : `${conectadas} de ${chequeos.length} conectadas, revisadas de verdad (cada pocos minutos).`}>
      <ul>
        {chequeos.map((c) => (
          <li key={c.clave} className="grid gap-2 border-b border-fg/[0.06] py-3.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center sm:gap-6">
            <p className="flex items-center gap-2 text-[13px] text-fg">
              {c.estado === 'conectado' ? <BadgeCheck size={14} {...ICONO} className="text-[var(--pn-c-verde)]" /> : c.estado === 'por-conectar' ? <CircleDashed size={14} {...ICONO} className="text-fg/40" /> : <TriangleAlert size={14} {...ICONO} className="text-[var(--pn-c-rojo)]" />}
              {c.nombre}
            </p>
            <p className="text-[12.5px] text-fg/55">
              {c.detalle}
              {c.uso ? <span className="text-fg/35"> · {Math.round((c.uso.usado / Math.max(1, c.uso.limite)) * 100)} % usado</span> : null}
            </p>
            <span className="flex items-center gap-3">
              <span className="text-[11.5px] text-fg/35">{haceLargo(c.revisado, ahora)}</span>
              <Pildora tono={TONO[c.estado]}>{ESTADO[c.estado]}</Pildora>
            </span>
          </li>
        ))}
      </ul>
    </Caja>
  )
}
