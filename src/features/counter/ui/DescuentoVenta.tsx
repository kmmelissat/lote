import { soloNumero } from "@/lib/entrada";
import { textos } from "@/lib/textos";
import type { Descuento } from "@/domain";

const t = textos.mostrador;

export function DescuentoVenta({
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
  quitar: () => void;
  cambiarTipo: (tipo: Descuento["tipo"]) => void;
  cambiarTexto: (texto: string) => void;
}) {
  return activo ? (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t.descuento}</legend>
      <div className="flex gap-2">
        {(["monto", "porcentaje"] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={tipo === opcion}
            onClick={() => cambiarTipo(opcion)}
            className={`min-h-11 flex-1 rounded-full border-2 border-teal-oscuro px-3 text-sm font-medium ${tipo === opcion ? "bg-limon font-bold" : "bg-superficie"}`}
          >
            {opcion === "monto" ? t.descuentoMonto : t.descuentoPorcentaje}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={texto}
          onChange={(e) => cambiarTexto(soloNumero(e.target.value, true))}
          aria-label={t.descuentoValor}
          aria-invalid={invalido || undefined}
          placeholder={tipo === "monto" ? "$0.00" : "10 %"}
          className="h-12 min-w-0 flex-1 rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal"
        />
        <button
          type="button"
          onClick={quitar}
          className="min-h-11 px-2 text-sm font-medium text-teal underline underline-offset-2"
        >
          {t.quitarDescuento}
        </button>
      </div>
      {invalido && <p className="text-sm text-error">{t.descuentoInvalido}</p>}
    </fieldset>
  ) : (
    <button
      type="button"
      onClick={() => activar()}
      className="min-h-11 self-start text-sm font-medium text-teal underline underline-offset-2"
    >
      {t.agregarDescuento}
    </button>
  );
}
