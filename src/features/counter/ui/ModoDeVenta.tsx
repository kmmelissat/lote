import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.mostrador.modoVenta;

export type ModoDeVentaClave = "persona" | "chat";

/**
 * Qué se está haciendo: cobrar en persona (local, bazar, feria) o registrar un pedido que llegó por chat (Instagram, WhatsApp).
 * Cambia lo que se propone: en persona se lleva ahora y paga ya; por chat se envía y se piden los datos.
 */
export function ModoDeVenta({ modo, cambiar }: { modo: ModoDeVentaClave; cambiar: (m: ModoDeVentaClave) => void }) {
  return (
    <div role="radiogroup" aria-label={t.titulo} className="grid grid-cols-2 gap-1 rounded-full border-2 border-teal-oscuro bg-superficie p-1">
      {(["persona", "chat"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={modo === m}
          onClick={() => cambiar(m)}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm ${modo === m ? "bg-limon font-bold" : "text-texto-2"}`}
        >
          <Icon nombre={m === "persona" ? "tienda" : "chat"} className="size-4" />
          {t[m]}
        </button>
      ))}
    </div>
  );
}
