// HTML del Contexto (contextoHtml); estilos en .plan-md de app/globals.css
export function Markdown({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`plan-md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
