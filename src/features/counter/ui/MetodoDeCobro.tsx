import { Icon } from "@/components/ui/Icon";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { ICONO_METODO, METODOS } from "../mostrador";
import type { MetodoMostrador } from "../repositorio";

const t = textos.mostrador;

export function MetodoDeCobro({
  metodo,
  cambiarMetodo,
  recibido,
  cambiarRecibido,
  cambio,
  faltaRecibido,
}: {
  metodo: MetodoMostrador;
  cambiarMetodo: (m: MetodoMostrador) => void;
  recibido: string;
  cambiarRecibido: (texto: string) => void;
  cambio: number | null;
  faltaRecibido: number | null;
}) {
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t.metodo}</legend>
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metodo === m}
              onClick={() => cambiarMetodo(m)}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-teal-oscuro px-1 text-sm ${metodo === m ? "bg-limon font-bold" : "bg-superficie"}`}
            >
              <Icon nombre={ICONO_METODO[m]} className="size-5" />
              {t.metodos[m]}
            </button>
          ))}
        </div>
      </fieldset>

      {metodo === "efectivo" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recibido" className="text-sm font-medium">
            {t.recibido}{" "}
            <span className="font-normal text-texto-2">
              · {t.recibidoAyuda}
            </span>
          </label>
          <input
            id="recibido"
            inputMode="decimal"
            value={recibido}
            onChange={(e) => cambiarRecibido(soloNumero(e.target.value, true))}
            placeholder="$0.00"
            className="h-12 rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal"
          />
          {cambio !== null && (
            <p className="font-bold text-teal">
              {t.cambio(formatearDolares(cambio))}
            </p>
          )}
          {faltaRecibido !== null && (
            <p className="text-sm text-error">
              {t.faltaRecibido(formatearDolares(faltaRecibido))}
            </p>
          )}
        </div>
      )}
    </>
  );
}
