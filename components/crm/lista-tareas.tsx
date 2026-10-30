import { agruparTareas, GRUPO_LABEL } from '@/lib/crm/tablero'
import type { TareaVista } from '@/lib/crm/vista'
import { Encabezado, SubMenu, Vacio } from '@/components/crm/piezas'
import { FilaTarea } from '@/components/crm/tarea'

// Todas las tareas pendientes, por fecha (las atrasadas primero), y las últimas que se hicieron
export function ListaTareas({ pendientes, hechas, ahora }: { pendientes: TareaVista[]; hechas: TareaVista[]; ahora: string }) {
  const grupos = agruparTareas(pendientes, new Date(ahora))
  return (
    <div className="max-w-3xl p-4 md:p-6 lg:p-8">
      <Encabezado titulo="Tareas" resumen={pendientes.length === 0 ? 'Nada pendiente' : pendientes.length === 1 ? '1 pendiente' : `${pendientes.length} pendientes`} />
      <SubMenu activa="/crm/tareas" />

      {grupos.length === 0 ? (
        <Vacio>No hay tareas pendientes. Las tareas se agregan desde la ficha de cada contacto.</Vacio>
      ) : (
        <div className="space-y-5">
          {grupos.map(([grupo, lista]) => (
            <section key={grupo} aria-label={GRUPO_LABEL[grupo]}>
              <h2 className={`mb-2 px-1 text-[13px] font-medium ${grupo === 'atrasadas' ? 'text-red-300' : 'text-fg/70'}`}>
                {GRUPO_LABEL[grupo]} <span className="tabular-nums text-fg/40">{lista.length}</span>
              </h2>
              <ul className="pn-glass divide-y divide-fg/[0.06] rounded-[16px] px-4">
                {lista.map((t) => (
                  <FilaTarea key={`${t.id}:${t.hecha}`} t={t} ahora={ahora} conContacto />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {hechas.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer px-1 text-[13px] font-medium text-fg/55 hover:text-fg">Hechas hace poco ({hechas.length})</summary>
          <ul className="pn-glass mt-2 divide-y divide-fg/[0.06] rounded-[16px] px-4">
            {hechas.map((t) => (
              <FilaTarea key={`${t.id}:${t.hecha}`} t={t} ahora={ahora} conContacto />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
