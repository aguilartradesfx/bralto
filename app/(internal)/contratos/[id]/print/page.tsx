import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadTemplate, renderContractMarkdown } from '@/lib/contracts/render'
import { marked } from 'marked'
import type { ContractRow } from '@/types/contracts'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PrintContractPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (!contract) notFound()

  const c = contract as ContractRow

  const dataWithFirma = {
    ...c.data,
    firma: {
      ...(c.data?.firma ?? {}),
      cliente_canvas: c.signature_client_data ?? null,
      cliente_timestamp: c.signature_client_timestamp ?? null,
      bralto_canvas: c.signature_bralto_data ?? null,
      bralto_timestamp: c.signature_bralto_timestamp ?? null,
    },
  }

  const templateString = loadTemplate(c.template_version ?? 'v1')
  const markdown = renderContractMarkdown(dataWithFirma, templateString)
  const html = String(marked.parse(markdown))

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <title>{`Contrato — ${c.data?.cliente?.empresa_nombre ?? id}`}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Georgia, "Times New Roman", serif;
            color: #111;
            background: white;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { font-size: 1.1rem; font-weight: 700; text-align: center; margin: 1.5rem 0; color: #000; }
          h2 { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.75rem; color: #000; }
          h3 { font-size: 0.875rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #000; }
          p { font-size: 0.875rem; line-height: 1.75; color: #222; margin-bottom: 0.75rem; text-align: justify; }
          strong { color: #000; font-weight: 700; }
          ul, ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
          li { font-size: 0.875rem; line-height: 1.75; color: #222; margin-bottom: 0.2rem; }
          hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          td { padding: 1rem; vertical-align: top; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #222; }
          img { max-height: 64px; max-width: 220px; object-fit: contain; display: block; margin: 8px 0; }
          small { font-size: 0.75rem; color: #6b7280; }
          @media print {
            body { padding: 20px; }
            @page { margin: 2cm; size: A4; }
          }
        `}</style>
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <script dangerouslySetInnerHTML={{ __html: `window.onload = () => { window.print() }` }} />
      </body>
    </html>
  )
}
