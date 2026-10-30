'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { desbloquear, ingresarConCorreo, type EstadoCandado } from '@/app/[locale]/guias/[slug]/actions'

type Props = { slug: string; incluye: string[]; origen?: string }

// Lo que dispara la ventana desde fuera (los botones de «Ir directo a» con la guía cerrada)
export const ABRIR_CANDADO = 'gu:abrir-candado'

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

// El final de lo abierto: bloques borrosos de lo que sigue, el botón «Ver todo» y la ventana con
// el formulario. Lo de atrás es de mentira: el texto real no está en la página hasta registrarse.
export function Candado({ slug, incluye, origen }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [estado, enviar, enviando] = useActionState(desbloquear.bind(null, slug), {} as EstadoCandado)
  const [estadoCorreo, entrar, entrando] = useActionState(ingresarConCorreo.bind(null, slug), {} as EstadoCandado)
  const [conCorreo, setConCorreo] = useState(false)

  const cta = useRef<HTMLDivElement>(null)
  const soltarScroll = useRef<(() => void) | null>(null)
  const restaurando = useRef(false) // el salto de soltar el bloqueo no cuenta como scroll de la persona

  // Con la ventana abierta la página de atrás no se mueve. En iOS no alcanza con overflow: hidden,
  // así que el body queda fijo donde estaba y al cerrar se devuelve al mismo punto.
  const abrir = () => {
    const d = dialogo.current
    if (!d || d.open) return
    const y = window.scrollY
    const b = document.body.style
    const antes = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width, overflow: document.documentElement.style.overflow }
    document.documentElement.style.overflow = 'hidden'
    Object.assign(b, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%' })
    soltarScroll.current = () => {
      restaurando.current = true
      document.documentElement.style.overflow = antes.overflow
      Object.assign(b, { position: antes.position, top: antes.top, left: antes.left, right: antes.right, width: antes.width })
      window.scrollTo(0, y)
      soltarScroll.current = null
      setTimeout(() => {
        restaurando.current = false
      }, 400)
    }
    d.showModal()
  }

  useEffect(() => {
    const d = dialogo.current
    const alCerrar = () => soltarScroll.current?.()
    d?.addEventListener('close', alCerrar)
    window.addEventListener(ABRIR_CANDADO, abrir)
    return () => {
      d?.removeEventListener('close', alCerrar)
      window.removeEventListener(ABRIR_CANDADO, abrir)
      soltarScroll.current?.() // si la página se va con la ventana abierta (al registrarse), el scroll vuelve
    }
  }, [])

  // La ventana se abre sola cada vez que la persona llega con el scroll hasta el «Ver todo». Si la
  // cierra, vuelve a salir en cuanto el candado sale de la pantalla y vuelve a entrar. Todo se decide
  // con el scroll de la persona (no al cargar sin bajar, ni con el salto de soltar el bloqueo).
  useEffect(() => {
    const objetivo = cta.current
    const d = dialogo.current
    if (!objetivo || !d) return
    let bajo = false
    let armada = true
    const alCerrar = () => {
      armada = false // tiene que salir de la pantalla y volver a entrar
    }
    const alScroll = () => {
      if (d.open || restaurando.current) return
      if (window.scrollY > 40) bajo = true
      const r = objetivo.getBoundingClientRect()
      const h = window.innerHeight
      if (r.bottom < 0 || r.top > h) armada = true
      else if (armada && bajo && r.top < h * 0.8 && r.bottom > h * 0.2) {
        armada = false
        abrir()
      }
    }
    d.addEventListener('close', alCerrar)
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => {
      d.removeEventListener('close', alCerrar)
      window.removeEventListener('scroll', alScroll)
    }
  }, [])

  return (
    <div id="guia" className="gu-candado">
      <div className="gu-velo" aria-hidden="true">
        <span className="gu-velo__titulo" />
        <span className="gu-velo__linea" style={{ width: '94%' }} />
        <span className="gu-velo__linea" style={{ width: '88%' }} />
        <span className="gu-velo__linea" style={{ width: '72%' }} />
        <span className="gu-velo__tarjeta">
          <span className="gu-velo__linea" style={{ width: '60%' }} />
          <span className="gu-velo__codigo" />
          <span className="gu-velo__imagen" />
        </span>
        <span className="gu-velo__linea" style={{ width: '90%' }} />
        <span className="gu-velo__linea" style={{ width: '66%' }} />
      </div>

      <div ref={cta} className="gu-candado__cta">
        <button type="button" className="hm-btn hm-btn--solid gu-ver-todo" onClick={abrir}>
          Ver todo
        </button>
        <p>Es gratis: le pedimos sus datos una sola vez.</p>
      </div>

      <dialog
        ref={dialogo}
        className="gu-dialogo"
        aria-labelledby="gu-dialogo-titulo"
        onClick={(e) => {
          if (e.target === dialogo.current) dialogo.current.close() // clic afuera de la caja
        }}
      >
        <div className="gu-dialogo__caja">
          <button type="button" className="gu-cerrar" aria-label="Cerrar" onClick={() => dialogo.current?.close()}>
            ×
          </button>
          <p className="hm-eyebrow">Guía completa · gratis</p>
          <h2 id="gu-dialogo-titulo">Vea la guía completa</h2>
          {incluye.length > 0 && (
            <ul className="gu-incluye">
              {incluye.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}

          {!conCorreo ? (
            <form action={enviar} className="gu-form" noValidate>
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
              <p className="gu-form__nota">Con este registro se abren todas las guías de Bralto.</p>
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
        </div>
      </dialog>
    </div>
  )
}
