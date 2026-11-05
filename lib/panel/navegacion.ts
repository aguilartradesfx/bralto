// El menú del panel (admin.bralto.io): las secciones que ya existen y las que vienen («Próximamente»).
// Lo usan el menú lateral, el título de arriba y las acciones rápidas (⌘K). Sin React: solo datos y reglas.
import { hasPermission, requiredPermission, type PanelPermission } from '../panel-access.ts'
import type { UserProfile } from '../../types/user-profiles.ts'
import { PRONTO } from './pronto.ts'

// Nombre del ícono (components/internal/shell/iconos.tsx los traduce a Lucide)
export type IconoNav =
  | 'inicio' | 'crm' | 'contactos' | 'mensajes' | 'pipeline' | 'tareas' | 'agenda' | 'knox'
  | 'ventas' | 'solicitudes' | 'propuestas' | 'contratos' | 'clientes' | 'facturas' | 'pagos'
  | 'marketing' | 'calendario' | 'campanas' | 'secuencias' | 'plantillas' | 'formularios'
  | 'finanzas' | 'resumen' | 'ingresos' | 'gastos' | 'flujo'
  | 'plan' | 'plan-inicio' | 'plan-tareas' | 'plan-etapas' | 'plan-equipo' | 'plan-estrategia'
  | 'documentos' | 'reportes' | 'rendimiento' | 'redes' | 'ventas-analitica' | 'a-la-medida'
  | 'ayuda' | 'ajustes'

// Los contadores del menú: conversaciones sin contestar y tareas pendientes
export type Cuenta = 'mensajes' | 'tareas'

export interface ItemNav {
  href: string
  label: string
  icono: IconoNav
  pronto?: boolean
  cuenta?: Cuenta
}

export interface GrupoNav {
  id: string
  label: string
  icono: IconoNav
  items: ItemNav[]
}

export type EntradaNav = ItemNav | GrupoNav

export const esGrupo = (e: EntradaNav): e is GrupoNav => 'items' in e

const pronto = (slug: string, label: string, icono: IconoNav): ItemNav => ({ href: `/pronto/${slug}`, label, icono, pronto: true })

export const NAV: EntradaNav[] = [
  { href: '/admin', label: 'Inicio', icono: 'inicio' },
  {
    id: 'crm',
    label: 'CRM',
    icono: 'crm',
    items: [
      { href: '/crm', label: 'Contactos', icono: 'contactos' },
      { href: '/crm/mensajes', label: 'Mensajes', icono: 'mensajes', cuenta: 'mensajes' },
      { href: '/crm/pipeline', label: 'Pipeline', icono: 'pipeline' },
      { href: '/crm/tareas', label: 'Tareas', icono: 'tareas', cuenta: 'tareas' },
      pronto('agenda', 'Agenda y citas', 'agenda'),
      { href: '/crm/knox', label: 'Knox', icono: 'knox' },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icono: 'ventas',
    items: [
      { href: '/solicitudes', label: 'Solicitudes', icono: 'solicitudes' },
      { href: '/propuestas', label: 'Propuestas', icono: 'propuestas' },
      { href: '/contratos', label: 'Contratos', icono: 'contratos' },
      { href: '/clientes', label: 'Clientes', icono: 'clientes' },
      pronto('facturas', 'Facturas', 'facturas'),
      pronto('pagos', 'Pagos', 'pagos'),
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icono: 'marketing',
    items: [
      { href: '/calendario', label: 'Calendario de redes', icono: 'calendario' },
      pronto('campanas', 'Campañas', 'campanas'),
      pronto('secuencias', 'Secuencias de correo', 'secuencias'),
      pronto('plantillas', 'Plantillas', 'plantillas'),
      pronto('formularios', 'Formularios', 'formularios'),
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icono: 'finanzas',
    items: [
      pronto('finanzas', 'Resumen', 'resumen'),
      pronto('ingresos', 'Ingresos', 'ingresos'),
      pronto('gastos', 'Gastos', 'gastos'),
      pronto('flujo-de-caja', 'Flujo de caja', 'flujo'),
    ],
  },
  {
    id: 'plan',
    label: 'Plan Q4',
    icono: 'plan',
    items: [
      { href: '/plan-q4?vista=inicio', label: 'Inicio del plan', icono: 'plan-inicio' },
      { href: '/plan-q4?vista=tareas', label: 'Tareas', icono: 'plan-tareas' },
      { href: '/plan-q4?vista=etapas', label: 'Etapas', icono: 'plan-etapas' },
      { href: '/plan-q4?vista=equipo', label: 'Equipo', icono: 'plan-equipo' },
      { href: '/plan-q4?vista=estrategia', label: 'Estrategia', icono: 'plan-estrategia' },
    ],
  },
  pronto('documentos', 'Documentos', 'documentos'),
  {
    id: 'reportes',
    label: 'Reportes y analíticas',
    icono: 'reportes',
    items: [
      pronto('rendimiento', 'Rendimiento del negocio', 'rendimiento'),
      pronto('analiticas-redes', 'Analíticas de redes', 'redes'),
      pronto('analiticas-ventas', 'Analíticas de ventas', 'ventas-analitica'),
      pronto('reportes', 'Reportes a la medida', 'a-la-medida'),
    ],
  },
]

// Abajo del menú
export const NAV_PIE: ItemNav[] = [pronto('ayuda', 'Ayuda', 'ayuda'), { href: '/ajustes', label: 'Ajustes', icono: 'ajustes' }]

type Perfil = Pick<UserProfile, PanelPermission> | null

// La ruta sin la consulta: /plan-q4?vista=tareas → /plan-q4
const ruta = (href: string) => href.split('?')[0]

// Lo que «Próximamente» deja ver solo a los administradores; lo demás, según el permiso de la sección
export function puedeVer(perfil: Perfil, item: ItemNav): boolean {
  return hasPermission(perfil, item.pronto ? 'is_admin' : requiredPermission(ruta(item.href)))
}

// El menú de cada quien: sin lo que no puede abrir, y sin los grupos que quedan vacíos
export function menuPara(perfil: Perfil, entradas: EntradaNav[] = NAV): EntradaNav[] {
  return entradas.flatMap((e): EntradaNav[] => {
    if (!esGrupo(e)) return puedeVer(perfil, e) ? [e] : []
    const items = e.items.filter((i) => puedeVer(perfil, i))
    return items.length ? [{ ...e, items }] : []
  })
}

export const piePara = (perfil: Perfil): ItemNav[] => NAV_PIE.filter((i) => puedeVer(perfil, i))

export function todosLosItems(entradas: EntradaNav[] = [...NAV, ...NAV_PIE]): ItemNav[] {
  return entradas.flatMap((e) => (esGrupo(e) ? e.items : [e]))
}

// ¿Esta entrada del menú es la página abierta? Las del plan se distinguen por ?vista= (sin ella, Inicio del plan)
export function estaActivo(item: ItemNav, pathname: string, vista: string | null = null): boolean {
  const [base, consulta] = item.href.split('?')
  if (consulta) {
    if (pathname !== base) return false
    const pedida = new URLSearchParams(consulta).get('vista')
    return (vista || 'inicio') === pedida
  }
  if (base === '/crm') return pathname === '/crm' || pathname === '/crm/nuevo' || (/^\/crm\/[^/]+$/.test(pathname) && !esSubseccionCrm(pathname))
  if (base === '/ajustes') return pathname === '/ajustes' || pathname.startsWith('/ajustes/') || pathname === '/usuarios'
  return pathname === base || pathname.startsWith(`${base}/`)
}

// /crm/mensajes, /crm/pipeline… son secciones; /crm/<id> es la ficha de un contacto (va con Contactos)
function esSubseccionCrm(pathname: string): boolean {
  return todosLosItems().some((i) => i.href !== '/crm' && ruta(i.href).startsWith('/crm/') && (pathname === ruta(i.href) || pathname.startsWith(`${ruta(i.href)}/`)))
}

// El grupo que tiene la página abierta (se despliega solo)
export function grupoActivo(pathname: string, vista: string | null = null): string | null {
  for (const e of NAV) if (esGrupo(e) && e.items.some((i) => estaActivo(i, pathname, vista))) return e.id
  return null
}

// El título de arriba: la sección de la página abierta
export function tituloDe(pathname: string, vista: string | null = null): string {
  if (pathname === '/plan-q4') return 'Plan Q4'
  const item = todosLosItems().find((i) => estaActivo(i, pathname, vista))
  if (item?.pronto) return PRONTO[item.href.replace('/pronto/', '')]?.titulo ?? item.label
  if (item) return item.href === '/admin' ? 'Inicio' : item.label
  const pronto = pathname.match(/^\/pronto\/([^/]+)$/)
  if (pronto && PRONTO[pronto[1]]) return PRONTO[pronto[1]].titulo
  return 'Panel'
}
