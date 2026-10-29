import { Card } from "@/components/ui/Card";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { AvisoDeStock } from "../repositorio";

const t = textos.productos.avisos;

/** Quienes esperan este producto: cuando lo repongas, escribiles. Cada uno lleva un enlace directo a su WhatsApp. */
export function AvisosDeStock({ avisos, producto }: { avisos: AvisoDeStock[]; producto: string }) {
  if (!avisos.length) return null;
  return (
    <Card className="flex flex-col gap-3 border border-borde">
      <div>
        <h2 className="font-bold">{t.titulo(avisos.length)}</h2>
        <p className="text-sm text-texto-2">{t.ayuda}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {avisos.map((a) => {
          const digitos = a.contacto.replace(/\D/g, "");
          const mensaje = encodeURIComponent(t.mensaje(a.nombre.split(" ")[0], producto));
          return (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-medium">{a.nombre}</span>
                <span className="block text-sm text-texto-2">
                  {a.contacto} · {formatearFecha(a.creadoEn)}
                </span>
              </span>
              {digitos.length >= 8 && (
                <a
                  href={`https://wa.me/${digitos}?text=${mensaje}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 max-md:min-h-11 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro hover:bg-limon"
                >
                  {t.escribir}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
