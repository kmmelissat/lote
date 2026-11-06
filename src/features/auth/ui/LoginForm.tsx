"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Globo } from "@/components/ui/Globo";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { rutaSegura } from "../rutaSegura";
import { textos } from "@/lib/textos";
import { PanelAcceso } from "./PanelAcceso";

const t = textos.acceso;

export function LoginForm() {
  const params = useSearchParams();
  // Viene de una invitación o de una vitrina: se recuerda a dónde volver mientras la persona entra.
  const destino = rutaSegura(params.get("next"));

  return (
    <div className="relative pt-20 md:pt-24">
      {/* Como en la landing: Lotito se asoma por detrás de la tarjeta y habla en su globo */}
      <div className="absolute right-3 top-0 z-0 flex items-end gap-2 md:right-6">
        <Globo className="mb-7 -rotate-2 whitespace-nowrap motion-safe:animate-entra">{t.globo}</Globo>
        <LotitoMas nombre="asoma" className="w-36 motion-safe:animate-asomar md:w-44" />
      </div>
      <Card className="relative z-10 p-5 shadow-dura md:p-6">
        <PanelAcceso destino={destino} errorInicial={params.get("error") ? t.errorCallback : ""} />
      </Card>
    </div>
  );
}
