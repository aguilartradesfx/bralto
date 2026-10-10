import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const GEMINI = { googlePalmApi: { id: 'fEELApbTANN4LwJY', name: 'Gemini · Bralto' } };
const BRALTO = { httpHeaderAuth: { id: 'eaOrVVhFOjJKtvsK', name: 'Bralto · Noticias API' } };
const RESEND = { httpHeaderAuth: { id: 'OiG9o9VRxoXp4Hjr', name: 'Resend · Bralto' } };
const OPENAI = { openAiApi: { id: 'rAg6bPdLSbIgocvv', name: 'OpenAI · Bralto' } };

const cadaDia = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cada día a las 12:00 y 12:45',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 12, triggerAtMinute: 0 }, { field: 'days', daysInterval: 1, triggerAtHour: 12, triggerAtMinute: 45 }] } },
    position: [0, 400]
  },
  output: [{}]
});

const relleno = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Relleno (fecha pasada)',
    parameters: { httpMethod: 'POST', path: 'articulos-relleno', authentication: 'headerAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpHeaderAuth: { id: 'eaOrVVhFOjJKtvsK', name: 'Bralto · Noticias API' } },
    position: [0, 650]
  },
  output: [{ body: { fecha: '2026-10-05', tipo: 'guia' } }]
});

const configuracion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Configuración',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const entrada = $input.first().json || {};
const pedida = entrada.body && entrada.body.fecha;
const fecha = /^\\d{4}-\\d{2}-\\d{2}$/.test(pedida || '') ? pedida : null;
const relleno = Boolean(fecha);
const hoyCR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
if (!relleno && $getWorkflowStaticData('global').ultimoDia === hoyCR) return [];
const dia = relleno ? fecha : hoyCR;
const TIPOS = ['guia', 'herramientas', 'proveedores'];
const pedido = entrada.body && entrada.body.tipo;
const tipo = TIPOS.includes(pedido) ? pedido : TIPOS[Math.floor(Date.parse(dia + 'T00:00:00Z') / 864e5) % 3];
return [{ json: {
  hoyCR,
  relleno,
  tipo,
  publicadaEn: relleno ? new Date(Date.parse(fecha + 'T18:00:00Z') + Math.floor(Math.random() * 50) * 60000).toISOString() : null,
  base: 'https://www.bralto.io',
  ensayoHasta: '2026-10-13',
  avisoA: 'aguilartradesfx@gmail.com',
  remitente: 'Bralto Noticias <noticias@send.bralto.io>',
  modeloTexto: 'gemini-3.5-flash',
  modeloImagen: 'gemini-3-pro-image',
  modeloImagenRespaldo: 'gemini-3.1-flash-image',
  modeloEditor: 'chat-latest',
  modeloRespaldo: 'gpt-6.1-sol',
  ficha: 'Bralto (bralto.io) construye e integra sistemas a la medida que automatizan la operación comercial de negocios establecidos: sitio web, CRM, agentes de IA, automatizaciones, pagos y reportes, todo conectado en una sola plataforma. Tiene sede en Costa Rica y trabaja con negocios de América y Europa. Su fundador y CEO es Alejandro Aguilar.\\nLo que construye, por capas: Atraer (anuncios en Meta y Google con CAPI y eventos de ventas reales, para que el algoritmo aprenda de ventas y no de clics); Captar (sitio, landing pages, formularios y chats que convierten visitas en contactos); Atender (agentes de IA en WhatsApp, Instagram, web y correo que califican, cotizan, agendan y pasan cada venta al CRM); Gestionar clientes (CRM con el historial de cada cliente, su pipeline y seguimiento automático); Automatizar la operación (cotizaciones, aprobaciones, documentos y tareas del equipo); Accesos a la medida (portales y logins para clientes, equipo o socios).\\nServicios: sitios web, automatización de procesos, agentes de IA, producción de contenido, campañas, sistemas internos y asesoría.\\nPlataforma: todo lo que construye queda en la plataforma del cliente (CRM, conversaciones, pipeline, automatizaciones, agenda, pagos y reportes) y reemplaza herramientas que se pagan por separado, como HubSpot, Mailchimp, ClickFunnels, ManyChat, Calendly o Typeform.\\nLa IA es una pieza del sistema, no un chatbot suelto: se entrena con la información del negocio y le pasa al equipo lo que se sale de lo que sabe.\\nGarantía: si en el primer mes después de activar el sistema no genera leads calificados, Bralto sigue trabajando sin costo hasta lograrlo.\\nCómo empezar: un diagnóstico de 30 minutos para entender el negocio y decir por dónde empezar; se agenda en bralto.io.\\nCasos reales (use solo estos datos; no hay cifras de resultados publicadas, así que no invente porcentajes, montos, plazos ni testimonios):\\n- Nanku, restaurante: sitio nuevo con reservas integradas, plataforma para clientes, pedidos y comunicaciones, WhatsApp, Instagram, Messenger y web en un solo lugar, agente de IA que atiende y cierra reservas 24/7, recordatorios y seguimiento automáticos y producción audiovisual mensual.\\n- Ecoviva, inmobiliaria: sitio de alto impacto y un agente de IA con acceso a todas las propiedades, que asesora sobre características, precios, ubicación y disponibilidad, agenda visitas desde el chat y avisa al equipo.\\n- TravelCore, turismo: portal 4 en 1 con rutas para clientes corporativos, vacacionales y reservas, motor de agenda de tours en tiempo real y confirmaciones, recordatorios y seguimiento automáticos.\\n- AO Liquidation Warehouse, mayorista de liquidaciones en Costa Rica: sitio que comunica autoridad, catálogo de lotes por categorías, solicitud de cotización directa a ventas y captación de leads B2B.',
} }];`
    },
    position: [240, 400]
  },
  output: [{ relleno: false, tipo: 'guia', base: 'https://www.bralto.io', ficha: 'f', modeloEditor: 'chat-latest' }]
});

const recientes = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Artículos ya publicados',
    parameters: {
      method: 'GET',
      url: expr("{{ $('Configuración').first().json.base }}/api/noticias/recientes"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: { timeout: 30000 }
    },
    credentials: BRALTO,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [480, 400]
  },
  output: [{ fuentes: [], titulos: [], articulos: ['Un artículo viejo'] }]
});

const pedidoEscribir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: escribir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const previos = $input.first().json.articulos || [];
const NL = '\\n';
const sistema = 'Usted escribe los artículos del blog de Bralto, firmados por Alejandro Aguilar, CEO de Bralto. Los lectores son dueños de pequeñas y medianas empresas en Latinoamérica: gente ocupada y práctica que no es técnica. Escribe con un tono conversacional y cercano, tratando al lector de usted, con oraciones cortas y ejemplos concretos. Su objetivo es que el lector termine pensando en su propio negocio y vea a Bralto como el socio indicado, sin sonar a anuncio.';
const POR_TIPO = {
  guia: 'Tipo: guía práctica o caso. Elija un problema concreto de un tipo de negocio (responder WhatsApp a tiempo, dar seguimiento a cotizaciones, agendar citas, cobrar, ordenar el equipo, saber qué anuncio vende) y explique cómo se resuelve con automatización e IA, paso a paso, con subtítulos "## ". Si le sirve, use uno de los casos reales de la ficha como ejemplo, solo con sus datos. Cierre contando cómo lo implementa Bralto.',
  herramientas: 'Tipo: ranking de herramientas. Un título como "Las N herramientas de IA que ..." para un tipo de negocio o un objetivo (vender por WhatsApp, atender clientes, crear contenido, ordenar la operación). Entre 7 y 9 herramientas reales y conocidas, cada una en su propio subtítulo "## N. Nombre" con un párrafo: qué hace y a qué negocio le sirve. Descripciones generales y correctas, sin precios ni cifras. Cierre con la idea de que el reto no es tener herramientas sino conectarlas, y que Bralto las integra en un solo sistema.',
  proveedores: 'Tipo: comparativa de opciones para implementar IA y automatización en un negocio, con Bralto en el puesto 1. Use subtítulos "## N. Opción". El 1 es "un socio que integre todo el sistema: Bralto"; después, tipos genéricos de proveedor (agencia de marketing tradicional, freelancer, agencia de desarrollo a la medida, plataformas para hacerlo usted mismo, consultora grande, un chatbot genérico, el conocido que sabe de computadoras), con pros y contras honestos de cada uno. No nombre agencias ni empresas competidoras reales. Deje claro con naturalidad que quien escribe es Bralto (por ejemplo: "Sí, nos pusimos primeros, y esta es la razón").',
};
const usuario = [
  'Escriba el artículo de hoy para el blog de Bralto.',
  '',
  POR_TIPO[cfg.tipo],
  '',
  'Reglas que no se pueden romper:',
  '1) El cuerpo tiene entre 600 y 800 palabras. Empiece con un gancho concreto (una situación que el lector reconozca). Solo párrafos separados por una línea en blanco y subtítulos "## ". Sin listas, viñetas, negritas, cursivas, links, emojis ni HTML.',
  '2) Todo lo que diga de Bralto, sus servicios y sus clientes tiene que estar en la ficha de abajo. No invente clientes, testimonios, resultados, cifras, plazos ni precios.',
  '3) No use estadísticas ni estudios con números (porcentajes, montos, encuestas). Hable en términos generales.',
  '4) No mencione el precio del diagnóstico ni hable de reembolsos. Nunca mencione GoHighLevel, HighLevel ni GHL.',
  '5) Cierre invitando a agendar un diagnóstico de 30 minutos con Bralto, sin escribir links.',
  '6) Título de hasta 90 caracteres, con mayúscula solo al inicio y en nombres propios, sin sensacionalismo. Resumen de 1 o 2 oraciones, entre 110 y 180 caracteres.',
  '7) escena_imagen: describa EN INGLÉS una escena visual editorial y abstracta que represente el tema (objetos, luz, materiales), sin texto, logos, pantallas con interfaces ni personas reconocibles. imagen_alt: describa esa escena en español, en una oración de hasta 150 caracteres.',
  '',
  'No repita el tema ni el enfoque de estos artículos recientes:',
  previos.length ? previos.map((t) => '- ' + t).join(NL) : '(ninguno)',
  '',
  'Ficha de Bralto:',
  cfg.ficha,
].join(NL);
const esquema = {
  type: 'object',
  properties: { titulo: { type: 'string' }, resumen: { type: 'string' }, cuerpo: { type: 'string' }, imagen_alt: { type: 'string' }, escena_imagen: { type: 'string' } },
  required: ['titulo', 'resumen', 'cuerpo', 'imagen_alt', 'escena_imagen'],
  additionalProperties: false,
};
return [{ json: {
  sistema,
  usuario,
  esquema,
  body: { model: cfg.modeloEditor, messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }], response_format: { type: 'json_schema', json_schema: { name: 'articulo', strict: true, schema: esquema } } },
} }];`
    },
    position: [720, 400]
  },
  output: [{ sistema: 's', usuario: 'u', esquema: {}, body: {} }]
});

const escribir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Escribir con GPT',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [960, 400]
  },
  output: [{ choices: [{ message: { content: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a","escena_imagen":"e"}' } }] }]
});

const leerArticulo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer artículo',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT no quiso escribir el artículo: ' + msg.refusal);
let b;
try { b = JSON.parse(msg.content || ''); } catch (e) { throw new Error('GPT no devolvió JSON al escribir: ' + String(msg.content).slice(0, 300)); }
const borrador = { titulo: b.titulo, resumen: b.resumen, cuerpo: b.cuerpo, imagen_alt: b.imagen_alt };
const NL = '\\n';
const revisar = [
  'Revise este artículo del blog de Bralto contra la ficha de Bralto y encuentre problemas. Es un problema: (a) cualquier dato sobre Bralto, sus servicios, clientes, casos, precios, plazos o resultados que no esté en la ficha; (b) estadísticas, encuestas o cifras específicas sobre el mercado (porcentajes, montos, fechas); (c) agencias o empresas competidoras de Bralto nombradas o evaluadas; (d) promesas de resultados garantizados más allá de la garantía de la ficha; (e) cualquier mención de GoHighLevel, HighLevel o GHL, del precio del diagnóstico o de reembolsos; (f) descripciones falsas de herramientas de terceros. Las herramientas conocidas (ChatGPT, WhatsApp Business, HubSpot, etc.) se pueden mencionar con descripciones generales correctas, y las opiniones y consejos son válidos. Si no hay problemas, responda ok=true y una lista vacía. Escriba cada problema en una oración, en español.',
  '',
  'Ficha de Bralto:', '"""', cfg.ficha, '"""',
  '',
  'Artículo:', '"""', JSON.stringify(borrador), '"""',
].join(NL);
return [{ json: {
  borrador,
  escena: b.escena_imagen,
  validar: { idioma: 'es', tipo: 'articulo', borrador },
  revisar: {
    contents: [{ role: 'user', parts: [{ text: revisar }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { ok: { type: 'BOOLEAN' }, problemas: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['ok', 'problemas'] } },
  },
} }];`
    },
    position: [1200, 400]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', validar: {}, revisar: {} }]
});

const validarEs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar artículo',
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
    position: [1440, 400]
  },
  output: [{ ok: true, problemas: [] }]
});

const revisarEs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Revisar datos',
    parameters: {
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{ $('Configuración').first().json.modeloTexto }}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Leer artículo').first().json.revisar) }}"),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [1680, 400]
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
      jsCode: `const b = $('Leer artículo').first().json;
const val = $('Validar artículo').first().json;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let rev;
try { rev = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al revisar: ' + texto.slice(0, 300)); }
const problemas = (val.problemas || []).concat(rev.ok ? [] : (rev.problemas || []).map((p) => '[datos] ' + p));
return [{ json: { borrador: b.borrador, escena: b.escena, problemas } }];`
    },
    position: [1920, 400]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', problemas: [] }]
});

const hayProblemasEs = ifElse({
  version: 2.3,
  config: {
    name: '¿El artículo tiene problemas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.problemas.length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
        combinator: 'and'
      }
    },
    position: [2160, 400]
  }
});

const pedidoCorregir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: corregir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const e = $('Pedido: escribir').first().json;
const d = $input.first().json;
const NL = '\\n';
const usuario = e.usuario + NL + NL + 'Esta versión tuvo estos problemas. Corríjalos y cumpla todas las reglas. Para cada problema de datos, elimine esa afirmación o déjela exactamente como dice la ficha; no agregue datos nuevos:' + NL + d.problemas.map((p) => '- ' + p).join(NL) + NL + NL + 'Versión con problemas:' + NL + JSON.stringify(Object.assign({}, d.borrador, { escena_imagen: d.escena }));
return [{ json: { body: { model: e.body.model, messages: [{ role: 'system', content: e.sistema }, { role: 'user', content: usuario }], response_format: e.body.response_format } } }];`
    },
    position: [2400, 200]
  },
  output: [{ body: {} }]
});

const corregir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Corregir con GPT',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    position: [2640, 200]
  },
  output: [{ choices: [{ message: { content: '{"titulo":"t","resumen":"r","cuerpo":"c","imagen_alt":"a","escena_imagen":"e"}' } }] }]
});

const leerCorreccion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer corrección',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT no quiso corregir el artículo: ' + msg.refusal);
let b;
try { b = JSON.parse(msg.content || ''); } catch (e) { throw new Error('GPT no devolvió JSON al corregir: ' + String(msg.content).slice(0, 300)); }
const borrador = { titulo: b.titulo, resumen: b.resumen, cuerpo: b.cuerpo, imagen_alt: b.imagen_alt };
const revisar = JSON.parse(JSON.stringify($('Leer artículo').first().json.revisar));
const viejo = JSON.stringify($('Leer artículo').first().json.borrador);
const nuevo = JSON.stringify(borrador);
revisar.contents[0].parts[0].text = revisar.contents[0].parts[0].text.replace(viejo, () => nuevo);
return [{ json: { borrador, escena: b.escena_imagen, validar: { idioma: 'es', tipo: 'articulo', borrador }, revisar } }];`
    },
    position: [2880, 200]
  },
  output: [{ borrador: { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }, escena: 'e', validar: {}, revisar: {} }]
});

const validarEs2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Validar otra vez',
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
    position: [3120, 200]
  },
  output: [{ ok: true, problemas: [] }]
});

const revisarEs2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Revisar datos otra vez',
    parameters: {
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{ $('Configuración').first().json.modeloTexto }}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Leer corrección').first().json.revisar) }}"),
      options: { timeout: 300000 }
    },
    credentials: GEMINI,
    retryOnFail: true,
    maxTries: 4,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [3360, 200]
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
      jsCode: `const b = $('Leer corrección').first().json;
const val = $('Validar otra vez').first().json;
const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let rev;
try { rev = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al revisar: ' + texto.slice(0, 300)); }
const problemas = (val.problemas || []).concat(rev.ok ? [] : (rev.problemas || []).map((p) => '[datos] ' + p));
return [{ json: { borrador: b.borrador, escena: b.escena, problemas } }];`
    },
    position: [3600, 200]
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
    position: [3840, 200]
  }
});

const detenerEs = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'No pasó la revisión',
    parameters: { errorType: 'errorMessage', errorMessage: expr('El artículo no pasó la revisión ni después de corregirlo: {{ $json.problemas.join(" | ") }}') },
    position: [4080, 50]
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
const d = $input.first().json;
const NL = '\\n';
const prompt = [
  'Traduzca este artículo al inglés de Estados Unidos, con un tono natural, cercano y conversacional para dueños de negocio.',
  'Reglas: mayúscula solo al inicio y en nombres propios, también en el título y los subtítulos; traduzca cada subtítulo "## " manteniendo su número si lo tiene; no agregue ni quite datos; el mismo formato (párrafos separados por una línea en blanco, sin listas, negritas ni links); el resumen tiene entre 100 y 180 caracteres; nunca mencione GoHighLevel, HighLevel ni GHL, el precio del diagnóstico ni reembolsos.',
  '',
  'Artículo en español:', JSON.stringify(d.borrador),
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
    onError: 'continueErrorOutput',
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
      jsCode: `const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let t;
try { t = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al traducir: ' + texto.slice(0, 300)); }
const en = { titulo: t.titulo, resumen: t.resumen, cuerpo: t.cuerpo, imagen_alt: t.imagen_alt };
return [{ json: { en, validar: { idioma: 'en', tipo: 'articulo', borrador: en } } }];`
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
    onError: 'continueErrorOutput',
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
      jsCode: `const parts = (($input.first().json.candidates || [])[0] || {}).content?.parts || [];
const texto = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
let t;
try { t = JSON.parse(texto); } catch (e) { throw new Error('Gemini no devolvió JSON al corregir el inglés: ' + texto.slice(0, 300)); }
const en = { titulo: t.titulo, resumen: t.resumen, cuerpo: t.cuerpo, imagen_alt: t.imagen_alt };
return [{ json: { en, validar: { idioma: 'en', tipo: 'articulo', borrador: en } } }];`
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
    parameters: { errorType: 'errorMessage', errorMessage: expr('La traducción del artículo no pasó la revisión ni después de corregirla: {{ $json.problemas.join(" | ") }}') },
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
    onError: 'continueErrorOutput',
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
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
const cuerpo = {
  tipo: 'articulo',
  es: p.es,
  en: p.en,
  imagen_base64: $input.first().json.imagen_base64,
  estado: cfg.relleno || hoy >= cfg.ensayoHasta ? 'publicada' : 'oculta',
};
if (cfg.relleno) cuerpo.publicada_en = cfg.publicadaEn;
return [{ json: { cuerpo } }];`
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
    name: 'Aviso: artículo listo',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
if (cfg.relleno) return [];
$getWorkflowStaticData('global').ultimoDia = cfg.hoyCR;
const r = $input.first().json;
const p = $('Pedido: imagen').first().json;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ensayo = r.estado === 'oculta';
const boton = (href, texto, solido) => '<a href="' + href + '" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;' + (solido ? 'background:#ff6d28;color:#0a0a0a' : 'border:1px solid #999;color:#111') + '">' + texto + '</a>';
const TIPO = { guia: 'guía', herramientas: 'ranking de herramientas', proveedores: 'comparativa de proveedores' };
const partes = [
  '<p style="color:#777">' + (ensayo ? 'Ensayo: el artículo de Bralto de hoy (' + TIPO[cfg.tipo] + ') está guardado pero oculto. Revíselo y publíquelo si está bien.' : 'El artículo de Bralto de hoy (' + TIPO[cfg.tipo] + ') ya está publicado en bralto.io.') + '</p>',
  '<h2 style="margin:0 0 8px">' + esc(r.titulo_es) + '</h2>',
  '<p>' + esc(p.es.resumen) + '</p>',
  '<p>' + (ensayo ? boton(r.vista_previa, 'Ver la vista previa', false) + boton(r.accion.publicar, 'Publicar', true) : boton(r.url_es, 'Ver el artículo', false) + boton(r.accion.ocultar, 'Ocultar', true)) + '</p>',
  '<p style="color:#777">English: <a href="' + r.url_en + '">' + esc(r.url_en) + '</a></p>',
];
return [{ json: { from: cfg.remitente, to: [cfg.avisoA], subject: (ensayo ? 'Ensayo de artículo: ' : 'Nuevo artículo: ') + r.titulo_es, html: partes.join('\\n') } }];`
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


const respaldo_revisarEs = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respaldo GPT: Revisar datos',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const pedido = $('Leer artículo').first().json.revisar;
const texto = pedido.contents.map((c) => c.parts.map((p) => p.text || '').join('')).join('\\n\\n');
const conv = (s) => {
  const t = String((s && s.type) || 'string').toLowerCase();
  if (t === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(s.properties || {})) props[k] = conv(v);
    return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
  }
  if (t === 'array') return { type: 'array', items: conv(s.items) };
  return { type: t };
};
const gc = pedido.generationConfig || {};
const body = { model: cfg.modeloRespaldo, messages: [{ role: 'user', content: texto }] };
if (gc.responseSchema) body.response_format = { type: 'json_schema', json_schema: { name: 'respuesta', strict: true, schema: conv(gc.responseSchema) } };
return [{ json: { body } }];`
    },
    position: [1680, 700]
  },
  output: [{ body: {} }]
});

const gpt_revisarEs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'GPT de respaldo: Revisar datos',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    position: [1880, 700]
  },
  output: [{ choices: [{ message: { content: '{}' } }] }]
});

const norm_revisarEs = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respuesta de respaldo: Revisar datos',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT de respaldo no respondió: ' + msg.refusal);
return [{ json: { candidates: [{ content: { parts: [{ text: msg.content || '' }] } }] } }];`
    },
    position: [2080, 700]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{}' }] } }] }]
});

const respaldo_revisarEs2 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respaldo GPT: Revisar datos otra vez',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const pedido = $('Leer corrección').first().json.revisar;
const texto = pedido.contents.map((c) => c.parts.map((p) => p.text || '').join('')).join('\\n\\n');
const conv = (s) => {
  const t = String((s && s.type) || 'string').toLowerCase();
  if (t === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(s.properties || {})) props[k] = conv(v);
    return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
  }
  if (t === 'array') return { type: 'array', items: conv(s.items) };
  return { type: t };
};
const gc = pedido.generationConfig || {};
const body = { model: cfg.modeloRespaldo, messages: [{ role: 'user', content: texto }] };
if (gc.responseSchema) body.response_format = { type: 'json_schema', json_schema: { name: 'respuesta', strict: true, schema: conv(gc.responseSchema) } };
return [{ json: { body } }];`
    },
    position: [3360, 500]
  },
  output: [{ body: {} }]
});

const gpt_revisarEs2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'GPT de respaldo: Revisar datos otra vez',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    position: [3560, 500]
  },
  output: [{ choices: [{ message: { content: '{}' } }] }]
});

const norm_revisarEs2 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respuesta de respaldo: Revisar datos otra vez',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT de respaldo no respondió: ' + msg.refusal);
return [{ json: { candidates: [{ content: { parts: [{ text: msg.content || '' }] } }] } }];`
    },
    position: [3760, 500]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{}' }] } }] }]
});

const respaldo_traducir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respaldo GPT: Traducir al inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const pedido = $('Pedido: traducir').first().json.body;
const texto = pedido.contents.map((c) => c.parts.map((p) => p.text || '').join('')).join('\\n\\n');
const conv = (s) => {
  const t = String((s && s.type) || 'string').toLowerCase();
  if (t === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(s.properties || {})) props[k] = conv(v);
    return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
  }
  if (t === 'array') return { type: 'array', items: conv(s.items) };
  return { type: t };
};
const gc = pedido.generationConfig || {};
const body = { model: cfg.modeloRespaldo, messages: [{ role: 'user', content: texto }] };
if (gc.responseSchema) body.response_format = { type: 'json_schema', json_schema: { name: 'respuesta', strict: true, schema: conv(gc.responseSchema) } };
return [{ json: { body } }];`
    },
    position: [8640, 500]
  },
  output: [{ body: {} }]
});

const gpt_traducir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'GPT de respaldo: Traducir al inglés',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    position: [8840, 500]
  },
  output: [{ choices: [{ message: { content: '{}' } }] }]
});

const norm_traducir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respuesta de respaldo: Traducir al inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT de respaldo no respondió: ' + msg.refusal);
return [{ json: { candidates: [{ content: { parts: [{ text: msg.content || '' }] } }] } }];`
    },
    position: [9040, 500]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{}' }] } }] }]
});

const respaldo_corregirEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respaldo GPT: Corregir inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const pedido = $('Pedido: corregir inglés').first().json.body;
const texto = pedido.contents.map((c) => c.parts.map((p) => p.text || '').join('')).join('\\n\\n');
const conv = (s) => {
  const t = String((s && s.type) || 'string').toLowerCase();
  if (t === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(s.properties || {})) props[k] = conv(v);
    return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
  }
  if (t === 'array') return { type: 'array', items: conv(s.items) };
  return { type: t };
};
const gc = pedido.generationConfig || {};
const body = { model: cfg.modeloRespaldo, messages: [{ role: 'user', content: texto }] };
if (gc.responseSchema) body.response_format = { type: 'json_schema', json_schema: { name: 'respuesta', strict: true, schema: conv(gc.responseSchema) } };
return [{ json: { body } }];`
    },
    position: [10080, 300]
  },
  output: [{ body: {} }]
});

const gpt_corregirEn = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'GPT de respaldo: Corregir inglés',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 300000 }
    },
    credentials: OPENAI,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    position: [10280, 300]
  },
  output: [{ choices: [{ message: { content: '{}' } }] }]
});

const norm_corregirEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Respuesta de respaldo: Corregir inglés',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const msg = (($input.first().json.choices || [])[0] || {}).message || {};
if (msg.refusal) throw new Error('GPT de respaldo no respondió: ' + msg.refusal);
return [{ json: { candidates: [{ content: { parts: [{ text: msg.content || '' }] } }] } }];`
    },
    position: [10480, 300]
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{}' }] } }] }]
});

const pedidoImagenRespaldo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pedido: imagen de respaldo',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Configuración').first().json;
const p = $('Pedido: imagen').first().json;
return [{ json: { url: 'https://generativelanguage.googleapis.com/v1beta/models/' + cfg.modeloImagenRespaldo + ':generateContent', body: p.body } }];`
    },
    position: [11760, 500]
  },
  output: [{ url: 'u', body: {} }]
});

const generarImagenRespaldo = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Generar imagen (Nano Banana 2)',
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
    position: [11960, 500]
  },
  output: [{ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: '/9j/' } }] } }] }]
});

export default workflow('articulos-bralto', 'Bralto · Artículo diario')
  .add(relleno)
  .to(configuracion)
  .add(cadaDia)
  .to(configuracion.to(recientes.to(pedidoEscribir.to(escribir.to(leerArticulo.to(validarEs.to(revisarEs.to(juntarRevision.to(hayProblemasEs
    .onTrue(pedidoCorregir.to(corregir.to(leerCorreccion.to(validarEs2.to(revisarEs2.to(juntarRevision2.to(sigueProblemasEs
      .onTrue(detenerEs)
      .onFalse(pedidoTraducir))))))))
    .onFalse(pedidoTraducir))))))))))
  .add(pedidoTraducir)
  .to(traducir.to(leerTraduccion.to(validarEn.to(juntarEn.to(hayProblemasEn
    .onTrue(pedidoCorregirEn.to(corregirEn.to(leerCorreccionEn.to(validarEn2.to(juntarEn2.to(sigueProblemasEn
      .onTrue(detenerEn)
      .onFalse(pedidoImagen)))))))
    .onFalse(pedidoImagen))))))
  .add(pedidoImagen)
  .to(generarImagen.to(sacarImagen.to(imagenArchivo.to(achicarImagen.to(imagenTexto.to(armarPublicacion.to(publicar.to(avisoPublicada.to(enviarAviso)))))))))
  .add(revisarEs.onError(respaldo_revisarEs.to(gpt_revisarEs.to(norm_revisarEs.to(juntarRevision)))))
  .add(revisarEs2.onError(respaldo_revisarEs2.to(gpt_revisarEs2.to(norm_revisarEs2.to(juntarRevision2)))))
  .add(traducir.onError(respaldo_traducir.to(gpt_traducir.to(norm_traducir.to(leerTraduccion)))))
  .add(corregirEn.onError(respaldo_corregirEn.to(gpt_corregirEn.to(norm_corregirEn.to(leerCorreccionEn)))))
  .add(generarImagen.onError(pedidoImagenRespaldo.to(generarImagenRespaldo.to(sacarImagen))));
