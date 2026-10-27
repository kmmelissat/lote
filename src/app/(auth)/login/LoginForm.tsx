"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.acceso;

export function LoginForm() {
  const errorUrl = useSearchParams().get("error");
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"libre" | "enviando" | "enviado">("libre");
  const [error, setError] = useState(errorUrl ? t.errorCallback : "");

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function conGoogle() {
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(t.errorGoogle);
  }

  async function conCorreo(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEstado("enviando");
    const { error } = await createClient().auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(t.errorEnlace);
      setEstado("libre");
    } else {
      setEstado("enviado");
    }
  }

  if (estado === "enviado") {
    return (
      <div role="status" className="rounded-tarjeta border border-borde bg-superficie p-5">
        <h2 className="font-bold">{t.revisaTitulo}</h2>
        <p className="mt-1 text-texto-2">{t.revisaTexto}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button type="button" onClick={conGoogle}>
        {t.google}
      </Button>

      <div className="flex items-center gap-3 text-sm text-texto-2">
        <span className="h-px flex-1 bg-borde" />
        {t.separador}
        <span className="h-px flex-1 bg-borde" />
      </div>

      <form onSubmit={conCorreo} className="flex flex-col gap-4">
        <Field
          etiqueta={t.correo}
          type="email"
          name="correo"
          autoComplete="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Button type="submit" variante="secundario" disabled={estado === "enviando"}>
          {estado === "enviando" ? t.enviando : t.enviar}
        </Button>
      </form>

      <p role="alert" className="min-h-5 text-sm text-error">
        {error}
      </p>
    </div>
  );
}
