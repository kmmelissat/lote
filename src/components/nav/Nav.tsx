"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { textos } from "@/lib/textos";
import { escribiendoEnCampo } from "./acciones";
import { ListaAcciones } from "./AccionRapida";
import { CLAVE_CERRADO, EVENTO_MENU, ajustesEscritorio, menuCerrado, pestanas, suscribirMenu, type DatosMenu } from "./menu";
import { MenuEscritorio } from "./MenuEscritorio";
import { BarraMovil, Hoja } from "./MenuMovil";
import { Paleta } from "./Paleta";
import { AbrirVitrina } from "./PiezasMenu";

export type { DatosMenu };

const t = textos.nav;

export function Nav({ datos }: { datos: DatosMenu }) {
  const pathname = usePathname();
  const [paleta, setPaleta] = useState(false);
  const [rapida, setRapida] = useState(false);
  const [mas, setMas] = useState(false);

  // El menú recuerda si lo dejaste cerrado. El servidor lo dibuja abierto y el navegador lo ajusta al hidratar.
  const cerrado = useSyncExternalStore(suscribirMenu, menuCerrado, () => false);
  const alternarMenu = () => {
    try {
      localStorage.setItem(CLAVE_CERRADO, cerrado ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(EVENTO_MENU));
  };

  // Al cambiar de pantalla se cierra lo que haya quedado abierto.
  const [rutaVista, setRutaVista] = useState(pathname);
  if (rutaVista !== pathname) {
    setRutaVista(pathname);
    setMas(false);
    setRapida(false);
  }

  // Atajos: ⌘K / Ctrl+K abre el buscador y N la acción rápida (salvo que estés escribiendo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      // El autocompletar del navegador y los gestores de contraseñas disparan eventos "keydown" sin tecla: se ignoran
      const letra = e.key?.toLowerCase();
      if (!letra) return;
      if ((e.metaKey || e.ctrlKey) && letra === "k") {
        e.preventDefault();
        setPaleta((p) => !p);
      } else if (letra === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !escribiendoEnCampo(e.target)) {
        e.preventDefault();
        setRapida((r) => !r);
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  return (
    <>
      <BarraMovil
        datos={datos}
        rapida={rapida}
        abrirRapida={() => setRapida(true)}
        masAbierto={mas}
        abrirMas={() => setMas(true)}
      />
      {rapida && (
        <Hoja titulo={t.rapida.titulo} cerrar={() => setRapida(false)}>
          <ListaAcciones alElegir={() => setRapida(false)} tieneLocal={datos.tieneLocal} />
        </Hoja>
      )}
      {mas && (
        <Hoja titulo={t.masTitulo} cerrar={() => setMas(false)}>
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-1">
              {[pestanas[3], pestanas[4], pestanas[5]].map((p) => (
                <li key={p.href}>
                  <EnlaceHoja href={p.href} etiqueta={p.etiqueta} icono={p.icono} />
                </li>
              ))}
            </ul>
            {datos.esDuena ? (
              <div>
                <Link
                  href="/ajustes"
                  className="flex min-h-11 items-center px-2 text-[10px] font-logo tracking-widest text-texto-2 uppercase hover:text-teal"
                >
                  {t.ajustes}
                </Link>
                <ul className="flex flex-col gap-1">
                  {ajustesEscritorio.map((p) => (
                    <li key={p.href} className="flex items-center">
                      <EnlaceHoja href={p.href} etiqueta={p.etiqueta} icono={p.icono} />
                      {p.href === "/ajustes/tienda" && datos.slug ? <AbrirVitrina slug={datos.slug} /> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EnlaceHoja href="/ajustes" etiqueta={t.ajustes} icono="ajustes" />
            )}
            <ul className="flex flex-col gap-1">
              <li>
                <EnlaceHoja href={textos.ayuda.ruta} etiqueta={t.ayuda} icono="info" />
              </li>
              {datos.slug && !datos.esDuena && (
                <li>
                  <EnlaceHoja href={`/c/${datos.slug}`} etiqueta={t.vitrina} icono="tienda" externo />
                </li>
              )}
              <li>
                <EnlaceHoja href="/marketplace" etiqueta={t.explorar} icono="buscar" externo />
              </li>
              <li>
                <CerrarSesion variante="menu" />
              </li>
            </ul>
          </div>
        </Hoja>
      )}

      {paleta && <Paleta cerrar={() => setPaleta(false)} tieneLocal={datos.tieneLocal} esDuena={datos.esDuena} />}

      <MenuEscritorio
        datos={datos}
        cerrado={cerrado}
        alternarMenu={alternarMenu}
        abrirPaleta={() => setPaleta(true)}
        rapida={rapida}
        setRapida={setRapida}
      />
    </>
  );
}

function EnlaceHoja({
  href,
  etiqueta,
  icono,
  externo = false,
}: {
  href: string;
  etiqueta: string;
  icono: NombreIcono;
  externo?: boolean;
}) {
  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noreferrer" : undefined}
      className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70"
    >
      <Icon nombre={icono} className="size-6 shrink-0 text-teal" />
      {etiqueta}
      {externo && <Icon nombre="enlace" className="size-4 text-texto-2" />}
    </Link>
  );
}
