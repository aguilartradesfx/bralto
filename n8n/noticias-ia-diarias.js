import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const GEMINI = { googlePalmApi: { id: 'fEELApbTANN4LwJY', name: 'Gemini · Bralto' } };
const BRALTO = { httpHeaderAuth: { id: 'eaOrVVhFOjJKtvsK', name: 'Bralto · Noticias API' } };
const RESEND = { httpHeaderAuth: { id: 'OiG9o9VRxoXp4Hjr', name: 'Resend · Bralto' } };

const cadaDia = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cada día a las 6:00 y 6:45',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 6, triggerAtMinute: 0 }, { field: 'days', daysInterval: 1, triggerAtHour: 6, triggerAtMinute: 45 }] } },
    position: [0, 400]
  },
  output: [{}]
});

const configuracion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Configuración',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const hoyCR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
if ($getWorkflowStaticData('global').ultimoDia === hoyCR) return [];
return [{ json: {
  hoyCR,
  base: 'https://braltoio-git-feat-noticias-ia-alejandro-aguilar.vercel.app',
  ensayoHasta: '2026-10-13',
  avisoA: 'aguilartradesfx@gmail.com',
  remitente: 'Bralto Noticias <noticias@send.bralto.io>',
  modeloTexto: 'gemini-3.1-pro-preview',
  modeloLectura: 'gemini-3.5-flash',
  modeloImagen: 'gemini-3-pro-image',
  hoy: new Date().toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica', dateStyle: 'long' }),
} }];`
    },
    position: [240, 400]
  },
  output: [{ base: 'https://www.bralto.io', ensayoHasta: '2026-10-13', avisoA: 'a@b.c', remitente: 'Bralto Noticias <noticias@send.bralto.io>', modeloTexto: 'gemini-3.1-pro-preview', modeloLectura: 'gemini-3.5-flash', modeloImagen: 'gemini-3-pro-image', hoy: '10 de octubre de 2026' }]
});

const listaFeeds = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Lista de feeds',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const feeds = [
  ['OpenAI', 'https://openai.com/news/rss.xml'],
  ['Anthropic', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml'],
  ['Google', 'https://blog.google/technology/ai/rss/'],
  ['Google DeepMind', 'https://deepmind.google/blog/rss.xml'],
  ['Meta', 'https://about.fb.com/news/feed/'],
  ['Microsoft', 'https://blogs.microsoft.com/feed/'],
  ['NVIDIA', 'https://blogs.nvidia.com/feed/'],
  ['Hugging Face', 'https://huggingface.co/blog/feed.xml'],
  ['TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'],
  ['The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
  ['Ars Technica', 'https://arstechnica.com/ai/feed/'],
  ['MIT Technology Review', 'https://www.technologyreview.com/topic/artificial-intelligence/feed'],
  ['Wired', 'https://www.wired.com/feed/tag/ai/latest/rss'],
  ['The Decoder', 'https://the-decoder.com/feed/'],
  ['Xataka', 'https://www.xataka.com/tag/inteligencia-artificial/rss2.xml'],
];
return feeds.map(([nombre, url]) => ({ json: { nombre, url } }));`
    },
    position: [480, 400]
  },
  output: [{ nombre: 'OpenAI', url: 'https://openai.com/news/rss.xml' }]
});

const leerFeed = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Leer feed',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.url }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [
        { name: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
        { name: 'Accept', value: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }
      ] },
      options: { timeout: 30000, response: { response: { responseFormat: 'text', outputPropertyName: 'xml' } } }
    },
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    position: [720, 400]
  },
  output: [{ xml: '<rss><channel><item><title>Una noticia</title><link>https://openai.com/index/algo</link><pubDate>Fri, 10 Oct 2026 10:00:00 GMT</pubDate><description>Resumen</description></item></channel></rss>' }]
});

const ultimas24 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Últimas 24 h',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const feeds = $('Lista de feeds').all().map((i) => i.json);
const sinCdata = (s) => String(s || '').replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, '$1');
const limpiar = (s) => sinCdata(s).replace(/<[^>]+>/g, ' ').replace(/&lt;[\\s\\S]*?&gt;/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;|&rsquo;/g, "'").replace(/&#(\\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/\\s+/g, ' ').trim();
const campo = (blk, nombres) => {
  for (const n of nombres) {
    const m = blk.match(new RegExp('<' + n + '(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)</' + n + '>', 'i'));
    if (m && sinCdata(m[1]).trim()) return sinCdata(m[1]).trim();
  }
  return '';
};
const leerXml = (xml) => {
  const x = String(xml || '');
  const bloques = x.match(/<item[\\s>][\\s\\S]*?<\\/item>/gi) || x.match(/<entry[\\s>][\\s\\S]*?<\\/entry>/gi) || [];
  return bloques.map((b) => {
    let link = campo(b, ['link']);
    if (!/^https?:/.test(link)) { const m = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link[^>]*href=["']([^"']+)["']/i); link = m ? m[1] : ''; }
    return { titulo: limpiar(campo(b, ['title'])), link: link.replace(/&amp;/g, '&').trim(), fecha: campo(b, ['pubDate', 'dc:date', 'published', 'updated']), resumen: limpiar(campo(b, ['description', 'summary', 'content:encoded', 'content'])).slice(0, 500) };
  });
};
const ahora = Date.now();
const vistos = new Set();
const caidos = [];
const lista = [];
$input.all().forEach((item, i) => {
  const p = Array.isArray(item.pairedItem) ? item.pairedItem[0] : item.pairedItem;
  const feed = feeds[p ? p.item : i] || { nombre: 'Fuente' };
  const items = item.json.error ? [] : leerXml(item.json.xml);
  if (!items.length) { caidos.push(feed.nombre); return; }
  for (const n of items) {
    const fecha = Date.parse(n.fecha);
    if (!fecha || ahora - fecha > 24 * 3600 * 1000 || fecha - ahora > 3600 * 1000) continue;
    if (!n.titulo || !n.link.startsWith('https://') || vistos.has(n.link)) continue;
    vistos.add(n.link);
    lista.push({ fuente: feed.nombre, titulo: n.titulo, link: n.link, resumen: n.resumen });
  }
});
return [{ json: { lista, caidos } }];`
    },
    position: [960, 400]
  },
  output: [{ lista: [{ fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', resumen: 'Resumen' }], caidos: [] }]
});

const notasUsadas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notas ya guardadas',
    parameters: {
      method: 'GET',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/recientes"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    executeOnce: true,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [1200, 400]
  },
  output: [{ fuentes: ['https://example.com/vieja'], titulos: ['Un título viejo'] }]
});

const quitarRepetidas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Quitar repetidas',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const usadas = new Set($input.first().json.fuentes || []);
const prev = $('Últimas 24 h').first().json;
return [{ json: {
  lista: prev.lista.filter((n) => !usadas.has(n.link)),
  caidos: prev.caidos,
  titulos: $input.first().json.titulos || [],
} }];`
    },
    position: [1440, 400]
  },
  output: [{ lista: [{ fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', resumen: 'Resumen' }], caidos: [], titulos: [] }]
});

const hayNoticias = ifElse({
  version: 2.3,
  config: {
    name: '¿Hay noticias nuevas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.lista.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [1680, 400]
  }
});

const avisoSinNoticias = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aviso: sin noticias',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
$getWorkflowStaticData('global').ultimoDia = cfg.hoyCR;
const caidos = $('Quitar repetidas').first().json.caidos;
return [{ json: {
  from: cfg.remitente,
  to: [cfg.avisoA],
  subject: 'Noticias IA: hoy no se publicó',
  html: '<p>Hoy no se publicó ninguna nota: no hubo noticias nuevas de IA en las últimas 24 horas.</p>' + (caidos.length ? '<p style="color:#777">Feeds que no respondieron: ' + caidos.join(', ') + '.</p>' : ''),
} }];`
    },
    position: [1920, 800]
  },
  output: [{ from: 'x', to: ['y'], subject: 's', html: 'h' }]
});

const pedidoElegir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: elegir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const d = $input.first().json;
const NL = '\\n';
const lista = d.lista.map((n) => ({ fuente: n.fuente, titulo: n.titulo, resumen: n.resumen, link: n.link }));
const prompt = [
  'Hoy es ' + cfg.hoy + '. Usted es el editor de noticias de IA de Bralto. Sus lectores son dueños de pequeñas y medianas empresas en Latinoamérica que no son técnicos.',
  '',
  'De la lista, elija hasta 3 noticias, en orden de relevancia para ellos. Sirven: herramientas o funciones nuevas que un negocio puede usar ya; cambios de precio o de acceso en productos de uso masivo (ChatGPT, Gemini, Claude, Copilot, Meta AI, WhatsApp, etc.); regulación que los afecte; seguridad y privacidad; casos de uso concretos con resultados. No sirven: rumores; rondas de inversión o valuaciones sin impacto práctico; investigación académica sin aplicación inmediata; opinión; chismes corporativos o de ejecutivos; temas muy técnicos para desarrolladores.',
  '',
  'Tampoco elija temas que ya cubrimos en estas notas recientes:',
  d.titulos.length ? d.titulos.map((t) => '- ' + t).join(NL) : '(ninguna)',
  '',
  'Si ninguna noticia tiene un impacto claro para un negocio, responda publicar=false y explique el motivo en una oración. Si hay, responda publicar=true, motivo vacío y las candidatas: el link exacto de la lista y una oración de por qué le importa a un negocio.',
  '',
  'Noticias de las últimas 24 horas:',
  JSON.stringify(lista),
].join(NL);
return [{ json: {
  url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloTexto + ':generateContent',
  body: {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          publicar: { type: 'BOOLEAN' },
          motivo: { type: 'STRING' },
          candidatas: { type: 'ARRAY', maxItems: 3, items: { type: 'OBJECT', properties: { link: { type: 'STRING' }, por_que: { type: 'STRING' } }, required: ['link', 'por_que'] } },
        },
        required: ['publicar', 'motivo', 'candidatas'],
      },
    },
  },
} }];`
    },
    position: [1920, 300]
  },
  output: [{ url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent', body: {} }]
});

const elegir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Elegir con Gemini',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 240000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [2160, 300]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"publicar":true,"motivo":"","candidatas":[{"link":"https://openai.com/index/algo","por_que":"x"}]}' }] } }] }]
});

const leerEleccion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer elección',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const r = $input.first().json;
const parts = ((r.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let out;
try { out = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al elegir: ' + texto.slice(0, 300)); }
const prev = $('Quitar repetidas').first().json;
const porLink = new Map(prev.lista.map((n) => [n.link, n]));
const candidatas = (out.candidatas || []).filter((c) => porLink.has(c.link)).slice(0, 3)
  .map((c, i) => Object.assign({}, porLink.get(c.link), { por_que: c.por_que, orden: i }));
return [{ json: { publicar: Boolean(out.publicar) && candidatas.length > 0, motivo: out.motivo || (candidatas.length ? '' : 'Gemini no eligió ninguna noticia de la lista.'), candidatas } }];`
    },
    position: [2400, 300]
  },
  output: [{ publicar: true, motivo: '', candidatas: [{ fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', resumen: 'Resumen', por_que: 'x', orden: 0 }] }]
});

const valePublicar = ifElse({
  version: 2.3,
  config: {
    name: '¿Vale la pena publicar?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.publicar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [2640, 300]
  }
});

const avisoNoPublicar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aviso: no vale la pena',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
$getWorkflowStaticData('global').ultimoDia = cfg.hoyCR;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
return [{ json: {
  from: cfg.remitente,
  to: [cfg.avisoA],
  subject: 'Noticias IA: hoy no se publicó',
  html: '<p>Hoy no se publicó ninguna nota. Motivo: ' + esc($input.first().json.motivo) + '</p><p style="color:#777">Noticias revisadas: ' + $('Quitar repetidas').first().json.lista.length + '.</p>',
} }];`
    },
    position: [2880, 700]
  },
  output: [{ from: 'x', to: ['y'], subject: 's', html: 'h' }]
});

const candidatas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Candidatas',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `return $input.first().json.candidatas.map((c) => ({ json: c }));`
    },
    position: [2880, 200]
  },
  output: [{ fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', resumen: 'Resumen', por_que: 'x', orden: 0 }]
});

const leerPagina = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Leer página de la fuente',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.link }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [
        { name: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
        { name: 'Accept', value: 'text/html,application/xhtml+xml' }
      ] },
      options: { timeout: 20000, response: { response: { responseFormat: 'text', outputPropertyName: 'html' } } }
    },
    onError: 'continueRegularOutput',
    position: [3120, 200]
  },
  output: [{ html: '<html><body><article><p>Texto</p></article></body></html>' }]
});

const textoPagina = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Texto de la página',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cands = $('Candidatas').all().map((i) => i.json);
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'").replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"').replace(/&mdash;|&#8212;/g, '—').replace(/&ndash;|&#8211;/g, '–').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\\d+);/g, (m, n) => String.fromCharCode(Number(n)));
const extraer = (html) => {
  let h = String(html || '').replace(/<(script|style|noscript|svg|nav|footer|header|aside|form|figure)[\\s\\S]*?<\\/\\1>/gi, ' ');
  const zona = (h.match(/<article[\\s\\S]*?<\\/article>/i) || h.match(/<main[\\s\\S]*?<\\/main>/i) || [h])[0];
  const bloques = zona.match(/<(p|h2|h3|li)[^>]*>[\\s\\S]*?<\\/\\1>/gi) || [];
  return bloques.map((b) => decode(b.replace(/<[^>]+>/g, ' ')).replace(/\\s+/g, ' ').trim()).filter(Boolean).join('\\n\\n');
};
const palabras = (t) => t.split(/\\s+/).filter(Boolean).length;
const leidas = $input.all().map((item, i) => {
  const p = Array.isArray(item.pairedItem) ? item.pairedItem[0] : item.pairedItem;
  const c = cands[p ? p.item : i];
  const texto = item.json.error ? '' : extraer(item.json.html);
  return Object.assign({}, c, { texto, palabras: palabras(texto) });
}).sort((a, b) => a.orden - b.orden);
const primera = leidas.findIndex((c) => c.palabras >= 250);
if (primera === 0) return [{ json: { elegida: leidas[0], pendientes: [], respaldo: null } }];
const pendientes = primera === -1 ? leidas : leidas.slice(0, primera);
return [{ json: { elegida: null, pendientes, respaldo: primera === -1 ? null : leidas[primera] } }];`
    },
    position: [3360, 200]
  },
  output: [{ elegida: { fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', texto: 'Texto', palabras: 400, orden: 0 }, pendientes: [], respaldo: null }]
});

const seLeyo = ifElse({
  version: 2.3,
  config: {
    name: '¿Se leyó la mejor?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.elegida }}'), rightValue: '', operator: { type: 'object', operation: 'notEmpty', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [3600, 200]
  }
});

const pedidosLeer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedidos: leer con Gemini',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
return $input.first().json.pendientes.map((c) => ({ json: {
  candidata: c,
  url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloLectura + ':generateContent',
  body: {
    contents: [{ role: 'user', parts: [{ text: 'Lea este artículo: ' + c.link + '\\n\\nDevuelva solo el texto completo del artículo, tal como está publicado, sin menús, publicidad, comentarios ni enlaces relacionados. No lo resuma ni lo comente. Si no puede abrirlo, responda solo: NO_DISPONIBLE' }] }],
    tools: [{ url_context: {} }],
  },
} }));`
    },
    position: [3840, 400]
  },
  output: [{ candidata: { fuente: 'OpenAI', link: 'https://openai.com/index/algo', orden: 0 }, url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', body: {} }]
});

const leerConGemini = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Leer con Gemini',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 180000 }
    },
    credentials: GEMINI,
    onError: 'continueRegularOutput',
    position: [4080, 400]
  },
  output: [{ candidates: [{ content: { parts: [{ text: 'Texto del artículo' }] } }] }]
});

const textoGemini = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Texto leído por Gemini',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const pedidos = $('Pedidos: leer con Gemini').all().map((i) => i.json.candidata);
const leidas = $input.all().map((item, i) => {
  const p = Array.isArray(item.pairedItem) ? item.pairedItem[0] : item.pairedItem;
  const c = pedidos[p ? p.item : i];
  const parts = ((item.json.candidates || [])[0] || {}).content?.parts || [];
  const texto = parts.filter((x) => !x.thought).map((x) => x.text || '').join('').trim();
  const ok = texto && !texto.includes('NO_DISPONIBLE');
  return Object.assign({}, c, { texto: ok ? texto : '', palabras: ok ? texto.split(/\\s+/).filter(Boolean).length : 0 });
}).sort((a, b) => a.orden - b.orden);
const elegida = leidas.find((c) => c.palabras >= 250) || $('Texto de la página').first().json.respaldo || null;
return [{ json: { elegida } }];`
    },
    position: [4320, 400]
  },
  output: [{ elegida: { fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', texto: 'Texto', palabras: 400, orden: 0 } }]
});

const geminiLeyo = ifElse({
  version: 2.3,
  config: {
    name: '¿Se pudo leer alguna?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.elegida }}'), rightValue: '', operator: { type: 'object', operation: 'notEmpty', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [4560, 400]
  }
});

const avisoNoSeLeyo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aviso: no se pudo leer',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
$getWorkflowStaticData('global').ultimoDia = cfg.hoyCR;
const cands = $('Candidatas').all().map((i) => i.json.link);
return [{ json: {
  from: cfg.remitente,
  to: [cfg.avisoA],
  subject: 'Noticias IA: hoy no se publicó',
  html: '<p>Hoy no se publicó ninguna nota: no se pudo leer el texto completo de ninguna de las noticias elegidas.</p><p style="color:#777">' + cands.join('<br>') + '</p>',
} }];`
    },
    position: [4800, 600]
  },
  output: [{ from: 'x', to: ['y'], subject: 's', html: 'h' }]
});

const pedidoRedactar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: redactar',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const c = $input.first().json.elegida;
const NL = '\\n';
const fuente = { fuente: c.fuente, titulo: c.titulo, link: c.link, texto: String(c.texto).slice(0, 60000) };
const prompt = [
  'Usted escribe la nota diaria de noticias de IA de Bralto, firmada por Alejandro Aguilar, CEO de Bralto. Los lectores son dueños de pequeñas y medianas empresas en Latinoamérica, no técnicos.',
  '',
  'Escriba una nota ORIGINAL en español neutro de Latinoamérica, tratando al lector de usted, sobre esta noticia.',
  'Fuente: ' + fuente.fuente + ' (' + fuente.link + ')',
  'Título original: ' + fuente.titulo,
  '',
  'Texto de la fuente:',
  '"""',
  fuente.texto,
  '"""',
  '',
  'Reglas:',
  '1) El cuerpo tiene entre 430 y 560 palabras. Empieza contando qué pasó, en 2 o 3 párrafos. Después va el subtítulo "## Por qué importa" y después "## Qué significa para su negocio", con ideas concretas que un dueño de negocio pueda aplicar.',
  '2) Use solo datos que estén en la fuente. No invente cifras, fechas, nombres, citas ni opiniones de terceros. Incluya pocos datos: solo los centrales de la noticia. Omita cálculos, plazos, porcentajes y detalles legales o técnicos secundarios; si menciona uno, debe decir exactamente lo mismo que la fuente.',
  '3) Prohibido copiar frases de la fuente: escriba todo con sus propias palabras, nunca más de 5 palabras seguidas iguales a la fuente y sin citas textuales.',
  '4) Formato: solo párrafos separados por una línea en blanco y los dos subtítulos con "## ". Sin listas, viñetas, negritas, cursivas, links, emojis ni HTML.',
  '5) El título es claro y concreto, sin sensacionalismo, de hasta 90 caracteres, con mayúscula solo al inicio y en nombres propios.',
  '6) El resumen tiene 1 o 2 oraciones, entre 110 y 180 caracteres, y dice por qué le importa a un negocio.',
  '7) Nunca mencione GoHighLevel, HighLevel ni GHL. No mencione a Bralto ni ofrezca servicios.',
  '8) escena_imagen: describa EN INGLÉS una escena visual editorial y abstracta que represente el tema (objetos, luz, materiales), sin texto, sin logos, sin pantallas con interfaces y sin personas reconocibles. imagen_alt: describa esa misma escena en español, en una oración de hasta 150 caracteres.',
].join(NL);
const esquema = {
  type: 'OBJECT',
  properties: { titulo: { type: 'STRING' }, resumen: { type: 'STRING' }, cuerpo: { type: 'STRING' }, imagen_alt: { type: 'STRING' }, escena_imagen: { type: 'STRING' } },
  required: ['titulo', 'resumen', 'cuerpo', 'imagen_alt', 'escena_imagen'],
};
return [{ json: {
  fuente,
  prompt,
  esquema,
  url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloTexto + ':generateContent',
  body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: esquema } },
} }];`
    },
    position: [4800, 200]
  },
  output: [{ fuente: { fuente: 'OpenAI', titulo: 'Una noticia', link: 'https://openai.com/index/algo', texto: 'Texto' }, prompt: 'p', esquema: {}, url: 'u', body: {} }]
});

const redactar = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Redactar en español',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [5040, 200]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a","escena_imagen":"e"}' }] } }] }]
});

const leerBorrador = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer borrador',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const f = $('Pedido: redactar').first().json.fuente;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let b;
try { b = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al redactar: ' + texto.slice(0, 300)); }
const borrador = { titulo: b.titulo, resumen: b.resumen, cuerpo: b.cuerpo, imagen_alt: b.imagen_alt };
const NL = '\\n';
const revisar = [
  'Compare esta nota con su fuente y encuentre problemas. Es un problema: (a) cada cifra, fecha, nombre, producto o afirmación que no esté respaldada por la fuente; (b) cualquier frase casi literal de la fuente; (c) cualquier mención de GoHighLevel, HighLevel o GHL; (d) promesas de resultados exagerados. Las ideas de la sección "Qué significa para su negocio" son consejos y pueden no estar en la fuente, siempre que no inventen datos. Si no hay problemas, responda ok=true y una lista vacía. Escriba cada problema en una oración, en español.',
  '',
  'Fuente:', '"""', f.texto, '"""',
  '',
  'Nota:', '"""', JSON.stringify(borrador), '"""',
].join(NL);
return [{ json: {
  borrador,
  escena: b.escena_imagen,
  validar: { idioma: 'es', borrador, fuente_url: f.link, fuente_nombre: f.fuente, fuente_texto: f.texto },
  revisar: {
    contents: [{ role: 'user', parts: [{ text: revisar }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { ok: { type: 'BOOLEAN' }, problemas: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['ok', 'problemas'] } },
  },
} }];`
    },
    position: [5280, 200]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', validar: {}, revisar: {} }]
});

const validarEs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar español',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/validar"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.validar) }}'),
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [5520, 200]
  },
  output: [{ ok: true, problemas: [] }]
});

const revisarEs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Revisar hechos',
    parameters: {
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{ $('Configuración').first().json.modeloTexto }}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Leer borrador').first().json.revisar) }}"),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [5760, 200]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"ok":true,"problemas":[]}' }] } }] }]
});

const juntarRevision = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Juntar revisión',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const b = $('Leer borrador').first().json;
const val = $('Validar español').first().json;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let rev;
try { rev = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al revisar: ' + texto.slice(0, 300)); }
const problemas = (val.problemas || []).concat(rev.ok ? [] : (rev.problemas || []).map((p) => '[hechos] ' + p));
return [{ json: { borrador: b.borrador, escena: b.escena, problemas } }];`
    },
    position: [6000, 200]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', problemas: [] }]
});

const hayProblemasEs = ifElse({
  version: 2.3,
  config: {
    name: '¿El borrador tiene problemas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.problemas.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [6240, 200]
  }
});

const pedidoReescribir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: reescribir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const r = $('Pedido: redactar').first().json;
const d = $input.first().json;
const NL = '\\n';
const prompt = r.prompt + NL + NL + 'Un primer borrador tuvo estos problemas. Escriba una versión nueva que cumpla todas las reglas. Para cada problema de hechos, elimine esa afirmación o escríbala exactamente como la dice la fuente; no agregue datos nuevos:' + NL + d.problemas.map((p) => '- ' + p).join(NL) + NL + NL + 'Borrador anterior:' + NL + JSON.stringify(d.borrador);
return [{ json: { url: r.url, body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: r.esquema } } } }];`
    },
    position: [6480, 0]
  },
  output: [{ url: 'u', body: {} }]
});

const reescribir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Reescribir en español',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [6720, 0]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a","escena_imagen":"e"}' }] } }] }]
});

const leerReescritura = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer reescritura',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const f = $('Pedido: redactar').first().json.fuente;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let b;
try { b = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al reescribir: ' + texto.slice(0, 300)); }
const borrador = { titulo: b.titulo, resumen: b.resumen, cuerpo: b.cuerpo, imagen_alt: b.imagen_alt };
const revisar = JSON.parse(JSON.stringify($('Leer borrador').first().json.revisar));
const viejo = JSON.stringify($('Leer borrador').first().json.borrador);
revisar.contents[0].parts[0].text = revisar.contents[0].parts[0].text.replace(viejo, JSON.stringify(borrador));
return [{ json: {
  borrador,
  escena: b.escena_imagen,
  validar: { idioma: 'es', borrador, fuente_url: f.link, fuente_nombre: f.fuente, fuente_texto: f.texto },
  revisar,
} }];`
    },
    position: [6960, 0]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', validar: {}, revisar: {} }]
});

const validarEs2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar español otra vez',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/validar"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.validar) }}'),
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [7200, 0]
  },
  output: [{ ok: true, problemas: [] }]
});

const revisarEs2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Revisar hechos otra vez',
    parameters: {
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{ $('Configuración').first().json.modeloTexto }}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Leer reescritura').first().json.revisar) }}"),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [7440, 0]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"ok":true,"problemas":[]}' }] } }] }]
});

const juntarRevision2 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Juntar segunda revisión',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const b = $('Leer reescritura').first().json;
const val = $('Validar español otra vez').first().json;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let rev;
try { rev = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al revisar otra vez: ' + texto.slice(0, 300)); }
const problemas = (val.problemas || []).concat(rev.ok ? [] : (rev.problemas || []).map((p) => '[hechos] ' + p));
return [{ json: { borrador: b.borrador, escena: b.escena, problemas } }];`
    },
    position: [7680, 0]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', problemas: [] }]
});

const sigueProblemasEs = ifElse({
  version: 2.3,
  config: {
    name: '¿Sigue con problemas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.problemas.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [7920, 0]
  }
});

const detenerEs = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'No pasó la revisión',
    parameters: { errorType: 'errorMessage', errorMessage: expr('La nota en español no pasó la revisión ni después de reescribirla: {{ $json.problemas.join(" | ") }}') },
    position: [8160, -150]
  },
  output: [{}]
});

const pedidoTraducir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: traducir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const f = $('Pedido: redactar').first().json.fuente;
const d = $input.first().json;
const NL = '\\n';
const prompt = [
  'Traduzca esta nota al inglés de Estados Unidos, con un tono natural y periodístico para dueños de negocio.',
  'Reglas: mayúscula solo al inicio y en nombres propios, también en el título; los subtítulos son exactamente "## Why it matters" y "## What it means for your business"; no agregue ni quite datos; el mismo formato (párrafos separados por una línea en blanco, sin listas, negritas ni links); el resumen tiene entre 100 y 180 caracteres; nunca mencione GoHighLevel, HighLevel ni GHL.',
  'La fuente original está en inglés: no reproduzca sus frases. Si su traducción coincide con la fuente en 6 palabras seguidas o más, reformúlela con otras palabras.',
  '',
  'Nota en español:', JSON.stringify(d.borrador),
  '',
  'Texto de la fuente original (solo para no copiarlo):', '"""', f.texto, '"""',
].join(NL);
const esquema = { type: 'OBJECT', properties: { titulo: { type: 'STRING' }, resumen: { type: 'STRING' }, cuerpo: { type: 'STRING' }, imagen_alt: { type: 'STRING' } }, required: ['titulo', 'resumen', 'cuerpo', 'imagen_alt'] };
return [{ json: {
  es: d.borrador,
  escena: d.escena,
  prompt,
  esquema,
  url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloTexto + ':generateContent',
  body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: esquema } },
} }];`
    },
    position: [8400, 200]
  },
  output: [{ es: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', prompt: 'p', esquema: {}, url: 'u', body: {} }]
});

const traducir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Traducir al inglés',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [8640, 200]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a"}' }] } }] }]
});

const leerTraduccion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer traducción',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const f = $('Pedido: redactar').first().json.fuente;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let t;
try { t = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al traducir: ' + texto.slice(0, 300)); }
const en = { titulo: t.titulo, resumen: t.resumen, cuerpo: t.cuerpo, imagen_alt: t.imagen_alt };
return [{ json: { en, validar: { idioma: 'en', borrador: en, fuente_url: f.link, fuente_nombre: f.fuente, fuente_texto: f.texto } } }];`
    },
    position: [8880, 200]
  },
  output: [{ en: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, validar: {} }]
});

const validarEn = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar inglés',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/validar"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.validar) }}'),
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [9120, 200]
  },
  output: [{ ok: true, problemas: [] }]
});

const juntarEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Juntar validación del inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `return [{ json: { en: $('Leer traducción').first().json.en, problemas: $input.first().json.problemas || [] } }];`
    },
    position: [9360, 200]
  },
  output: [{ en: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, problemas: [] }]
});

const hayProblemasEn = ifElse({
  version: 2.3,
  config: {
    name: '¿El inglés tiene problemas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.problemas.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [9600, 200]
  }
});

const pedidoCorregirEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: corregir inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const t = $('Pedido: traducir').first().json;
const d = $input.first().json;
const NL = '\\n';
const prompt = t.prompt + NL + NL + 'Una primera traducción tuvo estos problemas. Escriba una versión nueva que los corrija y que cumpla todas las reglas:' + NL + d.problemas.map((p) => '- ' + p).join(NL) + NL + NL + 'Traducción anterior:' + NL + JSON.stringify(d.en);
return [{ json: { url: t.url, body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: t.esquema } } } }];`
    },
    position: [9840, 0]
  },
  output: [{ url: 'u', body: {} }]
});

const corregirEn = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Corregir inglés',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [10080, 0]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a"}' }] } }] }]
});

const leerCorreccionEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer inglés corregido',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const f = $('Pedido: redactar').first().json.fuente;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let t;
try { t = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al corregir el inglés: ' + texto.slice(0, 300)); }
const en = { titulo: t.titulo, resumen: t.resumen, cuerpo: t.cuerpo, imagen_alt: t.imagen_alt };
return [{ json: { en, validar: { idioma: 'en', borrador: en, fuente_url: f.link, fuente_nombre: f.fuente, fuente_texto: f.texto } } }];`
    },
    position: [10320, 0]
  },
  output: [{ en: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, validar: {} }]
});

const validarEn2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar inglés otra vez',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/validar"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.validar) }}'),
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [10560, 0]
  },
  output: [{ ok: true, problemas: [] }]
});

const juntarEn2 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Juntar segunda validación del inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `return [{ json: { en: $('Leer inglés corregido').first().json.en, problemas: $input.first().json.problemas || [] } }];`
    },
    position: [10800, 0]
  },
  output: [{ en: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, problemas: [] }]
});

const sigueProblemasEn = ifElse({
  version: 2.3,
  config: {
    name: '¿El inglés sigue con problemas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.problemas.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [11040, 0]
  }
});

const detenerEn = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'El inglés no pasó la revisión',
    parameters: { errorType: 'errorMessage', errorMessage: expr('La traducción no pasó la revisión ni después de corregirla: {{ $json.problemas.join(" | ") }}') },
    position: [11280, -150]
  },
  output: [{}]
});

const pedidoImagen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: imagen',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const t = $('Pedido: traducir').first().json;
const prompt = 'Editorial cover image, 16:9. ' + t.escena + ' Style: dark near-black background (#060607), cinematic soft lighting with a neon orange (#ff6d28) accent light, frosted liquid-glass surfaces, minimal composition with generous empty space in the lower-right corner, premium tech aesthetic, photorealistic 3D render. Strictly no text, letters, numbers, logos, brand marks, user interface screenshots or recognizable faces.';
return [{ json: {
  es: t.es,
  en: $input.first().json.en,
  url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloImagen + ':generateContent',
  body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '2K' } } },
} }];`
    },
    position: [11520, 200]
  },
  output: [{ es: {}, en: {}, url: 'u', body: {} }]
});

const generarImagen = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Generar imagen',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 5,
    waitBetweenTries: 5000,
    position: [11760, 200]
  },
  output: [{ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }] } }] }]
});

const sacarImagen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Sacar imagen',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const img = parts.find((p) => p.inlineData && p.inlineData.data);
if (!img) throw new Error('Nano Banana Pro no devolvió una imagen: ' + JSON.stringify($input.first().json).slice(0, 400));
return [{ json: { imagen: img.inlineData.data, mime: img.inlineData.mimeType || 'image/png' } }];`
    },
    position: [12000, 200]
  },
  output: [{ imagen: 'iVBORw0KGgo=', mime: 'image/png' }]
});

const imagenArchivo = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Imagen a archivo',
    parameters: { operation: 'toBinary', sourceProperty: 'imagen', binaryPropertyName: 'data', options: { mimeType: expr('{{ $json.mime }}'), fileName: 'portada' } },
    position: [12240, 200]
  },
  output: [{}]
});

const achicarImagen = node({
  type: 'n8n-nodes-base.editImage',
  version: 1,
  config: {
    name: 'Achicar a 1600×900',
    parameters: { operation: 'resize', dataPropertyName: 'data', width: 1600, height: 900, resizeOption: 'minimumArea', options: { format: 'jpeg', quality: 90 } },
    position: [12480, 200]
  },
  output: [{}]
});

const imagenTexto = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: {
    name: 'Imagen a base64',
    parameters: { operation: 'binaryToPropery', binaryPropertyName: 'data', destinationKey: 'imagen_base64' },
    position: [12720, 200]
  },
  output: [{ imagen_base64: '/9j/4AAQ' }]
});

const armarPublicacion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Armar publicación',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const p = $('Pedido: imagen').first().json;
const f = $('Pedido: redactar').first().json.fuente;
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
return [{ json: { cuerpo: {
  es: p.es,
  en: p.en,
  fuente_url: f.link,
  fuente_nombre: f.fuente,
  fuente_texto: f.texto,
  imagen_base64: $input.first().json.imagen_base64,
  estado: hoy < cfg.ensayoHasta ? 'oculta' : 'publicada',
} } }];`
    },
    position: [12960, 200]
  },
  output: [{ cuerpo: {} }]
});

const publicar = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Publicar en bralto.io',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.cuerpo) }}'),
      options: { timeout: 120000 }
    },
    credentials: BRALTO,
    position: [13200, 200]
  },
  output: [{ id: 'id', slug: 's', estado: 'oculta', titulo_es: 't', url_es: 'u', url_en: 'u', vista_previa: 'v', accion: { publicar: 'a' } }]
});

const avisoPublicada = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aviso: nota lista',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
$getWorkflowStaticData('global').ultimoDia = cfg.hoyCR;
const r = $input.first().json;
const p = $('Pedido: imagen').first().json;
const f = $('Pedido: redactar').first().json.fuente;
const caidos = $('Quitar repetidas').first().json.caidos;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ensayo = r.estado === 'oculta';
const boton = (href, texto, solido) => '<a href="' + href + '" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;' + (solido ? 'background:#ff6d28;color:#0a0a0a' : 'border:1px solid #999;color:#111') + '">' + texto + '</a>';
const partes = [
  '<p style="color:#777">' + (ensayo ? 'Ensayo: la nota está guardada pero oculta. Revísela y publíquela si está bien.' : 'La nota de hoy ya está publicada en bralto.io.') + '</p>',
  '<h2 style="margin:0 0 8px">' + esc(r.titulo_es) + '</h2>',
  '<p>' + esc(p.es.resumen) + '</p>',
  '<p>' + (ensayo ? boton(r.vista_previa, 'Ver la vista previa', false) + boton(r.accion.publicar, 'Publicar', true) : boton(r.url_es, 'Ver la nota', false) + boton(r.accion.ocultar, 'Ocultar', true)) + '</p>',
  '<p style="color:#777">Fuente: ' + esc(f.fuente) + ' · <a href="' + f.link + '">' + esc(f.link) + '</a><br>English: <a href="' + r.url_en + '">' + esc(r.url_en) + '</a></p>',
];
if (caidos.length) partes.push('<p style="color:#777">Feeds que no respondieron hoy: ' + caidos.join(', ') + '.</p>');
return [{ json: { from: cfg.remitente, to: [cfg.avisoA], subject: (ensayo ? 'Ensayo: ' : 'Nueva nota: ') + r.titulo_es, html: partes.join('\\n') } }];`
    },
    position: [13440, 200]
  },
  output: [{ from: 'x', to: ['y'], subject: 's', html: 'h' }]
});

const enviarAviso = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Enviar aviso con Resend',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json) }}'),
      options: { timeout: 30000 }
    },
    credentials: RESEND,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [13680, 600]
  },
  output: [{ id: 'email-id' }]
});

export default workflow('noticias-ia-diarias', 'Bralto · Noticias IA diarias')
  .add(cadaDia)
  .to(configuracion.to(listaFeeds.to(leerFeed.to(ultimas24.to(notasUsadas.to(quitarRepetidas.to(hayNoticias
    .onTrue(pedidoElegir.to(elegir.to(leerEleccion.to(valePublicar
      .onTrue(candidatas.to(leerPagina.to(textoPagina.to(seLeyo
        .onTrue(pedidoRedactar)
        .onFalse(pedidosLeer.to(leerConGemini.to(textoGemini.to(geminiLeyo
          .onTrue(pedidoRedactar)
          .onFalse(avisoNoSeLeyo.to(enviarAviso))))))))))
      .onFalse(avisoNoPublicar.to(enviarAviso))))))
    .onFalse(avisoSinNoticias.to(enviarAviso)))))))))
  .add(pedidoRedactar)
  .to(redactar.to(leerBorrador.to(validarEs.to(revisarEs.to(juntarRevision.to(hayProblemasEs
    .onTrue(pedidoReescribir.to(reescribir.to(leerReescritura.to(validarEs2.to(revisarEs2.to(juntarRevision2.to(sigueProblemasEs
      .onTrue(detenerEs)
      .onFalse(pedidoTraducir))))))))
    .onFalse(pedidoTraducir)))))))
  .add(pedidoTraducir)
  .to(traducir.to(leerTraduccion.to(validarEn.to(juntarEn.to(hayProblemasEn
    .onTrue(pedidoCorregirEn.to(corregirEn.to(leerCorreccionEn.to(validarEn2.to(juntarEn2.to(sigueProblemasEn
      .onTrue(detenerEn)
      .onFalse(pedidoImagen)))))))
    .onFalse(pedidoImagen))))))
  .add(pedidoImagen)
  .to(generarImagen.to(sacarImagen.to(imagenArchivo.to(achicarImagen.to(imagenTexto.to(armarPublicacion.to(publicar.to(avisoPublicada.to(enviarAviso)))))))));
