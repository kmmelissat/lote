import { textos } from "@/lib/textos";
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
        </a>
      )}
      {fb && (
        <a href={fb} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirFacebook} title={textos.vitrina.pedirFacebook} className={icono}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
            <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z" />
          </svg>
        </a>
      )}
      {tk && (
        <a href={tk} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirTiktok} title={textos.vitrina.pedirTiktok} className={icono}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
            <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.3V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.8V9.4a6.3 6.3 0 1 0 5.4 6.3V8.9a8.2 8.2 0 0 0 4.8 1.5V7a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        </a>
      )}
    </div>
  );
}
