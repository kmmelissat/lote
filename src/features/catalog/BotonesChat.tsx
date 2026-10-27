import { textos } from "@/lib/textos";
import { enlaceInstagram, enlaceWhatsApp } from "./enlaces";

const clase =
  "inline-flex h-12 items-center justify-center rounded-full border border-borde bg-superficie px-6 font-medium text-teal hover:bg-teal-fondo";

// "Pedir por chat": abre WhatsApp con el mensaje armado o el chat de Instagram.
export function BotonesChat({
  whatsapp,
  instagram,
  mensaje,
}: {
  whatsapp: string | null;
  instagram: string | null;
  mensaje: string;
}) {
  const wa = enlaceWhatsApp(whatsapp, mensaje);
  const ig = enlaceInstagram(instagram);
  if (!wa && !ig) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className={clase}>
          {textos.vitrina.pedirWhatsApp}
        </a>
      )}
      {ig && (
        <a href={ig} target="_blank" rel="noreferrer" className={clase}>
          {textos.vitrina.pedirInstagram}
        </a>
      )}
    </div>
  );
}
