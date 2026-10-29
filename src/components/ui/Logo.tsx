import Image from "next/image";
import { textos } from "@/lib/textos";

// El logo completo (monito + nombre). Dentro de un contenedor con `group` y `data-cerrado` (el menú
// lateral cerrado) queda solo el monito. `oscuro` lo pinta en teal-oscuro en vez de teal.
export function Logo({ className = "", oscuro = false }: { className?: string; oscuro?: boolean }) {
  const tono = oscuro ? "-oscuro" : "";
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image src={`/lote-logo${tono}.svg`} alt={textos.nombre} width={98} height={24} priority unoptimized className="h-7 w-auto group-data-[cerrado]:hidden" />
      <Image src={`/lote-iso${tono}.svg`} alt="" width={24} height={24} unoptimized className="hidden size-7 group-data-[cerrado]:block" />
    </span>
  );
}
