// El cuerpo de una nota: párrafos separados por línea en blanco y subtítulos "## ".
// Se pinta como texto (React lo escapa); no se interpreta ningún otro markdown.
export type BodyBlock = { type: 'h2' | 'p'; text: string }

export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = []
  for (const chunk of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    let para: string[] = []
    const flush = () => {
      if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
    for (const raw of chunk.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (line.startsWith('## ')) {
        flush()
        blocks.push({ type: 'h2', text: line.slice(3).trim() })
      } else para.push(line)
    }
    flush()
  }
  return blocks
}
