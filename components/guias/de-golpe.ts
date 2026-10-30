// El sitio tiene scroll-behavior: smooth en <html>. Para mover la página sin que se vea el viaje (al
// soltar la ventana del candado o al llegar a la guía recién abierta) se apaga solo durante el salto.
export function deGolpe(mover: () => void) {
  const html = document.documentElement.style
  const antes = html.scrollBehavior
  html.scrollBehavior = 'auto'
  mover()
  html.scrollBehavior = antes
}
