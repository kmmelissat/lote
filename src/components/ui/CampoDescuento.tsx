import { soloNumero } from "@/lib/entrada";
import { Icon } from "./Icon";
import { textos } from "@/lib/textos";
import type { Descuento } from "@/domain";

const t = textos.comun.descuento;

export function CampoDescuento({
  activo,
  tipo,
  texto,
  invalido,
  activar,
  quitar,
  cambiarTipo,
  cambiarTexto,
}: {
  activo: boolean;
  tipo: Descuento["tipo"];
  texto: string;
  invalido: boolean;
  activar: () => void;
  quitar?: () => void;
  cambiarTipo: (tipo: Descuento["tipo"]) => void;
  cambiarTexto: (texto: string) => void;
}) {
  return activo ? (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="sr-only">{t.titulo}</legend>
      {/* Todo en una línea: dólares o porcentaje, el valor y quitar */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-texto-2">{t.titulo}</span>
        <div role="group" aria-label={t.titulo} className="flex shrink-0 rounded-xl bg-gris-100 p-0.5">
          {(["monto", "porcentaje"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              aria-pressed={tipo === opcion}
              aria-label={opcion === "monto" ? t.monto : t.porcentaje}
              title={opcion === "monto" ? t.monto : t.porcentaje}
              onClick={() => cambiarTipo(opcion)}
              className={`grid size-9 place-items-center rounded-[10px] text-sm font-semibold ${tipo === opcion ? "border border-linea bg-superficie shadow-xs" : "text-texto-2"}`}
            >
              {opcion === "monto" ? "$" : "%"}
            </button>
          ))}
        </div>
        <input
          inputMode="decimal"
          value={texto}
          onChange={(e) => cambiarTexto(soloNumero(e.target.value, true))}
          aria-label={t.valor}
          aria-invalid={invalido || undefined}
          placeholder={tipo === "monto" ? "0.00" : "10"}
          className={`h-11 w-0 min-w-0 flex-1 rounded-[14px] border bg-superficie px-3 text-right text-sm font-semibold tabular-nums outline-none focus:border-teal ${invalido ? "border-error" : "border-linea"}`}
        />
        {quitar && (
          <button type="button" onClick={quitar} aria-label={t.quitar} title={t.quitar} className="grid size-11 shrink-0 place-items-center rounded-[14px] text-texto-2 hover:bg-gris-100">
            <Icon nombre="x" className="size-5" />
          </button>
        )}
      </div>
      {invalido && <p className="text-sm text-error">{t.invalido}</p>}
    </fieldset>
  ) : (
    <button
      type="button"
      onClick={() => activar()}
      className="flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-teal"
    >
      <Icon nombre="mas" className="size-4" />
      {t.agregar}
    </button>
  );
}
