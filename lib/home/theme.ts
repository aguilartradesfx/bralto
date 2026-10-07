// Tema del home (el resto del sitio es solo oscuro). Vive en data-theme del
// contenedor del home, no en <html>, para no afectar otras páginas al navegar.
export type HomeTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'bralto-home-theme'

export function resolveTheme(stored: string | null, prefersLight: boolean): HomeTheme {
  if (stored === 'light' || stored === 'dark') return stored
  return prefersLight ? 'light' : 'dark'
}

// Script inline, hijo directo del contenedor del home: fija data-theme antes del
// primer pintado. Si algo falla, queda el oscuro que viene del servidor.
export const themeBootScript =
  `(function(resolve){try{var s=null;try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}` +
  `var l=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches);` +
  `document.currentScript.parentElement.dataset.theme=resolve(s,l)}catch(e){}})(${resolveTheme.toString()})`
