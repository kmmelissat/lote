"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { CerrarSesion } from "@/features/auth/ui/CerrarSesion";
import { textos } from "@/lib/textos";
import { escribiendoEnCampo } from "./acciones";
import { AccionRapida, ListaAcciones } from "./AccionRapida";
import { CLAVE_CERRADO, EVENTO_MENU, menuCerrado, pestanas, suscribirMenu, type DatosMenu } from "./menu";
import { BarraMovil, Hoja } from "./MenuMovil";
import { Paleta } from "./Paleta";
import { Buscar, EnlaceLateral, Insignia, PrimerosPasos, TarjetaPerfil, Vitrina } from "./PiezasMenu";
import { ConRuta } from "./RutaActiva";

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

  const insignia = <Insignia n={datos.porAtender} urgente={datos.urgente} />;

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
          <ul className="flex flex-col gap-1">
            {[pestanas[3], pestanas[4], pestanas[5], { href: "/ajustes", etiqueta: t.ajustes, icono: "ajustes" as const }].map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="flex min-h-12 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70">
                  <Icon nombre={p.icono} className="size-6 shrink-0 text-teal" />
                  {p.etiqueta}
                </Link>
              </li>
            ))}
            {datos.slug && (
              <li>
                <Link href={`/c/${datos.slug}`} target="_blank" className="flex min-h-12 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70">
                  <Icon nombre="tienda" className="size-6 shrink-0 text-teal" />
                  {t.vitrina}
                  <Icon nombre="enlace" className="size-4 text-texto-2" />
                </Link>
              </li>
            )}
            <li>
              <Link href="/marketplace" target="_blank" className="flex min-h-12 items-center gap-3 rounded-xl px-2 font-medium hover:bg-white/70">
                <Icon nombre="buscar" className="size-6 shrink-0 text-teal" />
                {t.explorar}
                <Icon nombre="enlace" className="size-4 text-texto-2" />
              </Link>
            </li>
            <li>
              <CerrarSesion variante="menu" />
            </li>
          </ul>
        </Hoja>
      )}

      {paleta && <Paleta cerrar={() => setPaleta(false)} tieneLocal={datos.tieneLocal} />}

      {/* Escritorio: menú flotante color crema, con borde y sombra dura, que se cierra a una tira de íconos */}
      <aside
        data-cerrado={cerrado ? "" : undefined}
        className={`group sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-crema p-3 shadow-dura-chica transition-[width] duration-200 md:flex ${
          cerrado ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between gap-2 group-data-[cerrado]:flex-col">
          <Link href="/inicio" aria-label={textos.nombre} className="px-1">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={alternarMenu}
            aria-expanded={!cerrado}
            aria-label={cerrado ? t.abrirMenu : t.cerrarMenu}
            title={cerrado ? t.abrirMenu : t.cerrarMenu}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-white/70 hover:text-teal-oscuro"
          >
            <Icon nombre="panel" className="size-5" />
          </button>
        </div>
        <Buscar abrir={() => setPaleta(true)} />
        <AccionRapida abierta={rapida} alternar={(abrir) => setRapida((r) => abrir ?? !r)} tieneLocal={datos.tieneLocal} />
        <nav aria-label="Principal">
          <ConRuta
            hijos={(ruta) => (
              <ul className="flex flex-col gap-1">
                {pestanas.map((p) => (
                  <li key={p.href}>
                    <EnlaceLateral pestana={p} pathname={ruta} insignia={p.href === "/pedidos" ? insignia : undefined} />
                  </li>
                ))}
                {datos.slug && (
                  <li>
                    <Vitrina slug={datos.slug} />
                  </li>
                )}
                <li>
                  <Link
                    href="/marketplace"
                    target="_blank"
                    title={t.explorar}
                    className="group/item flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium text-texto-2 transition-colors duration-150 hover:bg-white/70 hover:text-teal-oscuro group-data-[cerrado]:justify-center"
                  >
                    <Icon nombre="buscar" className="size-6 shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5" />
                    <span className="min-w-0 flex-1 truncate group-data-[cerrado]:hidden">{t.explorar}</span>
                    <Icon nombre="enlace" className="size-4 shrink-0 group-data-[cerrado]:hidden" />
                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </Link>
                </li>
              </ul>
            )}
          />
        </nav>
        {datos.pasos ? <PrimerosPasos pasos={datos.pasos} /> : <div className="mt-auto" />}
        <div className="flex flex-col gap-1 border-t-2 border-teal-oscuro/15 pt-3">
          <TarjetaPerfil perfil={datos.perfil} />
        </div>
      </aside>
    </>
  );
}
