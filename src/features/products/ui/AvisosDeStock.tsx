import { estiloBotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { EncabezadoTarjeta } from "@/components/ui/EncabezadoTarjeta";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { AvisoDeStock } from "../repositorio";

const t = textos.productos.avisos;

/** Quienes esperan este producto: cuando lo repongas, escribiles. Cada uno lleva un enlace directo a su WhatsApp. */
export function AvisosDeStock({ avisos, producto }: { avisos: AvisoDeStock[]; producto: string }) {
  if (!avisos.length) return null;
  return (
    <section className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <EncabezadoTarjeta icono="campana" color="amarillo" titulo={t.titulo(avisos.length)} ayuda={t.ayuda} />
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
                  className={estiloBotonPunch("secundario")}
                >
                  {t.escribir}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
