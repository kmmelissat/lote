import { textos } from "@/lib/textos";

const t = textos.mostrador.modoVenta;

export type ModoDeVentaClave = "persona" | "chat";

/**
 * Qué se está haciendo: cobrar en persona (local, bazar, feria) o registrar un pedido que llegó por chat (Instagram, WhatsApp).
 * Cambia lo que se propone: en persona solo se elige el pago; por chat se piden el cliente, la entrega y el pago.
 */
export function ModoDeVenta({ modo, cambiar }: { modo: ModoDeVentaClave; cambiar: (m: ModoDeVentaClave) => void }) {
  return (
    <div role="radiogroup" aria-label={t.titulo} className="grid grid-cols-2 gap-3">
      {(["persona", "chat"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={modo === m}
          onClick={() => cambiar(m)}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-shadow ${modo === m ? "border-teal bg-teal-fondo" : "border-linea bg-superficie hover:border-borde-control"}`}
        >
          <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-xl text-xl ${m === "persona" ? "bg-ficha-amarillo" : "bg-ficha-lila"}`}>
            {m === "persona" ? "🛍️" : "💬"}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{t[m]}</span>
            <span className="text-xs text-texto-2">{m === "persona" ? t.personaAyuda : t.chatAyuda}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
