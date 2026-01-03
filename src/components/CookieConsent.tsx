"use client";
import CookieConsentComponent from "react-cookie-consent";

export function CookieConsent() {
  return (
    <CookieConsentComponent
      location="bottom"
      buttonText="Aceptar cookies"
      declineButtonText="Rechazar"
      enableDeclineButton
      cookieName="bralto_cookie_consent"
      style={{
        background: "rgba(11, 15, 20, 0.95)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(0, 217, 255, 0.2)",
        padding: "20px",
        alignItems: "center",
      }}
      buttonStyle={{
        background: "linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)",
        color: "#000",
        fontSize: "14px",
        fontWeight: "600",
        padding: "12px 32px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#fff",
        fontSize: "14px",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
      }}
      expires={365}
      onAccept={() => {
        console.log("Cookies aceptadas");
        // Aquí puedes activar Google Analytics, Meta Pixel, etc.
      }}
      onDecline={() => {
        console.log("Cookies rechazadas");
        // Aquí puedes desactivar tracking
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#fff" }}>
          🍪 Utilizamos cookies
        </p>
        <p style={{ margin: "0", fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.5" }}>
          Utilizamos cookies propias y de terceros para analizar el tráfico, mejorar tu experiencia y mostrar publicidad personalizada. 
          Puedes aceptar todas las cookies o rechazarlas. Consulta nuestra{" "}
          <a href="/politica-privacidad" style={{ color: "#00D9FF", textDecoration: "underline" }}>
            Política de Privacidad
          </a>.
        </p>
      </div>
    </CookieConsentComponent>
  );
}
