import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL("https://bralto.io"),
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
    description: "Respuesta instantánea, calificación automática y agendas que se llenan solas con IA.",
    url: "https://bralto.io",
    siteName: "Bralto",
    type: "website",
    locale: "es_ES",
    images: [
      {
        url: "https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/695872f4035c3a84ae6136da.jpg",
        width: 1200,
        height: 630,
        alt: "Bralto – Agentes de Inteligencia Artificial para Ventas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentes de IA 24/7 para Ventas y Leads | Bralto",
    description: "Agendas llenas, leads calificados y ventas automáticas con IA.",
    images: ["https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/695872f4035c3a84ae6136da.jpg"],
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
      <body style={{ backgroundColor: "#000000" }}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
