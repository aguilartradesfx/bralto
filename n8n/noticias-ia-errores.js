import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const alFallar = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'Cuando falla Noticias IA', position: [240, 300] },
  output: [{ execution: { id: '231', url: 'https://n8n/execution/231', lastNodeExecuted: 'Redactar en español', error: { message: 'Bad request', description: 'detalle' }, mode: 'trigger' }, workflow: { id: '1', name: 'Bralto · Noticias IA diarias' } }]
});

const armarAviso = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Armar aviso de error',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const e = $input.first().json;
const ex = e.execution || {};
const nodo = ex.lastNodeExecuted || 'un paso desconocido';
const err = ex.error || {};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const partes = [
  '<p>La nota de hoy <b>no se publicó</b>. Nada quedó a medias en el sitio.</p>',
  '<p><b>Paso que falló:</b> ' + esc(nodo) + '</p>',
  '<p><b>Error:</b> ' + esc(err.message || 'sin mensaje') + '</p>',
];
if (err.description) partes.push('<pre style="white-space:pre-wrap">' + esc(String(err.description).slice(0, 3000)) + '</pre>');
if (ex.url) partes.push('<p><a href="' + ex.url + '">Ver la ejecución en n8n</a></p>');
partes.push('<p style="color:#777">Si falló la corrida de las 6:00, n8n la intenta de nuevo a las 6:45.</p>');
return [{ json: {
  from: 'Bralto Noticias <noticias@send.bralto.io>',
  to: ['aguilartradesfx@gmail.com'],
  subject: 'Noticias IA: falló «' + nodo + '»',
  html: partes.join('\\n'),
} }];`
    },
    position: [520, 300]
  },
  output: [{ from: 'Bralto Noticias <noticias@send.bralto.io>', to: ['aguilartradesfx@gmail.com'], subject: 'Noticias IA: falló «Redactar en español»', html: '<p>...</p>' }]
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
      jsonBody: expr('{{ JSON.stringify($json) }}')
    },
    credentials: { httpHeaderAuth: { id: 'OiG9o9VRxoXp4Hjr', name: 'Resend · Bralto' } },
    position: [800, 300]
  },
  output: [{ id: 'email-id' }]
});

export default workflow('noticias-ia-errores', 'Bralto · Noticias IA · errores')
  .add(alFallar)
  .to(armarAviso)
  .to(enviarAviso);
