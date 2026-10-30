// «Ir directo a» cada sección de la guía abierta
export function IrDirecto({ secciones }: { secciones: { id: string; texto: string }[] }) {
  return (
    <nav className="gu-indice gu-tarjeta" aria-label="Ir directo a">
      <span className="hm-eyebrow">Ir directo a</span>
      <ul>
        {secciones.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`}>{s.texto}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
