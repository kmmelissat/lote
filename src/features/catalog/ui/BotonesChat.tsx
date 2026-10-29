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
  discreto,
}: {
  whatsapp: string | null;
  instagram: string | null;
  mensaje: string;
  /** En vez de dos botones, una línea con enlaces: "¿Preferís escribirle a Velvet? WhatsApp · Instagram". Se pasa el nombre de la tienda. */
  discreto?: string;
}) {
  const wa = enlaceWhatsApp(whatsapp, mensaje);
  const ig = enlaceInstagram(instagram);
  if (!wa && !ig) return null;
  if (discreto) {
    return (
      <p className="text-sm text-texto-2">
        {textos.vitrina.compra.escribirle(discreto)}{" "}
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="font-bold text-teal underline">
            WhatsApp
          </a>
        )}
        {wa && ig && " · "}
        {ig && (
          <a href={ig} target="_blank" rel="noreferrer" className="font-bold text-teal underline">
            Instagram
          </a>
        )}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className={`${base} bg-teal text-white`}>
          {textos.vitrina.pedirWhatsApp}
        </a>
      )}
      {/* Instagram es la opción de segunda: un ícono chico, no un segundo botón del mismo peso */}
      {ig && (
        <a
          href={ig}
          target="_blank"
          rel="noreferrer"
          aria-label={textos.vitrina.pedirInstagram}
          title={textos.vitrina.pedirInstagram}
          className="flex size-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro transition-colors hover:bg-limon"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
        </a>
      )}
    </div>
  );
}
