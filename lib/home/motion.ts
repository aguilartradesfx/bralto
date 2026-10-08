// "Pausar animaciones" (botón del pie): frena lo que se mueve solo y dura más de 5 s (WCAG 2.2.2),
// es decir los orbes, la consola del hero, el flujo de automatización y las partículas. Vive en
// data-motion de <html> y queda guardado para las próximas visitas.
export const MOTION_STORAGE_KEY = 'bralto-motion'

// Script inline del <head>: aplica la pausa guardada antes del primer pintado (sin un instante de movimiento)
export const motionBootScript =
  `try{if(localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})==='paused')` +
  `document.documentElement.dataset.motion='paused'}catch(e){}`
