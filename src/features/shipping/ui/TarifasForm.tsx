"use client";

import { useActionState, useState } from "react";
import { BarraGuardar } from "@/components/ui/BarraGuardar";
import { Bloque, Replegable, Seccion } from "@/components/ui/BloqueAjustes";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Interruptor } from "@/components/ui/Interruptor";
import { MensajeError } from "@/components/ui/MensajeError";
import { Textarea } from "@/components/ui/Textarea";
import { leerDolares, type Centavos } from "@/domain";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { limpiarSiNumero } from "@/lib/entrada";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Tarifas } from "../repositorio";
import { guardarTarifasDeEnvio, type EstadoTarifas } from "../actions/tarifas";
import { marcadasDe, ZonasEntregaInput, type Marcadas } from "./ZonasEntregaInput";

const t = textos.ajustes.envios;

function Dolares({ id, name, value, onChange, placeholder, className }: { id: string; name: string; value: string; onChange: (v: string) => void; placeholder: string; className: string }) {
  return (
    <span className={`relative block shrink-0 ${className}`}>
      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-texto-2">
        $
      </span>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(limpiarSiNumero(e.target.value, "decimal"))}
        className="h-11 w-full rounded-[14px] border-2 border-borde-control bg-superficie pl-7 pr-3 text-right text-base font-bold tabular-nums focus:border-teal"
      />
    </span>
  );
}

function Quien() {
  const opciones = [
    { clave: "lote", icono: "caja", tono: "bg-limon", titulo: t.quienLote, texto: t.quienLoteTexto, disponible: false },
    { clave: "propio", icono: "camion", tono: "bg-rosa", titulo: t.quienPropio, texto: t.quienPropioTexto, disponible: true },
  ] as const;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {opciones.map((o) => (
        <li
          key={o.clave}
          className={`flex items-start gap-3 rounded-[20px] border-2 p-4 ${
            o.disponible ? "border-teal-oscuro bg-superficie shadow-dura-chica" : "border-dashed border-teal-oscuro/40 bg-white/70 opacity-80"
          }`}
        >
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro ${o.tono}`}>
            <Icon nombre={o.icono} className="size-6" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{o.titulo}</span>
              <span className={`rounded-full border-2 border-teal-oscuro px-2 py-0.5 text-xs font-bold ${o.disponible ? "bg-teal-fondo" : "bg-mango"}`}>
                {o.disponible ? t.elegido : t.proximamente}
              </span>
            </span>
            <span className="text-sm text-texto-2">{o.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function montoDe(texto: string, siVacio: Centavos | null): Centavos | null {
  const v = texto.trim();
  if (v === "") return siVacio;
  return leerDolares(v);
}

function etiquetaDe(monto: Centavos | null): string {
  if (monto === null) return "—";
  if (monto === 0) return t.previaGratis;
  return formatearDolares(monto);
}

export function TarifasForm({ tarifas }: { tarifas: Tarifas }) {
  const [estado, accion, pendiente] = useActionState<EstadoTarifas, FormData>(guardarTarifasDeEnvio, {});
  const [retiro, setRetiro] = useState(tarifas.retiro ?? "");
  const [recoger, setRecoger] = useState((tarifas.retiro ?? "").trim().length > 0);
  const [todo, setTodo] = useState(tarifas.zonas === null);
  const [marcadas, setMarcadas] = useState<Marcadas>(() => marcadasDe(tarifas.zonas));
  const [defecto, setDefecto] = useState(dolaresTexto(tarifas.defecto));
  const [porDepto, setPorDepto] = useState<Record<string, string>>(() =>
    Object.fromEntries(DEPARTAMENTOS.map((d) => [d, d in tarifas.porDepartamento ? dolaresTexto(tarifas.porDepartamento[d]) : ""])),
  );

  const hayRetiro = recoger && retiro.trim().length > 0;
  const defectoCentavos = montoDe(defecto, 0);
  const defectoEtiqueta = etiquetaDe(defectoCentavos);
  const visibles = todo ? DEPARTAMENTOS : DEPARTAMENTOS.filter((d) => d in marcadas);
  const propias = visibles.filter((d) => (porDepto[d] ?? "").trim() !== "").length;

  return (
    <form action={accion} className="flex min-w-0 flex-col gap-4">
      <Seccion id="envios">
        <Bloque titulo={t.quienTitulo} texto={t.quienTexto} tono="celeste">
          <Quien />
        </Bloque>

        <Bloque titulo={t.retiroTitulo} texto={t.retiroTexto} tono="rosa" className="border-t-2 border-teal-oscuro/15 pt-5">
          {/* Sin dirección no hay retiro: el interruptor apagado manda la dirección vacía, pero lo escrito se queda por si lo prendés de nuevo */}
          <input type="hidden" name="retiro" value={recoger ? retiro : ""} />
          <Interruptor titulo={t.retiroInterruptor} ayuda={t.retiroInterruptorAyuda} activo={recoger} onCambio={setRecoger} />
          <div className={`flex flex-col gap-1.5 ${recoger ? "" : "hidden"}`}>
            <label htmlFor="retiro" className="text-sm font-medium">
              {t.retiro}
            </label>
            <Textarea
              id="retiro"
              rows={3}
              maxLength={200}
              placeholder={t.retiroPlaceholder}
              value={retiro}
              onChange={(e) => setRetiro(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-texto-2">{t.retiroAyuda}</p>
          </div>
          <p role="status" className={`rounded-xl px-3 py-2 text-sm font-medium ${hayRetiro ? "bg-teal-fondo" : "bg-limon"}`}>
            {hayRetiro ? t.retiroActivo : recoger ? t.retiroSinDireccion : t.retiroApagado}
          </p>
        </Bloque>

        <Bloque titulo={t.zonas.titulo} texto={t.zonas.texto} tono="limon" className="border-t-2 border-teal-oscuro/15 pt-5">
          <ZonasEntregaInput todo={todo} onTodo={setTodo} marcadas={marcadas} onMarcadas={setMarcadas} />
        </Bloque>

        <Bloque titulo={t.tarifasTitulo} texto={t.tarifasTexto} tono="mango" className="border-t-2 border-teal-oscuro/15 pt-5">
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <label htmlFor="tarifa-defecto" className="font-bold">
                {t.defecto}
              </label>
              <p className="text-sm text-texto-2">{t.defectoAyuda}</p>
            </div>
            <div className="flex items-center gap-3">
              {defectoCentavos === 0 && <span className="rounded-full border-2 border-teal-oscuro bg-limon px-2.5 py-0.5 text-xs font-bold">{t.previaGratis}</span>}
              <Dolares id="tarifa-defecto" name="defecto" value={defecto} onChange={setDefecto} placeholder="0.00" className="w-28" />
            </div>
          </div>

          <Replegable titulo={propias > 0 ? `${t.distinto} (${propias})` : t.distinto} abierto={propias > 0}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEPARTAMENTOS.map((d, i) => {
                const valor = porDepto[d] ?? "";
                const propia = valor.trim() !== "";
                return (
                  <div
                    key={d}
                    className={`${visibles.includes(d) ? "flex" : "hidden"} items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 ${
                      propia ? "border-teal-oscuro bg-limon" : "border-teal-oscuro/15 bg-white"
                    }`}
                  >
                    <label htmlFor={`tarifa-${i}`} className="min-w-0 truncate text-sm font-bold">
                      {t.departamento(d)}
                    </label>
                    <Dolares
                      id={`tarifa-${i}`}
                      name={`departamento_${i}`}
                      value={valor}
                      onChange={(v) => setPorDepto((prev) => ({ ...prev, [d]: v }))}
                      placeholder={defectoEtiqueta === t.previaGratis ? "0.00" : dolaresTexto(defectoCentavos ?? 0)}
                      className="w-24"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-texto-2">{t.distintoAyuda}</p>
          </Replegable>
        </Bloque>
      </Seccion>

      <BarraGuardar>
        <Button type="submit" variante="mango" disabled={pendiente}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        {estado.listo && (
          <p role="status" className="rounded-full bg-teal-fondo px-4 py-2 text-sm font-bold text-teal-oscuro">
            {t.guardado}
          </p>
        )}
        <MensajeError>{estado.error}</MensajeError>
      </BarraGuardar>
    </form>
  );
}
