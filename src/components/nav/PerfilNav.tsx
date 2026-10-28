import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

// Va dentro del menú: cuando el menú se cierra, solo queda el círculo (clases `group-data-[cerrado]`).
export async function PerfilNav() {
  const { negocio } = await negocioActual();
  const nombre = negocio.nombre || textos.perfil.nombre;
  const detalle = textos.perfil.roles[negocio.rol] ?? textos.perfil.detalle;
  return (
    <Link
      href="/ajustes"
      aria-label={textos.nav.perfil}
      className="flex min-h-12 items-center gap-3 rounded-xl p-1 hover:bg-superficie group-data-[cerrado]:justify-center"
    >
      {negocio.logo ? (
        <Image src={urlFoto(negocio.logo)} alt="" width={80} height={80} className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-teal">
          <Icon nombre="usuario" className="size-5" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[cerrado]:hidden">
        <span className="truncate text-sm font-medium">{nombre}</span>
        <span className="text-xs text-texto-2">{detalle}</span>
      </span>
    </Link>
  );
}
