import { textos } from "@/lib/textos";
import { IconoFacebook, IconoInstagram, IconoTiktok } from "./IconosRedes";
import { enlaceFacebook, enlaceInstagram, enlaceTiktok, enlaceWhatsApp } from "../enlaces";

const base =
  "inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro px-6 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";
const icono =
  "flex size-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro transition-colors hover:bg-limon";

// "Pedir por chat": abre WhatsApp con el mensaje armado, o Instagram / Facebook.
// El botón principal lleva el color de la tienda (--color-teal); las redes van como ícono.
export function BotonesChat({
  whatsapp,
  instagram,
  facebook,
  tiktok,
  mensaje,
  discreto,
}: {
  whatsapp: string | null;
  instagram: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  mensaje: string;
  /** En vez de botones, una línea con enlaces: "¿Preferís escribirle a Velvet? WhatsApp · Instagram". Se pasa el nombre de la tienda. */
  discreto?: string;
}) {
  const wa = enlaceWhatsApp(whatsapp, mensaje);
  const ig = enlaceInstagram(instagram);
  const fb = enlaceFacebook(facebook ?? null);
  const tk = enlaceTiktok(tiktok ?? null);
  const redes = [
    wa && { href: wa, etiqueta: "WhatsApp" },
    ig && { href: ig, etiqueta: "Instagram" },
    fb && { href: fb, etiqueta: "Facebook" },
    tk && { href: tk, etiqueta: "TikTok" },
  ].filter((r): r is { href: string; etiqueta: string } => !!r);
  if (!redes.length) return null;
  if (discreto) {
    return (
      <p className="text-sm text-texto-2">
        {textos.vitrina.compra.escribirle(discreto)}{" "}
        {redes.map((r, i) => (
          <span key={r.etiqueta}>
            {i > 0 && " · "}
            <a href={r.href} target="_blank" rel="noreferrer" className="font-bold text-teal underline">
              {r.etiqueta}
            </a>
          </span>
        ))}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className={`${base} bg-accion text-accion-texto`}>
          {textos.vitrina.pedirWhatsApp}
        </a>
      )}
      {ig && (
        <a href={ig} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirInstagram} title={textos.vitrina.pedirInstagram} className={icono}>
          <IconoInstagram />
        </a>
      )}
      {fb && (
        <a href={fb} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirFacebook} title={textos.vitrina.pedirFacebook} className={icono}>
          <IconoFacebook />
        </a>
      )}
      {tk && (
        <a href={tk} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirTiktok} title={textos.vitrina.pedirTiktok} className={icono}>
          <IconoTiktok />
        </a>
      )}
    </div>
  );
}
