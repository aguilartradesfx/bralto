'use client'

import { unstable_rethrow } from 'next/navigation'
import { useActionState } from 'react'
import { pedirEliminacion, type EstadoFormulario } from '@/app/[locale]/eliminar-datos/actions'
import type { TextoEliminar } from '@/app/[locale]/eliminar-datos/content'

type Props = { locale: 'es' | 'en'; t: TextoEliminar['formulario'] }

function Campo(props: {
  name: 'nombre' | 'contacto' | 'cuenta' | 'detalle'
  etiqueta: string
  ayuda?: string
  error?: string
  defaultValue?: string
  autoComplete: string
  largo?: boolean
}) {
  const id = `ed-${props.name}`
  const describe = [props.ayuda && `${id}-ayuda`, props.error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const comunes = {
    id,
    name: props.name,
    className: 'ed-input',
    autoComplete: props.autoComplete,
    defaultValue: props.defaultValue,
    'aria-invalid': props.error ? true : undefined,
    'aria-describedby': describe,
  }
  return (
    <div className="ed-campo">
      <label htmlFor={id} className="ed-campo__etiqueta">
        {props.etiqueta}
      </label>
      {props.ayuda && (
        <p id={`${id}-ayuda`} className="ed-campo__ayuda">
          {props.ayuda}
        </p>
      )}
      {props.largo ? <textarea {...comunes} rows={3} maxLength={1200} /> : <input {...comunes} type="text" maxLength={260} />}
      {props.error && (
        <p id={`${id}-error`} className="ed-error">
          {props.error}
        </p>
      )}
    </div>
  )
}

export function FormularioEliminar({ locale, t }: Props) {
  const accion = pedirEliminacion.bind(null, locale)
  // Si la petición se cae, la server action lanza en vez de devolver: aviso en el cuadro, sin perder lo escrito
  const [estado, enviar, enviando] = useActionState(async (prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> => {
    try {
      return await accion(prev, form)
    } catch (err) {
      unstable_rethrow(err)
      const v = (c: string) => (typeof form.get(c) === 'string' ? (form.get(c) as string) : '')
      return { error: t.sinConexion, valores: { nombre: v('nombre'), contacto: v('contacto'), cuenta: v('cuenta'), detalle: v('detalle') } }
    }
  }, {})

  if (estado.codigo) {
    return (
      <div className="ed-listo hm-glass" role="status">
        <h3>{t.listoTitulo}</h3>
        <p className="ed-codigo">{estado.codigo}</p>
        <p>{t.listoTexto}</p>
        <a className="hm-btn hm-btn--glass hm-glass" href={`/${locale}/eliminar-datos?codigo=${encodeURIComponent(estado.codigo)}#estado`}>
          {t.verEstado}
        </a>
      </div>
    )
  }

  const e = estado.errores ?? {}
  const val = estado.valores ?? {}
  return (
    <form action={enviar} className="ed-form" noValidate>
      <Campo name="nombre" etiqueta={t.nombre} error={e.nombre} defaultValue={val.nombre} autoComplete="name" />
      <Campo name="contacto" etiqueta={t.contacto} ayuda={t.contactoAyuda} error={e.contacto} defaultValue={val.contacto} autoComplete="email" />
      <Campo name="cuenta" etiqueta={t.cuenta} ayuda={t.cuentaAyuda} defaultValue={val.cuenta} autoComplete="username" />
      <Campo name="detalle" etiqueta={t.detalle} ayuda={t.detalleAyuda} error={e.detalle} defaultValue={val.detalle} autoComplete="off" largo />
      {/* Escondido: una persona no lo ve ni lo llena; un bot sí */}
      <div className="ed-oculto" aria-hidden="true">
        <label htmlFor="ed-hp">No llenar</label>
        <input id="ed-hp" name="hp_extra" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {estado.error && (
        <p className="ed-error ed-error--general" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn--solid" disabled={enviando}>
        {enviando ? t.enviando : t.enviar}
      </button>
    </form>
  )
}
