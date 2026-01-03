import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentes de IA 24/7 para Ventas y Leads | Bralto",
  description:
    "Automatiza ventas, califica leads y agenda citas 24/7 con agentes de inteligencia artificial. Bralto convierte tráfico en clientes sin equipos humanos.",
  icons: {
    icon: "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69587f1c748303fb4eb95de3.png",
    shortcut: "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69587f1c748303fb4eb95de3.png",
    apple: "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69587f1c748303fb4eb95de3.png",
  },
  openGraph: {
    title: "Agentes de IA 24/7 para Ventas y Leads | Bralto",
    description:
      "Respuesta instantánea, calificación automática y agendas que se llenan solas con IA.",
    url: "https://bralto.io",
    siteName: "Bralto",
    images: [
      {
        url: "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6959a8186e700e3586117f24.jpg",
        width: 1200,
        height: 630,
        alt: "Bralto – Agentes de Inteligencia Artificial para Ventas",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentes de IA 24/7 para Ventas y Leads | Bralto",
    description:
      "Agendas llenas, leads calificados y ventas automáticas con IA.",
    images: [
      "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6959a8186e700e3586117f24.jpg",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="dark"
      suppressHydrationWarning
      style={{ backgroundColor: "#000000" }}
    >
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KTGZ86BC');`,
        }}
      />
      {/* End Google Tag Manager */}

      <body style={{ backgroundColor: "#000000" }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KTGZ86BC"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {children}
      </body>
    </html>
  );
}
