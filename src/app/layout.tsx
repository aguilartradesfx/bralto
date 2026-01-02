import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentes de IA - Transformamos tu negocio con IA 24/7",
  description: "Respuesta instantánea 24/7, calificación automática de leads y conversión que nunca duerme. Tu equipo potenciado con inteligencia artificial enterprise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
