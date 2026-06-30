# Post spec

```js
export default {
  slug: '01-claude-propuestas',
  pillar: 'herramientas',
  slides: [
    { type:'cover', aiPrompt:'<receta IA con {sujeto}>', pill:'herramientas · IA',
      headline:'...', accent:'10 min', subtitle:'...' },
    { type:'interior', pill:'paso 1', heading:'...', headingAccent:'...',
      cards:[{kind:'good',title,body},{kind:'bad',title,body},{kind:'plain',title,body}] },
    { type:'prompt-showcase', pill:'prompt', aiPromptForGrid:['<p1>','<p2>','<p3>','<p4>'], promptText:'...' },
    { type:'closing', headline:'...', ctaLines:['...'], handle:'@bralto' },
  ],
}
```

- La numeración de slide (`1/N`) la calcula el renderizador.
- `cover` y `closing` aceptan `aiPrompt` opcional → generan base IA con Nano Banana Pro.
- `prompt-showcase` genera una imagen IA por cada entrada de `aiPromptForGrid` (máx 4).
- `kind` de card: `good` (badge verde ✓), `bad` (badge rojo ✗), `plain` (sin badge).
