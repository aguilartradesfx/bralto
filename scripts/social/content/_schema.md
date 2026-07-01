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

## Bloques de interior (`blocks`)

- `{ type:'card', kind:'good|bad|plain', title, body }`
- `{ type:'prompt', text, note? }` — caja mono oscura. **Prompts sí, código no** (no se copia de una imagen).
- `{ type:'metric', value:'10 min → 2 min', label }`
- `{ type:'shot', src:'scripts/social/assets/xxx.png', caption? }` — se escala solo para caber.

## Convenciones de copy (IMPORTANTE)

- **Siempre ejemplos concretos.** El lector debe pensar "ah, ya sé qué poner".
- **Placeholders entre corchetes** `[TU AGENCIA]`, `[CLÍNICA VETERINARIA]`, `[CLIENTE]` →
  el motor los **resalta solos en naranja** en cards y prompts. Úsalos para marcar
  lo que la persona debe reemplazar.
- Mantén los `[PLACEHOLDERS]` cortos para que no se corten al hacer wrap de línea.
