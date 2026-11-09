"use client";

import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { repartirEnvio, leerDolares, type QuienPagaEnvio } from "@/domain";
import { DEPARTAMENTOS, esDepartamento, MUNICIPIOS } from "@/lib/departamentos";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { tarifaDe, type Tarifas } from "@/features/shipping/repositorio";
import { ENTREGAS_ELEGIBLES, llevaEnvio, type Entrega } from "../plan";

const t = textos.mostrador.entrega;
const te = textos.pedidos.envio;

const ICONO: Record<Entrega, NombreIcono> = { ahora: "carrito", retiro: "tienda", propio: "caja", paquetera: "camion" };

/** Los datos de entrega que se llenan al vender. Quedan vacíos hasta que hacen falta. */
export type DatosDeEntrega = {
  nombre: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
  paquetera: string;
  costo: string;
  /** Si ya se tocó el costo a mano: dejar de proponer la tarifa del departamento */
  costoTocado: boolean;
  paga: Exclude<QuienPagaEnvio, "mitad">;
};

export const ENTREGA_VACIA: DatosDeEntrega = {
  nombre: "",
  telefono: "",
  departamento: "",
  municipio: "",
  direccion: "",
  referencia: "",
  paquetera: "",
  costo: "",
  costoTocado: false,
  paga: "cliente",
};

/** Cuánto suma al total el envío que paga la clienta (cero si lo paga quien vende o no hay envío). */
export function envioCobrado(entrega: Entrega, d: DatosDeEntrega): number {
  if (!llevaEnvio(entrega)) return 0;
  const costo = d.costo.trim() === "" ? 0 : leerDolares(d.costo);
  return costo === null ? 0 : repartirEnvio(costo, d.paga).cobrado;
}

/**
 * Cuándo y cómo se entrega: se la lleva ahora, la recoge después, o se la llevan (uno mismo o una paquetera).
 * Con envío se piden los datos de la dirección y cuánto cuesta; el costo se propone con la tarifa del departamento.
 */
/** Un bloque de campos con su emoji, para que el formulario largo no se vea como una sola tira de cajas */
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gris-50 p-3.5">
      <p className="text-sm font-semibold">{titulo}</p>
      {children}
    </div>
  );
}

export function EntregaDeVenta({
  entrega,
  cambiarEntrega,
  datos,
  cambiarDatos,
  tarifas,
  nombreSugerido,
  telefonoSugerido,
}: {
  entrega: Entrega;
  cambiarEntrega: (e: Entrega) => void;
  datos: DatosDeEntrega;
  cambiarDatos: (parcial: Partial<DatosDeEntrega>) => void;
  tarifas: Tarifas;
  /** El nombre y el teléfono de la clienta, para no escribirlos dos veces */
  nombreSugerido: string;
  telefonoSugerido: string;
}) {
  const costo = datos.costo.trim() === "" ? 0 : leerDolares(datos.costo);
  const reparto = costo === null ? null : repartirEnvio(costo, datos.paga);

  function elegirDepartamento(d: string) {
    // Se propone la tarifa del departamento mientras el costo no se haya tocado a mano
    cambiarDatos({ departamento: d, municipio: "", ...(d && !datos.costoTocado ? { costo: dolaresTexto(tarifaDe(tarifas, d)) } : {}) });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Las mismas celdas pegadas que las formas de pago: un ícono y el nombre, nada más */}
      <div role="radiogroup" aria-label={t.titulo} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ENTREGAS_ELEGIBLES.map((e) => {
          const activa = entrega === e;
          return (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => cambiarEntrega(e)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-center ${activa ? "border-teal bg-teal-fondo font-semibold" : "border-linea bg-superficie text-texto-2 hover:border-borde-control"}`}
            >
              <Icon nombre={ICONO[e]} className="size-5" />
              <span className="text-sm leading-tight">{t[e]}</span>
            </button>
          );
        })}
      </div>
      <p className="-mt-1 text-sm text-texto-2">{t[`${entrega}Ayuda`]}</p>

      {llevaEnvio(entrega) && (
        <div className="flex flex-col gap-4">
          <Grupo titulo="Quién recibe">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field etiqueta={te.nombre} value={datos.nombre} placeholder={nombreSugerido} onChange={(e) => cambiarDatos({ nombre: e.target.value })} autoComplete="off" />
            <CampoTelefono etiqueta={te.telefono} name="entrega-telefono" value={datos.telefono || telefonoSugerido} onChange={(v) => cambiarDatos({ telefono: v })} ayuda={te.errorTelefono} />
          </div>
          </Grupo>
          <Grupo titulo="Adónde va">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{te.departamento}</span>
            <Select value={datos.departamento} onChange={(e) => elegirDepartamento(e.target.value)} required>
              <option value="">{te.elegirDepartamento}</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </label>
          {esDepartamento(datos.departamento) && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{te.municipio}</span>
              <Select value={datos.municipio} onChange={(e) => cambiarDatos({ municipio: e.target.value })}>
                <option value="">{te.elegirMunicipio}</option>
                {MUNICIPIOS[datos.departamento].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <Field etiqueta={te.direccion} value={datos.direccion} onChange={(e) => cambiarDatos({ direccion: e.target.value })} autoComplete="off" required />
          <Field etiqueta={te.referencia} value={datos.referencia} onChange={(e) => cambiarDatos({ referencia: e.target.value })} autoComplete="off" />
          {entrega === "paquetera" && <Field etiqueta={`${te.paquetera} (opcional)`} value={datos.paquetera} onChange={(e) => cambiarDatos({ paquetera: e.target.value })} autoComplete="off" />}

          </Grupo>
          <Grupo titulo="Costo del envío">
          <div className="flex flex-col gap-1">
            <Field etiqueta={te.costo} inputMode="decimal" value={datos.costo} onChange={(e) => cambiarDatos({ costo: e.target.value, costoTocado: true })} />
            {datos.departamento && <p className="text-sm text-texto-2">{te.costoAyuda(formatearDolares(tarifaDe(tarifas, datos.departamento)))}</p>}
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{te.paga}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["cliente", "vendedora"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  aria-pressed={datos.paga === q}
                  onClick={() => cambiarDatos({ paga: q })}
                  className={`min-h-11 rounded-[14px] border px-3 text-sm ${datos.paga === q ? "border-teal bg-teal-fondo font-semibold" : "border-linea bg-superficie text-texto-2 hover:border-borde-control"}`}
                >
                  {te.pagas[q]}
                </button>
              ))}
            </div>
          </fieldset>

          {reparto && (costo ?? 0) > 0 && (
            <p className="rounded-2xl bg-chip-amarillo px-4 py-3 text-sm text-chip-texto-amarillo" aria-live="polite">
              {reparto.cobrado > 0 && te.cobraCliente(formatearDolares(reparto.cobrado))} {reparto.absorbido > 0 && te.absorbes(formatearDolares(reparto.absorbido))}
            </p>
          )}
          </Grupo>
        </div>
      )}
    </div>
  );
}
