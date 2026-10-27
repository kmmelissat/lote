import { textos } from "@/lib/textos";

// Chip pequeño para lo que propuso la IA: siempre editable, nunca protagonista.
export function Sugerido() {
  return (
    <span className="ml-2 rounded-full bg-rosa-fondo px-2 py-0.5 text-xs font-medium text-rosa-texto">
      {textos.productos.form.sugerido}
    </span>
  );
}
