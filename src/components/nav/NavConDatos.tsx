import { datosNavegacion } from "@/features/home/navegacion";
import { ENLACES_PASOS } from "@/features/home/primerosPasos";
import { urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { Nav, type DatosMenu } from "./Nav";

const SIN_DATOS: DatosMenu = {
  porAtender: 0,
  urgente: false,
  pasos: null,
  slug: "",
  tieneLocal: false,
  perfil: { nombre: textos.perfil.nombre, detalle: textos.perfil.detalle, logo: null },
};

/** El menú con sus datos (contador de Pedidos, primeros pasos, perfil). Mientras llegan, se ve el menú sin ellos. */
export function NavSinDatos() {
  return <Nav datos={SIN_DATOS} />;
}

export async function NavConDatos() {
  const { supabase, negocio } = await negocioActual();
  const d = await datosNavegacion(supabase, negocio);
  const siguiente = d.pasos?.find((p) => !p.hecho);
  const datos: DatosMenu = {
    porAtender: d.porAtender,
    urgente: d.urgente,
    pasos:
      d.pasos && siguiente
        ? {
            hechos: d.pasos.filter((p) => p.hecho).length,
            total: d.pasos.length,
            siguiente: { titulo: textos.inicio.primerosPasos.pasos[siguiente.clave].titulo, href: ENLACES_PASOS[siguiente.clave] },
          }
        : null,
    // Sin vitrina no hay enlace que mostrar
    slug: negocio.vitrinaActiva ? negocio.slug : "",
    tieneLocal: negocio.tieneLocal,
    perfil: {
      nombre: negocio.nombre || textos.perfil.nombre,
      detalle: textos.perfil.roles[negocio.rol] ?? textos.perfil.detalle,
      logo: negocio.logo ? urlFoto(negocio.logo) : null,
    },
  };
  return <Nav datos={datos} />;
}
