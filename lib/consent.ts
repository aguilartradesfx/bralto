// Consentimiento de cookies. GTM (y con él GA4, Meta Pixel y Adsmurai) solo carga si:
//   - eligió "Aceptar todo", o
//   - todavía no eligió y no visita desde la UE, el EEE o el Reino Unido (ahí el GDPR pide
//     consentimiento previo: nada carga hasta que acepte).
// "Solo esenciales" lo bloquea siempre. La región la marca el middleware con una cookie a
// partir del país que detecta Vercel.

export const CONSENT_STORAGE_KEY = 'bralto_cookie_consent'
export type ConsentChoice = 'all' | 'essential'

export const REGION_COOKIE = 'bralto_region'
export const OPT_IN_REGION = 'eu'

// UE (27), resto del EEE y Reino Unido
const OPT_IN_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT',
  'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB',
])

export function requiresOptIn(country: string | null | undefined): boolean {
  return !!country && OPT_IN_COUNTRIES.has(country.toUpperCase())
}

export function readConsent(value: string | null): ConsentChoice | null {
  return value === 'all' || value === 'essential' ? value : null
}

export function tagsAllowed(consent: ConsentChoice | null, optInRegion: boolean): boolean {
  return consent === 'all' || (consent !== 'essential' && !optInRegion)
}

/**
 * Script inline del <head>: deja `window.__braltoLoadTags()` (lo llama el banner al aceptar) y
 * carga GTM de una vez si la elección guardada y la región lo permiten. Nunca en el panel ni
 * en la firma de contratos.
 */
export function tagManagerBootScript({ gtmId, privateSurfaceJs }: { gtmId: string; privateSurfaceJs: string }): string {
  return (
    `(function(){try{if(${privateSurfaceJs})return;` +
    `var c=null;try{c=localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})}catch(e){}` +
    `var optIn=/(?:^|;\\s*)${REGION_COOKIE}=${OPT_IN_REGION}(?:;|$)/.test(document.cookie);` +
    `window.__braltoLoadTags=function(){if(window.__braltoTagsLoaded)return;window.__braltoTagsLoaded=true;` +
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});};` +
    `if(c==='all'||(c!=='essential'&&!optIn))window.__braltoLoadTags();}catch(e){}})()`
  )
}

// Cookies de Google Analytics, Google Ads y Meta que se borran al elegir "Solo esenciales"
const TRACKING_COOKIE = /^(?:_ga|_ga_.+|_gid|_gat.*|_gcl_.+|_fbp|_fbc)$/

export function trackingCookieNames(cookieString: string): string[] {
  return cookieString
    .split(';')
    .map((part) => part.split('=')[0].trim())
    .filter((name) => TRACKING_COOKIE.test(name))
}
