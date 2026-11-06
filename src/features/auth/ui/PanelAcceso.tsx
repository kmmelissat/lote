"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { createClient } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";
import { COOKIE_DESTINO } from "../rutaSegura";

const t = textos.acceso;

const botonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const botonClaro = `${botonBase} bg-white`;

/**
 * Entrar con Google o con un enlace al correo. Lo usan la página de entrar y la ventana del Marketplace.
 * `destino` es a dónde se vuelve después (ya validado con `rutaSegura`); sin él, a Inicio.
 */
export function PanelAcceso({ destino, errorInicial = "" }: { destino: string | null; errorInicial?: string }) {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"libre" | "enviando" | "enviado">("libre");
  const [error, setError] = useState(errorInicial);

  const redirectTo = () => {
    if (destino) document.cookie = `${COOKIE_DESTINO}=${encodeURIComponent(destino)}; path=/; max-age=900; samesite=lax`;
    return `${window.location.origin}/auth/callback`;
  };

  async function conGoogle() {
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setError(t.errorGoogle);
  }

  async function conCorreo(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEstado("enviando");
    const { error } = await createClient().auth.signInWithOtp({ email: correo.trim(), options: { emailRedirectTo: redirectTo() } });
    if (error) {
      setError(t.errorEnlace);
      setEstado("libre");
    } else {
      setEstado("enviado");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="flex flex-col gap-4">
        <div role="status" className="flex flex-col gap-2 rounded-[18px] border-2 border-teal-oscuro bg-limon p-4">
          <h2 className="text-lg font-bold">{t.revisaTitulo}</h2>
          <p>{t.enviadoA(correo.trim())}</p>
          <p className="text-sm text-teal-oscuro/80">{t.mismoNavegador}</p>
        </div>
        <button type="button" onClick={() => setEstado("libre")} className={`${botonClaro} px-6`}>
          {t.otroCorreo}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className={`${botonClaro} px-6`} onClick={conGoogle}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.2v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.2 6.6l4 3.1c1-2.9 3.7-4.9 6.8-4.9z" />
        </svg>
        {t.google}
      </button>

      <div className="flex items-center gap-3 text-sm text-texto-2">
        <span className="h-0.5 flex-1 rounded-full bg-teal-oscuro/15" />
        {t.separador}
        <span className="h-0.5 flex-1 rounded-full bg-teal-oscuro/15" />
      </div>

      <form data-formulario="login_correo" onSubmit={conCorreo} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Field etiqueta={t.correo} type="email" name="correo" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <p className="text-sm text-texto-2">{t.correoAyuda}</p>
        </div>
        <button type="submit" disabled={estado === "enviando"} className={`${botonBase} bg-mango px-6`}>
          {estado === "enviando" ? t.enviando : t.enviar}
        </button>
      </form>

      <div className="min-h-5">
        <MensajeError>{error}</MensajeError>
      </div>
    </div>
  );
}
