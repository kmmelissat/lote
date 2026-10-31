import { enlaceFacebook, enlaceTiktok, facebookDe, tiktokDe } from "../enlaces";
import { IconoFacebook, IconoInstagram, IconoTiktok } from "./IconosRedes";

const enlace =
  "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-teal-oscuro transition-colors hover:bg-teal-fondo";

/** Las redes de la tienda como enlaces planos, con el ícono y su usuario a la vista. Sin redes no se dibuja nada. */
export function RedesTienda({ instagram, facebook, tiktok }: { instagram: string | null; facebook: string | null; tiktok: string | null }) {
  const ig = instagram?.trim().replace(/^@/, "");
  const fb = enlaceFacebook(facebook);
  const tk = enlaceTiktok(tiktok);
  const fbUsuario = facebookDe(facebook ?? "");
  const redes = [
    ig && { href: `https://www.instagram.com/${ig}`, nombre: "Instagram", texto: `@${ig}`, icono: <IconoInstagram /> },
    fb && { href: fb, nombre: "Facebook", texto: fbUsuario.includes("/") || fbUsuario.includes("?") ? "Facebook" : fbUsuario, icono: <IconoFacebook /> },
    tk && { href: tk, nombre: "TikTok", texto: `@${tiktokDe(tiktok ?? "")}`, icono: <IconoTiktok /> },
  ].filter((r) => !!r);
  if (!redes.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      {redes.map((r) => (
        <a key={r.nombre} href={r.href} target="_blank" rel="noreferrer" aria-label={`${r.nombre}: ${r.texto}`} className={enlace}>
          <span className="size-5 shrink-0 text-teal [&>svg]:size-5">{r.icono}</span>
          <span className="max-w-40 truncate">{r.texto}</span>
        </a>
      ))}
    </div>
  );
}
