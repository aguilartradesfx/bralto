'use client'

import Image from 'next/image'
import { unstable_isUnrecognizedActionError, unstable_rethrow } from 'next/navigation'
import { useActionState, useEffect, useState, type FormEvent } from 'react'
import { desbloquear, ingresarConCorreo, type EstadoCandado } from '@/app/[locale]/guias/[slug]/actions'
import { MENSAJES, errorDelNombre, limpiarNombre, pasoConError, type Paso } from '@/lib/guias/campos'
import { OTRO, PAISES, bandera, pais as datosPais, paisPorDefecto, whatsappCompleto } from '@/lib/guias/paises'
import { TAMANOS_CUADRO } from './portada'

type Props = {
  slug: string
  titulo: string
  incluye: string[]
  imagen: string | null
  boton: string | null
  origen?: string
  pais?: string | null // el país detectado por la IP: el selector del WhatsApp arranca en él
}

// El cuadro tutea (pedido de Alejandro); el texto de las guías sigue de usted
const SIN_CONEXION = 'No pudimos enviar tus datos. Revisa tu conexión e intenta de nuevo.'
const SITIO_NUEVO = 'El sitio se acaba de actualizar. Recarga la página e intenta de nuevo.'

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

// El WhatsApp: el país (con su bandera; arranca en el de la persona y se puede cambiar) y el número.
// El selector es el nativo del teléfono, invisible sobre la bandera y el código: así en la caja se ve
// corto y al tocarlo sale la lista completa con los nombres.
function Telefono(props: {
  pais: string
  numero: string
  ejemplo?: string
  error?: string | null
  alCambiarPais: (iso: string) => void
  alCambiarNumero: (v: string) => void
}) {
  const p = datosPais(props.pais)
  return (
    <div className="gu-pregunta">
      <label htmlFor="gu-whatsapp" className="gu-pregunta__texto">
        ¿Te gustaría recibir por WhatsApp info y herramientas de IA?
      </label>
      <div className="gu-telefono">
        <div className="gu-telefono__pais">
          <span aria-hidden="true">{p ? `${bandera(p.iso)} +${p.codigo}` : '🌐 +'}</span>
          <select aria-label="País de tu WhatsApp" value={props.pais} onChange={(e) => props.alCambiarPais(e.target.value)}>
            {PAISES.map((x) => (
              <option key={x.iso} value={x.iso}>
                {bandera(x.iso)} {x.nombre} (+{x.codigo})
              </option>
            ))}
            <option value={OTRO}>🌐 Otro país</option>
          </select>
        </div>
        <input
          id="gu-whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          className="gu-input"
          placeholder={props.ejemplo ?? '+57 300 123 4567'}
          value={props.numero}
          onChange={(e) => props.alCambiarNumero(e.target.value)}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? 'gu-whatsapp-error' : undefined}
        />
      </div>
      {props.error && (
        <p id="gu-whatsapp-error" className="gu-error">
          {props.error}
        </p>
      )}
    </div>
  )
}

const CAMPO_DEL_PASO = { 1: 'gu-nombre', 2: 'gu-whatsapp', 3: 'gu-correo' } as const

// El candado de las guías que piden datos (contenido descargable): la página es solo este cuadro, sin
// adelanto del texto (pedido de Alejandro: «si les interesa, que dejen sus datos; si no, ni modo»).
// Pide un dato a la vez (todo junto asustaba): 1) el nombre completo, con la foto y lo que trae la
// guía; 2) el WhatsApp, con el país ya puesto en el de la persona; 3) el correo y la aceptación, con el
// botón propio de la guía. Los tres campos viven en el mismo formulario (los pasos ocultos también se
// envían) y solo el último va al servidor; los dos primeros se revisan aquí antes de seguir.
export function Candado({ slug, titulo, incluye, imagen, boton, origen, pais }: Props) {
  const [estado, enviar, enviando] = useActionState(aSalvo(desbloquear.bind(null, slug)), {} as EstadoCandado)
  const [estadoCorreo, entrar, entrando] = useActionState(aSalvo(ingresarConCorreo.bind(null, slug)), {} as EstadoCandado)
  const [conCorreo, setConCorreo] = useState(false)
  const [paso, setPaso] = useState<Paso>(1)
  const [aviso, setAviso] = useState<string | null>(null) // el error del paso 1 o 2, revisado aquí
  const [primerNombre, setPrimerNombre] = useState('')
  const [paisWa, setPaisWa] = useState(() => paisPorDefecto(pais))
  const [numeroWa, setNumeroWa] = useState('')
  const datosPaisWa = datosPais(paisWa)
  const whatsapp = whatsappCompleto(paisWa, numeroWa)

  const irAPaso = (p: Paso) => {
    setPaso(p)
    setAviso(null)
    requestAnimationFrame(() => document.getElementById(CAMPO_DEL_PASO[p])?.focus())
  }

  // Enter o «Siguiente» en los pasos 1 y 2: se revisa el dato y se sigue, sin ir al servidor
  const alEnviar = (e: FormEvent<HTMLFormElement>) => {
    if (paso === 3) return
    e.preventDefault()
    const nombre = String(new FormData(e.currentTarget).get('nombre') ?? '')
    const error = paso === 1 ? errorDelNombre(nombre) : whatsapp ? null : MENSAJES.whatsapp
    if (error) {
      setAviso(error)
      document.getElementById(paso === 1 ? 'gu-nombre' : 'gu-whatsapp')?.focus()
      return
    }
    if (paso === 1) setPrimerNombre(limpiarNombre(nombre).split(' ')[0])
    irAPaso(paso === 1 ? 2 : 3)
  }

  // El botón que cambia de formulario desaparece al tocarlo: el foco pasa al campo del otro
  const cambiarFormulario = (aCorreo: boolean) => {
    setConCorreo(aCorreo)
    requestAnimationFrame(() => document.getElementById(aCorreo ? 'gu-correo-ingreso' : CAMPO_DEL_PASO[paso])?.focus())
  }

  // Si el servidor devuelve errores, el cuadro vuelve al primer paso que tenga uno y el foco va a ese
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

  return (
    <section className="gu-puerta" aria-labelledby="gu-cuadro-titulo">
      {/* La foto va pegada arriba (solo el cuadro tiene las esquinas redondeadas). En la computadora
          son dos columnas: la foto con lo que trae la guía, y los pasos */}
      <div className="gu-cuadro" data-paso={conCorreo ? 'correo' : paso}>
        <div className="gu-cuadro__info">
          {imagen && (
            <div className="gu-cuadro__foto">
              <Image src={imagen} alt="" width={1080} height={1350} sizes={TAMANOS_CUADRO} priority />
            </div>
          )}
          <div className="gu-cuadro__presenta">
            <p className="hm-eyebrow">Guía completa · gratis</p>
            <h1 id="gu-cuadro-titulo">Mira la guía completa</h1>
            <p className="gu-cuadro__guia">{titulo}</p>
            {incluye.length > 0 && (
              <ul className="gu-incluye">
                {incluye.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="gu-cuadro__form">
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
              <p className="gu-pasos" aria-live="polite">
                Paso {paso} de 3
              </p>

              <div className="gu-paso-form" hidden={paso !== 1}>
                <Pregunta
                  name="nombre"
                  pregunta="¿Cuál es tu nombre?"
                  autoComplete="name"
                  enterKeyHint="next"
                  placeholder="Nombre y apellido"
                  defaultValue={estado.valores?.nombre}
                  error={paso === 1 && aviso ? aviso : estado.errores?.nombre}
                  onChange={() => setAviso(null)}
                />
              </div>

              <div className="gu-paso-form" hidden={paso !== 2}>
                {primerNombre && <p className="gu-saludo">Mucho gusto, {primerNombre}.</p>}
                <Telefono
                  pais={paisWa}
                  numero={numeroWa}
                  error={paso === 2 && aviso ? aviso : estado.errores?.whatsapp}
                  alCambiarPais={(iso) => {
                    setPaisWa(iso)
                    setAviso(null)
                  }}
                  alCambiarNumero={(v) => {
                    setNumeroWa(v)
                    setAviso(null)
                  }}
                  ejemplo={datosPaisWa?.ejemplo}
                />
                {/* Lo que va al servidor: el número completo con el código del país */}
                <input type="hidden" name="whatsapp" value={whatsapp ?? numeroWa} />
              </div>

              <div className="gu-paso-form" hidden={paso !== 3}>
                <Pregunta
                  name="correo"
                  pregunta="Último paso: ¿cuál es tu correo?"
                  detalle="Con él entras a todas las guías de Bralto, desde cualquier aparato."
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
                  ¿Ya te registraste? Entra con tu correo
                </button>
              ) : (
                <button type="button" className="gu-cambiar" onClick={() => irAPaso(paso === 3 ? 2 : 1)}>
                  ← Volver
                </button>
              )}
            </form>
          ) : (
            <form action={entrar} className="gu-form" noValidate>
              <p className="gu-pasos">Ya registrado</p>
              <Pregunta
                name="correo"
                id="gu-correo-ingreso"
                pregunta="¿Con qué correo te registraste?"
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
    </section>
  )
}
