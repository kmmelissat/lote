import { textos } from "@/lib/textos";
import { enlaceFacebook, enlaceTiktok, facebookDe, tiktokDe } from "../enlaces";
import { IconoFacebook, IconoInstagram, IconoTiktok } from "./IconosRedes";

const pegatina =
  "inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:rotate-0 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

/** Las redes de la tienda como stickers con su usuario a la vista, cada uno pegado con su giro. Sin redes no se dibuja nada. */
export function RedesTienda({ instagram, facebook, tiktok }: { instagram: string | null; facebook: string | null; tiktok: string | null }) {
  const ig = instagram?.trim().replace(/^@/, "");
  const fb = enlaceFacebook(facebook);
  const tk = enlaceTiktok(tiktok);
  const fbUsuario = facebookDe(facebook ?? "");
  const redes = [
    ig && { href: `https://www.instagram.com/${ig}`, nombre: "Instagram", texto: `@${ig}`, icono: <IconoInstagram />, fondo: "bg-rosa", giro: "-rotate-2" },
    fb && { href: fb, nombre: "Facebook", texto: fbUsuario.includes("/") || fbUsuario.includes("?") ? "Facebook" : fbUsuario, icono: <IconoFacebook />, fondo: "bg-celeste", giro: "rotate-1" },
    tk && { href: tk, nombre: "TikTok", texto: `@${tiktokDe(tiktok ?? "")}`, icono: <IconoTiktok />, fondo: "bg-limon", giro: "-rotate-1" },
  ].filter((r) => !!r);
  if (!redes.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm font-bold">{textos.vitrina.seguinos}</span>
      {redes.map((r) => (
        <a key={r.nombre} href={r.href} target="_blank" rel="noreferrer" aria-label={`${r.nombre}: ${r.texto}`} className={`${pegatina} ${r.fondo} ${r.giro}`}>
          <span className="size-5 shrink-0 [&>svg]:size-5">{r.icono}</span>
          <span className="max-w-40 truncate">{r.texto}</span>
        </a>
      ))}
    </div>
  );
}
