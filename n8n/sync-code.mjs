// Sube a n8n el jsCode de los nodos Code tal como está en el archivo del workflow, sin tocar
// el resto (credenciales, ajustes). Uso: node n8n/sync-code.mjs n8n/noticias-ia-diarias.js <workflowId>
// Lee N8N_API_KEY de .env.local. Para cambios de estructura (nodos o conexiones) usar update_workflow.
import fs from 'node:fs'

const [file, id] = process.argv.slice(2)
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
)
const src = fs.readFileSync(file, 'utf8')
const re = /name: '([^']+)',\s*parameters: \{\s*mode: 'runOnceForAllItems',\s*language: 'javaScript',\s*jsCode: (`(?:\\[\s\S]|[^`\\])*`)/g
const codigo = new Map([...src.matchAll(re)].map((m) => [m[1], eval(m[2])]))

const url = `https://bralto-io-n8n.z49dor.easypanel.host/api/v1/workflows/${id}`
const headers = { 'X-N8N-API-KEY': env.N8N_API_KEY, 'Content-Type': 'application/json' }
const w = await (await fetch(url, { headers })).json()
let cambiados = 0
for (const n of w.nodes) {
  if (codigo.has(n.name) && n.parameters.jsCode !== codigo.get(n.name)) {
    n.parameters.jsCode = codigo.get(n.name)
    cambiados++
  }
}
const faltan = [...codigo.keys()].filter((k) => !w.nodes.some((n) => n.name === k))
if (faltan.length) throw new Error('Nodos del archivo que no están en n8n: ' + faltan.join(', '))
const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ name: w.name, nodes: w.nodes, connections: w.connections, settings: w.settings }) })
console.log(res.status, 'nodos Code actualizados:', cambiados, 'de', codigo.size)
