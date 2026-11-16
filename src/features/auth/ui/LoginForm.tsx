"use client";

import { useSearchParams } from "next/navigation";
import { rutaSegura } from "../rutaSegura";
import { textos } from "@/lib/textos";
import { PanelAcceso } from "./PanelAcceso";

const t = textos.acceso;

export function LoginForm() {
  const params = useSearchParams();
  // Viene de una invitación o de una vitrina: se recuerda a dónde volver mientras la persona entra.
  const destino = rutaSegura(params.get("next"));

  return <PanelAcceso destino={destino} errorInicial={params.get("error") ? t.errorCallback : ""} />;
}
