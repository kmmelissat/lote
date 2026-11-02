"use client";

import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, FONDO_SECCION, PINTA_HOVER_SECCION, type Pestana } from "./menu";
import { AbrirVitrina, Insignia } from "./PiezasMenu";

const t = textos.nav;

/**
 * Las secciones del menú lateral en cuadros de dos en dos: cada uno con su ícono, su nombre y, si hay, su contador. El cuadro
 * de la sección activa se rellena con su color y se levanta; los demás son blancos con el ícono en su color y, al pasar el mouse,
 * se pintan de ese color a la mitad. Al final van los cuadros que salen del panel y abren en otra pestaña, con su flechita: el
 * Marketplace siempre y la vitrina para quien no tiene "Mi tienda". Recogido (`group-data-[cerrado]`) quedan solo los íconos,
 * uno debajo del otro. En el cajón del celular (`grande`) la letra es de 16 px y los cuadros son más altos.
 */
export function ListaMenu({
  items,
  ruta,
  porAtender = 0,
  urgente = false,
  slug = "",
  esDuena = false,
  grande = false,
}: {
  items: Pestana[];
  ruta: string | null;
  porAtender?: number;
  urgente?: boolean;
  slug?: string;
  esDuena?: boolean;
  /** El menú del celular: letras de 16 px e íconos más grandes */
  grande?: boolean;
}) {
  const letra = grande ? "text-base" : "text-sm";
  const icono = grande ? "size-6" : "size-5";
  const forma = `flex ${grande ? "min-h-24" : "min-h-20"} w-full flex-col justify-between gap-2 rounded-2xl border-2 border-teal-oscuro p-2.5 ${letra} font-bold text-teal-oscuro transition-[transform,background-color] group-data-[cerrado]:min-h-14 group-data-[cerrado]:items-center group-data-[cerrado]:justify-center`;

  /** El ícono dentro de su cuadrito de color, con lo que va a la derecha (el contador, o la flechita de los que abren afuera). */
  const cabecera = (nombre: NombreIcono, fondo: string, activa: boolean, derecha: React.ReactNode) => (
    <span className="flex items-start justify-between gap-1">
      <span className={`flex size-9 items-center justify-center rounded-xl border-2 border-teal-oscuro ${activa ? "bg-superficie" : fondo}`}>
        <Icon nombre={nombre} className={icono} />
      </span>
      <span className="group-data-[cerrado]:hidden">{derecha}</span>
    </span>
  );

  /** Un cuadro que sale del panel: abre en otra pestaña y nunca está "activo". */
  const externo = (clave: string, href: string, etiqueta: string, nombre: NombreIcono) => (
    <li key={clave} className="relative">
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        title={etiqueta}
        className={`${forma} bg-superficie ${PINTA_HOVER_SECCION[clave] ?? "hover:bg-limon/40"}`}
      >
        {cabecera(nombre, FONDO_SECCION[clave] ?? "bg-superficie", false, null)}
        <span className="truncate group-data-[cerrado]:hidden">{etiqueta}</span>
        <span className="sr-only">{textos.explorar.sobre.nuevaPestana}</span>
      </Link>
      {/* La flechita va arriba a la derecha, en el mismo lugar que la del botón de la vitrina en "Mi tienda": abajo chocaría con el nombre */}
      <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 flex size-10 items-center justify-center text-texto-2 group-data-[cerrado]:hidden">
        <Icon nombre="enlace" className={grande ? "size-5" : "size-4"} />
      </span>
    </li>
  );

  return (
    <ul className="grid grid-cols-2 gap-2.5 group-data-[cerrado]:grid-cols-1 [&>li:last-child:nth-child(odd)]:col-span-2 group-data-[cerrado]:[&>li:last-child:nth-child(odd)]:col-span-1">
      {items.map((p) => {
        const activa = ruta !== null && activaEn(ruta, p.href);
        const fondo = FONDO_SECCION[p.href] ?? "bg-superficie";
        return (
          <li key={p.href} className="relative">
            <Link
              href={p.href}
              aria-current={activa ? "page" : undefined}
              title={p.etiqueta}
              className={`${forma} ${activa ? `${fondo} -translate-y-0.5 shadow-dura-chica` : `bg-superficie ${PINTA_HOVER_SECCION[p.href] ?? "hover:bg-limon/40"}`}`}
            >
              {cabecera(p.icono, fondo, activa, p.href === "/pedidos" ? <Insignia n={porAtender} urgente={urgente} /> : null)}
              <span className="truncate group-data-[cerrado]:hidden">{p.etiqueta}</span>
            </Link>
            {/* El botón de la vitrina se pega a la esquina de arriba del cuadro, porque el cuadro es todo el enlace */}
            {p.href === "/ajustes/tienda" && slug ? (
              <AbrirVitrina
                slug={slug}
                iconoGrande={grande}
                className="absolute right-0 top-0 flex size-10 items-center justify-center text-texto-2 hover:text-teal group-data-[cerrado]:hidden"
              />
            ) : null}
          </li>
        );
      })}
      {slug && !esDuena && externo("/vitrina", `/c/${slug}`, t.vitrina, "tienda")}
      {externo("/marketplace", "/marketplace", t.explorar, "explorar")}
    </ul>
  );
}
