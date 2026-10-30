'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileText, Image as ImagenIcono, Music, Paperclip, Pencil, Video } from 'lucide-react'
import { diaLargo, diaYHora } from '@/lib/crm/fechas'
import { hoyCR, diaCR } from '@/lib/calendario/fechas'
import { telefonoLegible } from '@/lib/crm/telefono'
import { ESTADO_CITA_LABEL, tamanoLegible, tipoArchivo } from '@/lib/crm/tipos'
import type { AdjuntoVista, CitaVista, ContactoVista } from '@/lib/crm/vista'
import { CampoEtiquetas } from '@/components/crm/campo-etiquetas'
import { Aviso, Boton, CAMPO, ETIQUETA, Etiqueta, ICONO, Seccion } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

function Dato({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5">
      <dt className="w-24 shrink-0 text-fg/45">{nombre}</dt>
      <dd className="min-w-0 flex-1 break-words text-fg">{children}</dd>
    </div>
  )
}

const ORIGEN: Record<ContactoVista['origen'], string> = {
  ghl: 'Vino de GoHighLevel',
  panel: 'Lo creaste en el panel',
  zernio: 'Llegó por las redes',
  web: 'Llegó por la página web',
}

// Los datos del contacto: se ven y, con «Editar», se cambian
export function Datos({ contacto, etiquetas, ahora }: { contacto: ContactoVista; etiquetas: string[]; ahora: string }) {
  const [editando, setEditando] = useState(false)
  const hoy = hoyCR(new Date(ahora))
  return (
    <Seccion
      titulo="Datos"
      accion={
        !editando && (
          <button type="button" onClick={() => setEditando(true)} className="pn-btn-glass inline-flex items-center gap-1 px-3 py-1 text-xs font-medium">
            <Pencil size={12} {...ICONO} />
            Editar
          </button>
        )
      }
    >
      {editando ? (
        <Editar contacto={contacto} etiquetas={etiquetas} cerrar={() => setEditando(false)} />
      ) : (
        <dl className="text-sm">
          <Dato nombre="Nombre">{`${contacto.nombre} ${contacto.apellido}`.trim() || <span className="text-fg/40">Sin nombre</span>}</Dato>
          <Dato nombre="Teléfono">{contacto.telefono ? telefonoLegible(contacto.telefono) : <span className="text-fg/40">No tiene</span>}</Dato>
          <Dato nombre="Correo">{contacto.correo ?? <span className="text-fg/40">No tiene</span>}</Dato>
          <Dato nombre="Empresa">{contacto.empresa ?? <span className="text-fg/40">No tiene</span>}</Dato>
          <Dato nombre="Etiquetas">
            {contacto.etiquetas.length ? (
              <span className="flex flex-wrap gap-1.5">
                {contacto.etiquetas.map((e) => (
                  <Etiqueta key={e}>{e}</Etiqueta>
                ))}
              </span>
            ) : (
              <span className="text-fg/40">Ninguna</span>
            )}
          </Dato>
          {contacto.fuente && <Dato nombre="Llegó por">{contacto.fuente}</Dato>}
          <Dato nombre="Desde">
            {diaLargo(diaCR(contacto.creado_en), hoy)} <span className="text-fg/40">· {ORIGEN[contacto.origen]}</span>
          </Dato>
        </dl>
      )}
    </Seccion>
  )
}

function Editar({ contacto, etiquetas, cerrar }: { contacto: ContactoVista; etiquetas: string[]; cerrar: () => void }) {
  const { enviar, ocupado, error } = useEnvio()
  const [datos, setDatos] = useState({
    nombre: contacto.nombre,
    apellido: contacto.apellido,
    telefono: contacto.telefono ?? '',
    correo: contacto.correo ?? '',
    empresa: contacto.empresa ?? '',
  })
  const [lista, setLista] = useState(contacto.etiquetas)
  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) => setDatos({ ...datos, [campo]: e.target.value })

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar(`/api/crm/contactos/${contacto.id}`, 'PATCH', { ...datos, etiquetas: lista })) cerrar()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={ETIQUETA}>Nombre</span>
          <input required value={datos.nombre} onChange={cambiar('nombre')} disabled={ocupado} className={CAMPO} />
        </label>
        <label className="block">
          <span className={ETIQUETA}>Apellido</span>
          <input value={datos.apellido} onChange={cambiar('apellido')} disabled={ocupado} className={CAMPO} />
        </label>
      </div>
      <label className="block">
        <span className={ETIQUETA}>Teléfono</span>
        <input type="tel" inputMode="tel" value={datos.telefono} onChange={cambiar('telefono')} disabled={ocupado} className={CAMPO} />
        <span className="mt-1 block text-xs text-fg/40">Con el código del país (+506, +1…). Si es de Costa Rica, con los 8 números basta.</span>
      </label>
      <label className="block">
        <span className={ETIQUETA}>Correo</span>
        <input type="email" inputMode="email" value={datos.correo} onChange={cambiar('correo')} disabled={ocupado} className={CAMPO} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>Empresa</span>
        <input value={datos.empresa} onChange={cambiar('empresa')} disabled={ocupado} className={CAMPO} />
      </label>
      <div>
        <span className={ETIQUETA}>Etiquetas</span>
        <CampoEtiquetas valor={lista} onChange={setLista} sugerencias={etiquetas} disabled={ocupado} />
      </div>
      {error && (
        <Aviso>
          {error.texto}{' '}
          {error.otro && (
            <Link href={`/crm/${error.otro.id}`} className="underline underline-offset-2">
              Ver su ficha
            </Link>
          )}
        </Aviso>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Boton principal type="submit" disabled={ocupado || !datos.nombre.trim()}>
          {ocupado ? 'Guardando…' : 'Guardar'}
        </Boton>
        <Boton onClick={cerrar} disabled={ocupado}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

const ESTADO_CITA_CLASE: Record<CitaVista['estado'], string> = {
  nueva: 'text-fg/70',
  confirmada: 'text-fg/70',
  asistio: 'text-emerald-300',
  no_asistio: 'text-amber-300',
  cancelada: 'text-fg/40 line-through',
}

export function Citas({ citas, ahora }: { citas: CitaVista[]; ahora: string }) {
  const momento = new Date(ahora)
  return (
    <Seccion titulo="Citas" cuenta={citas.length}>
      {citas.length === 0 ? (
        <p className="text-sm text-fg/45">No tiene citas.</p>
      ) : (
        <ul className="divide-y divide-fg/[0.06]">
          {citas.map((c) => {
            const viene = Date.parse(c.fin ?? c.inicio) > momento.getTime() && c.estado !== 'cancelada'
            return (
              <li key={c.id} className="py-2.5">
                <p className="break-words text-sm text-fg">{c.titulo}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs">
                  <span className="text-fg/50">{diaYHora(c.inicio, momento)}</span>
                  <span className={ESTADO_CITA_CLASE[c.estado]}>{ESTADO_CITA_LABEL[c.estado]}</span>
                </p>
                {c.notas && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-fg/50">{c.notas}</p>}
                {viene && c.enlace && (
                  <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="pn-btn-glass mt-2 inline-flex px-3 py-1 text-xs font-medium">
                    Entrar a la videollamada
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}

const ICONO_ARCHIVO: Record<string, typeof FileText> = { Foto: ImagenIcono, Video, Audio: Music, PDF: FileText, Archivo: Paperclip }

export function Archivos({ adjuntos, ahora }: { adjuntos: AdjuntoVista[]; ahora: string }) {
  const hoy = hoyCR(new Date(ahora))
  return (
    <Seccion titulo="Archivos" cuenta={adjuntos.length}>
      {adjuntos.length === 0 ? (
        <p className="text-sm text-fg/45">No hay archivos.</p>
      ) : (
        <ul className="divide-y divide-fg/[0.06]">
          {adjuntos.map((a) => {
            const tipo = tipoArchivo(a.tipo)
            const Icono = ICONO_ARCHIVO[tipo]
            return (
              <li key={a.id}>
                <a href={`/api/crm/adjuntos/${a.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5 transition-colors hover:text-fg">
                  <Icono size={16} {...ICONO} className="shrink-0 text-fg/50" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{tipo}</span>
                    <span className="block text-xs text-fg/45">
                      {diaLargo(diaCR(a.creado_en), hoy)}
                      {a.tamano ? ` · ${tamanoLegible(a.tamano)}` : ''}
                    </span>
                  </span>
                  <Download size={15} {...ICONO} className="shrink-0 text-fg/45" />
                  <span className="sr-only">Bajar</span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}

// Los campos personalizados que traía GoHighLevel (respuestas de formularios y demás)
export function MasDatos({ campos }: { campos: ContactoVista['campos'] }) {
  const lista = Object.entries(campos)
  if (lista.length === 0) return null
  return (
    <Seccion titulo="Más datos" cuenta={lista.length}>
      <dl className="divide-y divide-fg/[0.06] text-sm">
        {lista.map(([clave, c]) => (
          <div key={clave} className="py-2">
            <dt className="text-xs text-fg/45">{c.etiqueta ?? 'Otro dato'}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-fg">{c.valor}</dd>
          </div>
        ))}
      </dl>
    </Seccion>
  )
}
