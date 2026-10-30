'use client'

import Image from 'next/image'
import { unstable_isUnrecognizedActionError, unstable_rethrow } from 'next/navigation'
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { desbloquear, ingresarConCorreo, type EstadoCandado } from '@/app/[locale]/guias/[slug]/actions'
import { errorDelPaso, limpiarNombre, pasoConError, type Paso } from '@/lib/guias/campos'
import { deGolpe } from './de-golpe'
import { TAMANOS_PORTADA } from './portada'

type Props = { slug: string; titulo: string; incluye: string[]; imagen: string | null; boton: string | null; origen?: string }

// Lo que dispara la ventana desde fuera (los botones de «Ir directo a» con la guía cerrada)
export const ABRIR_CANDADO = 'gu:abrir-candado'

const SIN_CONEXION = 'No pudimos enviar sus datos. Revise su conexión e intente de nuevo.'
const SITIO_NUEVO = 'El sitio se acaba de actualizar. Recargue la página e intente de nuevo.'

// Si la petición se cae (señal débil, el navegador de Instagram) o el servidor falla, la server action
// lanza un error en vez de devolver uno, y la página entera se cambiaba por la pantalla de error de Next.
// Así sale un aviso en la ventana y no se pierde lo escrito. La redirección que abre la guía también
// llega como error: esa se deja pasar.
function aSalvo(accion: (prev: EstadoCandado, form: FormData) => Promise<EstadoCandado>) {
  return async (prev: EstadoCandado, form: FormData): Promise<EstadoCandado> => {
    try {
      return await accion(prev, form)
    } catch (err) {
      unstable_rethrow(err)
      const texto = (campo: string) => {
        const v = form.get(campo)
        return typeof v === 'string' ? v : ''
      }
      return {
        error: unstable_isUnrecognizedActionError(err) ? SITIO_NUEVO : SIN_CONEXION,
        valores: { nombre: texto('nombre'), correo: texto('correo'), whatsapp: texto('whatsapp'), acepta: form.get('acepta') === 'on' },
      }
    }
  }
}

// Un dato por paso: la pregunta es la etiqueta del campo
function Pregunta(props: {
  name: string
  id?: string
  pregunta: string
  detalle?: string
  type?: string
  autoComplete: string
  inputMode?: 'email' | 'tel' | 'text'
  enterKeyHint: 'next' | 'go'
  placeholder?: string
  defaultValue?: string
  error?: string | null
  onChange?: () => void
}) {
  const id = props.id ?? `gu-${props.name}`
  const describe = [props.detalle && `${id}-detalle`, props.error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className="gu-pregunta">
      <label htmlFor={id} className="gu-pregunta__texto">
        {props.pregunta}
      </label>
      {props.detalle && (
        <p id={`${id}-detalle`} className="gu-pregunta__detalle">
          {props.detalle}
        </p>
      )}
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        className="gu-input"
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        enterKeyHint={props.enterKeyHint}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        onChange={props.onChange}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describe || undefined}
      />
      {props.error && (
        <p id={`${id}-error`} className="gu-error">
          {props.error}
        </p>
      )}
    </div>
  )
}

const CAMPO_DEL_PASO = { 1: 'gu-nombre', 2: 'gu-whatsapp', 3: 'gu-correo' } as const

// El final de lo abierto: bloques borrosos de lo que sigue, el botón «Ver todo» y la ventana con el
// registro. Lo de atrás es de mentira: el texto real no está en la página hasta registrarse.
// La ventana pide un dato a la vez (pedido de Alejandro: todo junto asustaba): 1) el nombre, con la foto
// y lo que trae la guía; 2) el WhatsApp; 3) el correo y la aceptación, con el botón propio de la guía.
// Los tres campos viven en el mismo formulario (los pasos ocultos también se envían) y solo el último
// va al servidor; los dos primeros se revisan aquí antes de seguir.
export function Candado({ slug, titulo, incluye, imagen, boton, origen }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [estado, enviar, enviando] = useActionState(aSalvo(desbloquear.bind(null, slug)), {} as EstadoCandado)
  const [estadoCorreo, entrar, entrando] = useActionState(aSalvo(ingresarConCorreo.bind(null, slug)), {} as EstadoCandado)
  const [conCorreo, setConCorreo] = useState(false)
  const [paso, setPaso] = useState<Paso>(1)
  const [aviso, setAviso] = useState<string | null>(null) // el error del paso 1 o 2, revisado aquí
  const [primerNombre, setPrimerNombre] = useState('')

  const irAPaso = (p: Paso) => {
    setPaso(p)
    setAviso(null)
    requestAnimationFrame(() => document.getElementById(CAMPO_DEL_PASO[p])?.focus())
  }

  // Enter o «Siguiente» en los pasos 1 y 2: se revisa el dato y se sigue, sin ir al servidor
  const alEnviar = (e: FormEvent<HTMLFormElement>) => {
    if (paso === 3) return
    e.preventDefault()
    const campo = paso === 1 ? 'nombre' : 'whatsapp'
    const valor = String(new FormData(e.currentTarget).get(campo) ?? '')
    const error = errorDelPaso(paso, valor)
    if (error) {
      setAviso(error)
      document.getElementById(`gu-${campo}`)?.focus()
      return
    }
    if (paso === 1) setPrimerNombre(limpiarNombre(valor).split(' ')[0])
    irAPaso(paso === 1 ? 2 : 3)
  }

  // El botón que cambia de formulario desaparece al tocarlo: el foco pasa al campo del otro
  const cambiarFormulario = (aCorreo: boolean) => {
    setConCorreo(aCorreo)
    requestAnimationFrame(() => document.getElementById(aCorreo ? 'gu-correo-ingreso' : CAMPO_DEL_PASO[paso])?.focus())
  }

  // Si el servidor devuelve errores, la ventana vuelve al primer paso que tenga uno y el foco va a ese
  // campo (el lector de pantalla lo lee)
  useEffect(() => {
    const p = pasoConError(estado.errores)
    if (!p) return
    setPaso(p)
    setAviso(null)
    const primero = (['nombre', 'whatsapp', 'correo', 'acepta'] as const).find((c) => estado.errores?.[c])
    requestAnimationFrame(() => document.getElementById(`gu-${primero}`)?.focus())
  }, [estado])

  useEffect(() => {
    if (estadoCorreo.error) document.getElementById('gu-correo-ingreso')?.focus()
  }, [estadoCorreo])

  const cta = useRef<HTMLDivElement>(null)
  const soltarScroll = useRef<(() => void) | null>(null)
  const restaurando = useRef(false) // el salto de soltar el bloqueo no cuenta como scroll de la persona
  const enFondo = useRef(false)
  const encabezado = useRef<HTMLHeadingElement>(null)
  const pasos = useRef<HTMLParagraphElement>(null)

  // Con la ventana abierta la página de atrás no se mueve.
  // - Computadora: overflow: hidden en el body y nada más, así la página se queda donde estaba (fijar el
  //   body la hacía saltar en Safari). Con barras de scroll clásicas, scrollbar-gutter guarda el lugar de
  //   la barra para que la página no se corra; donde no existe (Safari antes de 18.2), un relleno igual.
  // - Pantalla táctil (iOS no respeta el overflow): además el body queda fijo donde estaba, y al cerrar
  //   vuelve al mismo punto de golpe, sin la animación del scroll suave del sitio.
  const abrir = () => {
    const d = dialogo.current
    if (!d || d.open) return
    const y = window.scrollY
    const barra = window.innerWidth - document.documentElement.clientWidth
    try {
      d.showModal()
    } catch {
      return // sin <dialog> (iOS 15.3 o antes): mejor no bloquear nada que dejar la página congelada
    }
    const html = document.documentElement.style
    const b = document.body.style
    const antes = { gutter: html.scrollbarGutter, overflow: b.overflow, paddingRight: b.paddingRight, position: b.position, top: b.top, left: b.left, right: b.right, width: b.width }
    const tactil = window.matchMedia('(pointer: coarse)').matches
    html.scrollbarGutter = 'stable'
    if (barra > 0 && !CSS.supports('scrollbar-gutter: stable')) b.paddingRight = `${barra}px`
    b.overflow = 'hidden'
    if (tactil) Object.assign(b, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%' })
    soltarScroll.current = () => {
      restaurando.current = true
      const { gutter, ...body } = antes
      Object.assign(b, body)
      html.scrollbarGutter = gutter
      if (tactil) deGolpe(() => window.scrollTo(0, y))
      soltarScroll.current = null
      setTimeout(() => {
        restaurando.current = false
      }, 400)
    }
    // El foco va al título (o, si en el teléfono no se ve porque va en otro paso, a «Paso 2 de 3») y
    // no a la X: así no sale el anillo de foco sobre la X al abrirse sola, no se abre el teclado, y
    // quien usa lector de pantalla oye primero de qué se trata
    const titulo = encabezado.current
    ;(titulo && titulo.offsetParent !== null ? titulo : pasos.current)?.focus({ preventScroll: true })
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
        data-paso={conCorreo ? 'correo' : paso}
        aria-labelledby="gu-dialogo-titulo"
        onPointerDown={(e) => {
          enFondo.current = e.target === dialogo.current
        }}
        onClick={(e) => {
          // Clic afuera de la caja; no cuenta si empezó adentro (seleccionar texto y soltar afuera)
          if (enFondo.current && e.target === dialogo.current) dialogo.current.close()
        }}
      >
        <div className="gu-dialogo__caja">
          <button type="button" className="gu-cerrar" aria-label="Cerrar" onClick={() => dialogo.current?.close()}>
            ×
          </button>
          {/* La foto va pegada arriba (solo la caja tiene las esquinas redondeadas). En la computadora
              son dos columnas: la foto con lo que trae la guía, y los pasos. La foto es la misma de
              arriba con el mismo sizes (y priority, igual que arriba: Next las distingue por la
              dirección): sale de la caché, no se descarga dos veces */}
          <div className="gu-dialogo__info">
            {imagen && (
              <div className="gu-dialogo__foto">
                <Image src={imagen} alt="" width={1080} height={1350} sizes={TAMANOS_PORTADA} priority />
              </div>
            )}
            <div className="gu-dialogo__presenta">
              <p className="hm-eyebrow">Guía completa · gratis</p>
              <h2 id="gu-dialogo-titulo" ref={encabezado} tabIndex={-1}>
                Vea la guía completa
              </h2>
              <p className="gu-dialogo__guia">{titulo}</p>
              {incluye.length > 0 && (
                <ul className="gu-incluye">
                  {incluye.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="gu-dialogo__form">
            {!conCorreo ? (
              <form action={enviar} onSubmit={alEnviar} className="gu-form" noValidate>
                <input type="hidden" name="origen" value={origen ?? 'web'} />
                {/* Campo trampa para bots: una persona no lo ve ni lo llena. Nombre neutro para que
                    ningún gestor de contraseñas lo autocomplete y deje fuera a alguien real */}
                <div className="gu-trampa" aria-hidden="true">
                  <label>
                    Deje este campo vacío
                    <input name="hp_extra" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <p ref={pasos} className="gu-pasos" tabIndex={-1} aria-live="polite">
                  Paso {paso} de 3
                </p>

                <div className="gu-paso-form" hidden={paso !== 1}>
                  <Pregunta
                    name="nombre"
                    pregunta="¿Cuál es su nombre?"
                    autoComplete="name"
                    enterKeyHint="next"
                    defaultValue={estado.valores?.nombre}
                    error={paso === 1 && aviso ? aviso : estado.errores?.nombre}
                    onChange={() => setAviso(null)}
                  />
                </div>

                <div className="gu-paso-form" hidden={paso !== 2}>
                  {primerNombre && <p className="gu-saludo">Mucho gusto, {primerNombre}.</p>}
                  <Pregunta
                    name="whatsapp"
                    pregunta="¿Le enviamos por WhatsApp las novedades de IA y de los flujos que estamos armando?"
                    detalle="Déjenos su número con el código de país."
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="+506 8888 8888"
                    defaultValue={estado.valores?.whatsapp}
                    error={paso === 2 && aviso ? aviso : estado.errores?.whatsapp}
                    onChange={() => setAviso(null)}
                  />
                </div>

                <div className="gu-paso-form" hidden={paso !== 3}>
                  <Pregunta
                    name="correo"
                    pregunta="Último paso: ¿cuál es su correo?"
                    detalle="Con él entra a todas las guías de Bralto, desde cualquier aparato."
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="go"
                    defaultValue={estado.valores?.correo}
                    error={estado.errores?.correo}
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
                </div>

                <button type="submit" className="hm-btn hm-btn--solid gu-enviar" disabled={enviando}>
                  {paso < 3 ? 'Siguiente' : enviando ? 'Abriendo la guía…' : (boton ?? 'Ver la guía completa')}
                </button>
                {paso === 1 ? (
                  <button type="button" className="gu-cambiar" onClick={() => cambiarFormulario(true)}>
                    ¿Ya se registró? Entre con su correo
                  </button>
                ) : (
                  <button type="button" className="gu-cambiar" onClick={() => irAPaso(paso === 3 ? 2 : 1)}>
                    ← Volver
                  </button>
                )}
              </form>
            ) : (
              <form action={entrar} className="gu-form" noValidate>
                <p ref={pasos} className="gu-pasos" tabIndex={-1}>
                  Ya registrado
                </p>
                <Pregunta
                  name="correo"
                  id="gu-correo-ingreso"
                  pregunta="¿Con qué correo se registró?"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="go"
                  defaultValue={estadoCorreo.valores?.correo}
                  error={estadoCorreo.error}
                />
                <button type="submit" className="hm-btn hm-btn--solid gu-enviar" disabled={entrando}>
                  {entrando ? 'Buscando…' : 'Entrar'}
                </button>
                <button type="button" className="gu-cambiar" onClick={() => cambiarFormulario(false)}>
                  Es mi primera vez
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </div>
  )
}
