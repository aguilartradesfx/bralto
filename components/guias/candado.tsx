'use client'

import { useActionState, useState } from 'react'
import { desbloquear, ingresarConCorreo, type EstadoCandado } from '@/app/[locale]/guias/[slug]/actions'

type Props = { slug: string; incluye: string[]; origen?: string }

function Campo(props: {
  name: string
  label: string
  type?: string
  autoComplete: string
  inputMode?: 'email' | 'tel' | 'text'
  placeholder?: string
  defaultValue?: string
  error?: string
}) {
  const id = `gu-${props.name}`
  return (
    <div className="gu-campo">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        className="gu-input"
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? `${id}-error` : undefined}
        required
      />
      {props.error && (
        <p id={`${id}-error`} className="gu-error">
          {props.error}
        </p>
      )}
    </div>
  )
}

// La tarjeta del candado: lo que trae la guía y el formulario. Un registro abre todas las guías.
export function Candado({ slug, incluye, origen }: Props) {
  const [estado, enviar, enviando] = useActionState(desbloquear.bind(null, slug), {} as EstadoCandado)
  const [estadoCorreo, entrar, entrando] = useActionState(ingresarConCorreo.bind(null, slug), {} as EstadoCandado)
  const [conCorreo, setConCorreo] = useState(false)

  return (
    <section id="guia" className="gu-candado hm-glass" aria-labelledby="gu-candado-titulo">
      <p className="hm-eyebrow">Guía completa · gratis</p>
      <h2 id="gu-candado-titulo">Siga con el resto de la guía</h2>
      {incluye.length > 0 && (
        <ul className="gu-incluye">
          {incluye.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}

      {!conCorreo ? (
        <form action={enviar} className="gu-form" noValidate>
          <p className="gu-form__nota">Le pedimos sus datos una sola vez: con ellos se abren todas las guías de Bralto.</p>
          <input type="hidden" name="origen" value={origen ?? 'web'} />
          {/* Campo trampa para bots: una persona no lo ve ni lo llena. Nombre neutro para que
              ningún gestor de contraseñas lo autocomplete y deje fuera a alguien real */}
          <div className="gu-trampa" aria-hidden="true">
            <label>
              Deje este campo vacío
              <input name="hp_extra" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <Campo name="nombre" label="Nombre" autoComplete="name" defaultValue={estado.valores?.nombre} error={estado.errores?.nombre} />
          <Campo
            name="correo"
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={estado.valores?.correo}
            error={estado.errores?.correo}
          />
          <Campo
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+506 8888 8888"
            defaultValue={estado.valores?.whatsapp}
            error={estado.errores?.whatsapp}
          />
          <div className="gu-acepta">
            <input
              id="gu-acepta"
              type="checkbox"
              name="acepta"
              defaultChecked={estado.valores?.acepta}
              aria-invalid={estado.errores?.acepta ? true : undefined}
              aria-describedby={estado.errores?.acepta ? 'gu-acepta-error' : undefined}
            />
            <label htmlFor="gu-acepta">
              Acepto la{' '}
              <a href="/es/privacidad" target="_blank" rel="noopener">
                política de privacidad
              </a>{' '}
              y que Bralto me escriba por correo o WhatsApp.
            </label>
          </div>
          {estado.errores?.acepta && (
            <p id="gu-acepta-error" className="gu-error">
              {estado.errores.acepta}
            </p>
          )}
          {estado.error && (
            <p className="gu-error" role="alert">
              {estado.error}
            </p>
          )}
          <button type="submit" className="hm-btn hm-btn--solid gu-enviar" disabled={enviando}>
            {enviando ? 'Abriendo la guía…' : 'Ver la guía completa'}
          </button>
          <button type="button" className="gu-cambiar" onClick={() => setConCorreo(true)}>
            ¿Ya se registró? Entre con su correo
          </button>
        </form>
      ) : (
        <form action={entrar} className="gu-form" noValidate>
          <Campo
            name="correo"
            label="Su correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={estadoCorreo.valores?.correo}
            error={estadoCorreo.error}
          />
          <button type="submit" className="hm-btn hm-btn--solid gu-enviar" disabled={entrando}>
            {entrando ? 'Buscando…' : 'Entrar'}
          </button>
          <button type="button" className="gu-cambiar" onClick={() => setConCorreo(false)}>
            Es mi primera vez
          </button>
        </form>
      )}
    </section>
  )
}
