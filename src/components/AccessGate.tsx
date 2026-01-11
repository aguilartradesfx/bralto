"use client";
import { useState, useEffect } from "react";

interface AccessGateProps {
  children: React.ReactNode;
  correctCode?: string;
}

const ACCESS_STORAGE_KEY = "bralto_access_granted";

export function AccessGate({ children, correctCode = "310309" }: AccessGateProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasAccess = sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (hasAccess === "true") {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode === correctCode) {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setInputCode("");
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0E1621] border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <img
              src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
              alt="Bralto Logo"
              className="h-10 w-auto"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Acceso Restringido
          </h2>
          <p className="text-white/60 text-center mb-6 text-sm">
            Ingresa el código de acceso para continuar
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setError(false);
                }}
                placeholder="Código de acceso"
                className={`w-full px-4 py-3 bg-black/50 border ${
                  error ? "border-red-500" : "border-white/20"
                } rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500 transition-colors text-center text-lg tracking-widest`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 text-center">
                  Código incorrecto. Intenta de nuevo.
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              Acceder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
