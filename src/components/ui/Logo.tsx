import Image from "next/image";
import { textos } from "@/lib/textos";

// El logo completo (monito + nombre). Dentro de un contenedor con `group` y `data-cerrado` (el menú
// lateral cerrado) queda solo el monito.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image src="/lote-logo.svg" alt={textos.nombre} width={98} height={24} priority className="h-7 w-auto group-data-[cerrado]:hidden" />
      <Image src="/lote-iso.svg" alt="" width={24} height={24} className="hidden size-7 group-data-[cerrado]:block" />
    </span>
  );
}
