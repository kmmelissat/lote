import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.ajustes.titulo };

type Opcion = { href: string; icono: NombreIcono; tono: string; titulo: string; texto: string; soloDuena?: boolean; soloGestion?: boolean };

const GRUPOS: { titulo: string; opciones: Opcion[] }[] = [
  {
    titulo: textos.ajustes.grupos.negocio,
    opciones: [
      { href: "/ajustes/categorias", icono: "caja", tono: "bg-rosa-palido", titulo: textos.productos.categoriasPanel.enlace, texto: textos.productos.categoriasPanel.enlaceTexto },
      { href: "/ajustes/resenas", icono: "estrella", tono: "bg-limon", titulo: textos.resenas.enlace, texto: textos.resenas.enlaceTexto },
      { href: "/ajustes/equipo", icono: "clientes", tono: "bg-teal-fondo", titulo: textos.equipo.enlace, texto: textos.equipo.enlaceTexto, soloDuena: true },
      { href: "/ajustes/exportar", icono: "subir", tono: "bg-teal-fondo", titulo: textos.exportar.enlace, texto: textos.exportar.enlaceTexto, soloGestion: true },
    ],
  },
  {
    titulo: textos.ajustes.grupos.ayuda,
    opciones: [{ href: textos.ayuda.ruta, icono: "info", tono: "bg-limon", titulo: textos.ayuda.enlace, texto: textos.ayuda.enlaceTexto }],
  },
];

const TARJETA_OPCION =
  "group flex min-h-20 items-center gap-4 rounded-[20px] border-2 border-teal-oscuro bg-superficie p-4 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura-chica";

export default async function Page() {
  const { negocio } = await negocioActual();
  const esDuena = negocio.rol === "duena";
  return (
    <>
      <PageHeader titulo={textos.ajustes.titulo} descripcion={textos.ajustes.descripcion} />
      <div className="flex flex-col gap-6">
        {/* Lo principal de Ajustes, a lo ancho: pagos y envíos viven adentro de Mi tienda */}
        {esDuena && (
          <Link
            href="/ajustes/tienda"
            className="group flex min-h-24 items-center gap-4 rounded-[20px] border-2 border-teal-oscuro bg-mango p-5 shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-superficie text-teal-oscuro">
              <Icon nombre="tienda" className="size-7" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-lg font-bold">{textos.ajustes.tienda.enlace}</span>
              <span className="text-sm text-teal-oscuro/80">{textos.ajustes.tienda.enlaceTexto}</span>
            </span>
            <Icon nombre="diagonal" className="size-5 shrink-0 text-teal-oscuro" />
          </Link>
        )}
        {GRUPOS.map((g) => {
          const opciones = g.opciones.filter((o) => (!o.soloDuena || esDuena) && (!o.soloGestion || negocio.puedeGestionar));
          if (!opciones.length) return null;
          return (
            <section key={g.titulo} aria-labelledby={`ajustes-${g.titulo}`} className="flex flex-col gap-2">
              <h2 id={`ajustes-${g.titulo}`} className="text-sm font-bold uppercase tracking-wide text-texto-2">
                {g.titulo}
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {opciones.map((o) => (
                  // Si una tarjeta queda sola en su fila, ocupa las dos columnas en vez de dejar un hueco
                  <li key={o.href} className="md:last:odd:col-span-2">
                    <Link href={o.href} className={TARJETA_OPCION}>
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro ${o.tono}`}>
                        <Icon nombre={o.icono} className="size-6" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-bold">{o.titulo}</span>
                        <span className="text-sm text-texto-2">{o.texto}</span>
                      </span>
                      <Icon nombre="diagonal" className="size-5 shrink-0 text-texto-2 transition-colors group-hover:text-teal-oscuro" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className="mt-6 md:hidden">
        <CerrarSesion variante="completo" />
      </div>
    </>
  );
}
