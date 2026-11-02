"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { escribiendoEnCampo } from "./acciones";
import { ModalAcciones } from "./AccionRapida";
import { CLAVE_CERRADO, EVENTO_MENU, menuCerrado, suscribirMenu, type DatosMenu } from "./menu";
import { MenuEscritorio } from "./MenuEscritorio";
import { BarraLateral, EncabezadoMovil } from "./MenuMovil";
import { Paleta } from "./Paleta";

export type { DatosMenu };

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
      <EncabezadoMovil
        datos={datos}
        rapida={rapida}
        abrirRapida={() => setRapida(true)}
        masAbierto={mas}
        abrirMas={() => setMas(true)}
      />
      {/* Una sola ventana, al centro, para el celular y para la computadora */}
      {rapida && <ModalAcciones cerrar={() => setRapida(false)} tieneLocal={datos.tieneLocal} />}
      {mas && <BarraLateral datos={datos} ruta={pathname} abrirPaleta={() => setPaleta(true)} cerrar={() => setMas(false)} />}

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
