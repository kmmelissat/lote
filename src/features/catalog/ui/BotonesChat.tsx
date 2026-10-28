import { textos } from "@/lib/textos";
import { enlaceInstagram, enlaceWhatsApp } from "../enlaces";

const base =
  "inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro px-6 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

// "Pedir por chat": abre WhatsApp con el mensaje armado o el chat de Instagram.
// El botón principal lleva el color de la tienda (--color-teal); el otro va blanco.
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
        <a href={wa} target="_blank" rel="noreferrer" className={`${base} bg-teal text-white`}>
          {textos.vitrina.pedirWhatsApp}
        </a>
      )}
      {ig && (
        <a href={ig} target="_blank" rel="noreferrer" className={`${base} bg-white text-teal-oscuro`}>
          {textos.vitrina.pedirInstagram}
        </a>
      )}
    </div>
  );
}
