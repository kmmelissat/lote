import { textos } from "@/lib/textos";
import { Toldo } from "./Toldo";
import { TARJETA_BASE } from "./tarjeta";

/** Una barra de relleno. Si la clase ya trae un `bg-`, ese color gana. */
function Barra({ className }: { className: string }) {
  const fondo = /(^|\s)bg-/.test(className) ? "" : "bg-borde";
  return <span className={`block rounded-full motion-safe:animate-pulse ${fondo} ${className}`} />;
}

/** El hueco de una pantalla del panel: título, tres datos y una lista. El menú ya está, así que no se repite. */
function Panel() {
  return (
    <div aria-hidden="true">
      <div className="mb-4">
        <Barra className="h-8 w-48 bg-limon" />
        <Barra className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["uno", "dos", "tres"].map((id) => (
          <div key={id} className={`${TARJETA_BASE} bg-superficie p-4 md:p-5`}>
            <Barra className="h-3 w-16" />
            <Barra className="mt-3 h-7 w-24 bg-limon" />
          </div>
        ))}
      </div>
      <div className={`${TARJETA_BASE} mt-3 bg-superficie p-4 md:p-5`}>
        {["a", "b", "c", "d"].map((id) => (
          <Barra key={id} className={`mb-3 h-4 last:mb-0 ${id === "d" ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** El hueco de una tienda: el toldo, el logo y la grilla, antes de que lleguen el nombre y los productos. */
function Vitrina() {
  return (
    <div aria-hidden="true">
      <header className={`${TARJETA_BASE} mb-8 overflow-hidden bg-superficie shadow-dura`}>
        <Toldo />
        <div className="flex items-end gap-4 px-5 pb-5 pt-4 md:px-8 md:pb-7">
          <span className="size-[4.5rem] shrink-0 -rotate-3 rounded-2xl border-4 border-superficie bg-limon ring-2 ring-teal-oscuro motion-safe:animate-pulse md:size-24" />
          <div className="mb-1 min-w-0 flex-1">
            <Barra className="h-8 w-48 max-w-full bg-limon" />
            <Barra className="mt-2 h-4 w-64 max-w-full" />
          </div>
        </div>
      </header>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {["uno", "dos", "tres", "cuatro", "cinco", "seis"].map((id) => (
          <li key={id} className={`${TARJETA_BASE} overflow-hidden bg-superficie`}>
            <span className="block aspect-square bg-borde motion-safe:animate-pulse" />
            <div className="p-3">
              <Barra className="h-4 w-3/4" />
              <Barra className="mt-2 h-4 w-1/3 bg-limon" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Lo que se muestra mientras carga una ruta (`loading.tsx`). Son las tarjetas de la marca, vacías.
 * El texto lo anuncia el lector de pantalla; las barras no.
 */
export function Esqueleto({ variante }: { variante: "panel" | "vitrina" }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <p className="sr-only">{textos.comun.cargando}</p>
      {variante === "panel" ? <Panel /> : <Vitrina />}
    </div>
  );
}
