// Script inline del <head>: cada carga completa arranca arriba, sin restaurar el scroll.
// La URL no se toca: la query (UTM, gclid, retorno de pagos) tiene que llegar a GTM y a la
// página, y el #ancla de un enlace compartido tiene que llevar a su sección.
export const scrollRestorationScript = `if(history.scrollRestoration)history.scrollRestoration='manual';window.scrollTo(0,0);`
