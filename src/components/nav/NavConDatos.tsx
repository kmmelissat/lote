import { datosNavegacion } from "@/features/home/navegacion";
import { urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { rolPropio } from "@/domain";
import { textos } from "@/lib/textos";
import { Nav, type DatosMenu } from "./Nav";

const SIN_DATOS: DatosMenu = {
  porAtender: 0,
  urgente: false,
  enCamino: 0,
  slug: "",
  tieneLocal: false,
  esDuena: false,
  perfil: { nombre: textos.perfil.nombre, detalle: textos.perfil.detalle, logo: null },
};

/** El menú con sus datos (contador de Pedidos, perfil). Mientras llegan, se ve el menú sin ellos. */
export function NavSinDatos() {
  return <Nav datos={SIN_DATOS} />;
}

export async function NavConDatos() {
  const { supabase, negocio } = await negocioActual();
  const d = await datosNavegacion(supabase, negocio);
  const datos: DatosMenu = {
    porAtender: d.porAtender,
    urgente: d.urgente,
    enCamino: d.enCamino,
    // Sin vitrina no hay enlace que mostrar
    slug: negocio.vitrinaActiva ? negocio.slug : "",
    tieneLocal: negocio.tieneLocal,
    esDuena: negocio.rol === "duena",
    perfil: {
      nombre: negocio.nombre || textos.perfil.nombre,
      // Su propio rol, como ella lo quiere leer (Dueña, Dueño o Titular)
      detalle: rolPropio(negocio.rol, negocio.trato) ?? textos.perfil.detalle,
      logo: negocio.logo ? urlFoto(negocio.logo) : null,
    },
  };
  return <Nav datos={datos} />;
}
