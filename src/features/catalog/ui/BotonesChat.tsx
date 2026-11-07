import type { EnlaceExterno } from "../enlaces";
import { textos } from "@/lib/textos";
import { IconoFacebook, IconoInstagram, IconoTiktok, IconoWhatsApp } from "./IconosRedes";
import { enlaceFacebook, enlaceInstagram, enlaceTiktok, enlaceWhatsApp } from "../enlaces";

// WhatsApp lleva su verde para que se reconozca al instante; plano, sin la sombra dura, para no competir con lo demás.
const whatsappVerde =
  "inline-flex h-12 items-center whitespace-nowrap justify-center gap-2 rounded-full border border-[#1faa53] bg-white px-6 font-bold text-[#14803c] transition-colors duration-150 hover:bg-[#25D366]/10";
// Secundario: contorno y más bajo, para que "Agregar al carrito" sea lo principal de la página.
const whatsappSecundario =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-teal-oscuro/30 bg-white px-4 text-sm font-bold text-teal-oscuro transition-colors hover:bg-accion/20";
const amplio =
  "inline-flex h-12 items-center whitespace-nowrap justify-center gap-2 rounded-full border border-teal-oscuro/30 bg-white px-6 font-bold text-teal-oscuro transition-colors hover:bg-accion/20";
const icono =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-teal-oscuro/30 bg-white text-teal-oscuro transition-colors hover:bg-accion/20";

// "Pedir por chat": abre WhatsApp con el mensaje armado, o Instagram / Facebook.
// El botón principal lleva el color de la tienda (--color-teal); las redes van como ícono.
export function BotonesChat({
  whatsapp,
  instagram,
  facebook,
  tiktok,
  mensaje,
  discreto,
  secundario,
  ancho,
}: {
  whatsapp: string | null;
  instagram: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  mensaje: string;
  /** En vez de botones, una línea con enlaces: "¿Preferís escribirle a Velvet? WhatsApp · Instagram". Se pasa el nombre de la tienda. */
  discreto?: string;
  /** WhatsApp como botón de contorno, más chico */
  secundario?: boolean;
  /** WhatsApp se estira y las redes quedan al lado (o abajo si no caben) */
  ancho?: boolean;
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
  ].filter((r): r is { href: EnlaceExterno; etiqueta: string } => !!r);
  if (!redes.length) return null;
  if (discreto) {
    return (
      <p className="text-sm text-texto-2">
        {textos.vitrina.compra.escribirle(discreto)}{" "}
        {redes.map((r, i) => (
          <span key={r.etiqueta}>
            {i > 0 && " · "}
            <a href={r.href} target="_blank" rel="noreferrer" className="font-bold text-(--store-accent) underline">
              {r.etiqueta}
            </a>
          </span>
        ))}
      </p>
    );
  }
  // Un solo canal que no es WhatsApp: botón ancho con etiqueta, no un ícono suelto
  if (redes.length === 1 && !wa) {
    const unico = ig
      ? { href: ig, texto: textos.vitrina.pedirInstagram, icono: <IconoInstagram /> }
      : fb
        ? { href: fb, texto: textos.vitrina.pedirFacebook, icono: <IconoFacebook /> }
        : { href: tk!, texto: textos.vitrina.pedirTiktok, icono: <IconoTiktok /> };
    return (
      <a href={unico.href} target="_blank" rel="noreferrer" className={`${secundario ? whatsappSecundario : amplio} w-full`}>
        <span className="size-5 shrink-0 [&>svg]:size-5">{unico.icono}</span>
        {unico.texto}
      </a>
    );
  }
  // WhatsApp con una sola red más: el ícono va al lado del botón; con varias, WhatsApp a todo el ancho y las redes juntas debajo
  const unaRed = [ig, fb, tk].filter(Boolean).length === 1;
  return (
    <div className={`flex items-center gap-3 ${ancho && unaRed ? "" : "flex-wrap"}`}>
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className={`${secundario ? whatsappSecundario : whatsappVerde} ${ancho ? (unaRed ? "min-w-0 flex-1" : "w-full") : ""}`}>
          <IconoWhatsApp className={secundario ? "size-4 shrink-0 text-[#1faa53]" : "size-5 shrink-0 text-[#1faa53]"} />
          {textos.vitrina.pedirWhatsApp}
        </a>
      )}
      {(ig || fb || tk) && (
        <div className="flex items-center gap-3">
      {ig && (
        <a href={ig} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirInstagram} title={textos.vitrina.pedirInstagram} className={secundario ? icono.replace("size-12", "size-10") : icono}>
          <IconoInstagram />
        </a>
      )}
      {fb && (
        <a href={fb} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirFacebook} title={textos.vitrina.pedirFacebook} className={secundario ? icono.replace("size-12", "size-10") : icono}>
          <IconoFacebook />
        </a>
      )}
      {tk && (
        <a href={tk} target="_blank" rel="noreferrer" aria-label={textos.vitrina.pedirTiktok} title={textos.vitrina.pedirTiktok} className={secundario ? icono.replace("size-12", "size-10") : icono}>
          <IconoTiktok />
        </a>
      )}
        </div>
      )}
    </div>
  );
}
