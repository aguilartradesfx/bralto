// Texto plano para el historial. Los correos de GoHighLevel pueden traer HTML: aquí se le quitan las etiquetas
// (el panel nunca pinta HTML ajeno, solo texto). Un mensaje que no es HTML solo se ordena: no se toca su «<».

const NOMBRADAS: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', uuml: 'ü', ntilde: 'ñ',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Uuml: 'Ü', Ntilde: 'Ñ',
  iexcl: '¡', iquest: '¿', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', euro: '€', middot: '·', bull: '•',
}

// Una sola pasada: «&amp;lt;» queda como «&lt;», no como «<»
function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entera, cuerpo: string) => {
    if (cuerpo[0] === '#') {
      const codigo = cuerpo[1] === 'x' || cuerpo[1] === 'X' ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10)
      return Number.isFinite(codigo) && codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : entera
    }
    return NOMBRADAS[cuerpo] ?? entera
  })
}

// Una etiqueta que cierra, un <br> o un doctype: un «a<b» suelto en un mensaje no cuenta
const ETIQUETA_HTML = /<\/(?:html|body|p|div|span|a|table|tr|td|th|ul|ol|li|h[1-6]|strong|em|b|i|u|font|center|blockquote|style)\s*>|<br\s*\/?>|<!doctype html/i

export const pareceHtml = (s: string) => ETIQUETA_HTML.test(s)

export function textoPlano(entrada: string | null | undefined, { html = false } = {}): string {
  if (!entrada) return ''
  let s = String(entrada)
  if (html || pareceHtml(s)) {
    s = s
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|head|title)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|tr|h[1-6]|blockquote|table)\s*>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<\/?[a-z][^>]*>/gi, '')
      .replace(/<!doctype[^>]*>/gi, '')
    s = decodificar(s)
  }
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
