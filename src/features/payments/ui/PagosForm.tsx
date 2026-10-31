"use client";

import { useActionState, useId, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Card } from "@/components/ui/Card";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { OpcionCheck } from "@/components/ui/OpcionCheck";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import type { TipoMetodo } from "../mensajeCobro";
import { TIPOS_METODO, type MetodoPagoNegocio } from "../repositorio";
import { textos } from "@/lib/textos";
import { guardarDatosDePago, type EstadoPagos } from "../actions/ajustes";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const t = textos.ajustes.pagos;

const ICONO: Record<TipoMetodo, NombreIcono> = {
  transferencia: "banco",
  billetera: "billetera",
  efectivo: "efectivo",
  contra_entrega: "camion",
};

type Valor = { activo: boolean; datos: string };
type Valores = Record<TipoMetodo, Valor>;

/** Los métodos que necesitan datos para poder pagar (en efectivo y contra entrega no hace falta decir nada más) */
const NECESITAN_DATOS: TipoMetodo[] = ["transferencia", "billetera"];

export function PagosForm({ metodos }: { metodos: MetodoPagoNegocio[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoPagos, FormData>(guardarDatosDePago, {});
  useAvisarListo(estado, t.guardado);
  const id = useId();
  const [valores, setValores] = useState<Valores>(() =>
    Object.fromEntries(
      TIPOS_METODO.map((tipo) => {
        const m = metodos.find((x) => x.tipo === tipo);
        return [tipo, { activo: m?.activo ?? false, datos: m?.datos ?? "" }];
      }),
    ) as Valores,
  );
  // Lo último guardado: el botón de guardar se prende solo cuando algo cambió
  const [guardado, setGuardado] = useState(() => JSON.stringify(valores));
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.listo) setGuardado(JSON.stringify(valores));
  }
  const sucio = JSON.stringify(valores) !== guardado;

  const cambiar = (tipo: TipoMetodo, cambio: Partial<Valor>) =>
    setValores((v) => ({ ...v, [tipo]: { ...v[tipo], ...cambio } }));
  const activos = TIPOS_METODO.filter((tipo) => valores[tipo].activo);

  return (
    <form action={accion} className="flex min-w-0 flex-col gap-4">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold leading-tight">
            <span className="box-decoration-clone bg-[linear-gradient(transparent_86%,var(--color-rosa)_86%,var(--color-rosa)_100%)] pb-0.5">{t.titulo}</span>
          </h3>
          <p className="max-w-xl text-sm text-texto-2">{t.descripcion}</p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t.comoTePagan}</legend>
          <div className="flex flex-wrap gap-3">
            {TIPOS_METODO.map((tipo) => (
              <OpcionCheck
                key={tipo}
                name={`${tipo}_activo`}
                titulo={textos.cobro.metodos[tipo]}
                icono={ICONO[tipo]}
                checked={valores[tipo].activo}
                onChange={(e) => cambiar(tipo, { activo: e.target.checked })}
              />
            ))}
          </div>
        </fieldset>

        {activos.length === 0 && <Aviso tipo="alerta">{t.sinMetodos}</Aviso>}

        {/* Los campos de los métodos apagados quedan en el formulario (ocultos): así no se pierden los datos ya escritos */}
        <div className={`grid grid-cols-1 items-start gap-4 border-t border-borde pt-5 md:grid-cols-2 ${activos.length ? "" : "hidden"}`}>
          {TIPOS_METODO.map((tipo) => {
            const v = valores[tipo];
            return (
              <div key={tipo} className={`flex flex-col gap-1.5 ${v.activo ? "" : "hidden"}`}>
                <label htmlFor={`${id}-${tipo}`} className="flex items-center gap-2 text-sm font-bold">
                  <Icon nombre={ICONO[tipo]} className="size-4 text-teal" />
                  {textos.cobro.metodos[tipo]}
                </label>
                <Textarea
                  id={`${id}-${tipo}`}
                  name={`${tipo}_datos`}
                  rows={3}
                  placeholder={t.ayuda[tipo]}
                  value={v.datos}
                  onChange={(e) => cambiar(tipo, { datos: e.target.value })}
                />
                {NECESITAN_DATOS.includes(tipo) && !v.datos.trim() && (
                  <div className="flex flex-col items-start gap-2">
                    <Aviso tipo="alerta">{t.faltanDatos}</Aviso>
                    <Button type="button" variante="suave" tamano="chico" icono="mas" onClick={() => cambiar(tipo, { datos: t.plantilla[tipo as "transferencia" | "billetera"] })}>
                      {t.usarPlantilla}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <MensajeError>{estado.error}</MensajeError>
      </Card>

      <BarraFormulario>
        <p role="status" className={`mr-auto text-sm ${sucio ? "font-medium text-teal-oscuro" : "text-texto-2"}`}>
          {sucio ? t.cambiosSinGuardar : t.sinCambios}
        </p>
        <Button type="submit" variante="mango" icono="check" disabled={pendiente || !sucio}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
      </BarraFormulario>
    </form>
  );
}
