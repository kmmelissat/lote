"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { Bloque, Replegable, Seccion } from "@/components/ui/BloqueAjustes";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { Interruptor } from "@/components/ui/Interruptor";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
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
      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-texto-2">
        $
      </span>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(limpiarSiNumero(e.target.value, "decimal"))}
        className="h-11 w-full rounded-[14px] border border-linea bg-superficie pl-7 pr-3 text-right text-base font-semibold tabular-nums focus:border-teal"
      />
    </span>
  );
}

function Quien() {
  const opciones = [
    { clave: "propio", icono: "camion", titulo: t.quienPropio, texto: t.quienPropioTexto, disponible: true },
    { clave: "lote", icono: "caja", titulo: t.quienLote, texto: t.quienLoteTexto, disponible: false },
  ] as const;
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
      {opciones.map((o) => (
        <li
          key={o.clave}
          className={`flex items-start gap-3 ${o.disponible ? "" : "opacity-70"}`}
        >
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] text-teal-oscuro ${o.disponible ? "bg-ficha-celeste" : "bg-gris-100"}`}>
            <Icon nombre={o.icono} className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-base font-bold">{o.titulo}</span>
            <span className="text-sm text-texto-2">{o.texto}</span>
          </span>
          <span
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 self-center rounded-full px-4 text-sm font-bold ${
              o.disponible ? "bg-teal text-white" : "border border-linea bg-gris-100 text-texto-2"
            }`}
          >
            {o.disponible && <Icon nombre="check" className="size-4" />}
            {o.disponible ? t.elegido : t.proximamente}
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
  useAvisarListo(estado, t.guardado);
  const [retiro, setRetiro] = useState(tarifas.retiro ?? "");
  const [recoger, setRecoger] = useState((tarifas.retiro ?? "").trim().length > 0);
  const [todo, setTodo] = useState(tarifas.zonas === null);
  const [marcadas, setMarcadas] = useState<Marcadas>(() => marcadasDe(tarifas.zonas));
  const [defecto, setDefecto] = useState(dolaresTexto(tarifas.defecto));
  const [porDepto, setPorDepto] = useState<Record<string, string>>(() =>
    Object.fromEntries(DEPARTAMENTOS.map((d) => [d, d in tarifas.porDepartamento ? dolaresTexto(tarifas.porDepartamento[d]) : ""])),
  );

  // Lo último guardado: el botón de guardar se prende solo cuando algo cambió
  const actual = JSON.stringify({ retiro: recoger ? retiro : "", todo, marcadas, defecto, porDepto });
  const [guardado, setGuardado] = useState(actual);
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.listo) setGuardado(actual);
  }
  const sucio = actual !== guardado;

  const hayRetiro = recoger && retiro.trim().length > 0;
  const defectoCentavos = montoDe(defecto, 0);
  const defectoEtiqueta = etiquetaDe(defectoCentavos);
  const visibles = todo ? DEPARTAMENTOS : DEPARTAMENTOS.filter((d) => d in marcadas);
  const propias = visibles.filter((d) => (porDepto[d] ?? "").trim() !== "").length;

  return (
    <form action={accion} className="flex min-w-0 flex-1 flex-col gap-4">
      <Seccion id="envios">
        <Bloque titulo={t.quienTitulo} texto={t.quienTexto} tono="celeste">
          <Quien />
        </Bloque>

        <Bloque titulo={t.retiroTitulo} texto={t.retiroTexto} tono="rosa">
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
          </div>
          {/* Solo es alerta cuando falta la dirección: dice que retiran pero no a dónde */}
          {recoger && !hayRetiro ? (
            <Aviso tipo="alerta">{t.retiroSinDireccion}</Aviso>
          ) : (
            <p className="text-sm text-texto-2">{hayRetiro ? t.retiroActivo : t.retiroApagado}</p>
          )}
        </Bloque>

        <Bloque titulo={t.zonas.titulo} texto={t.zonas.texto} tono="limon">
          <ZonasEntregaInput todo={todo} onTodo={setTodo} marcadas={marcadas} onMarcadas={setMarcadas} />
        </Bloque>

        <Bloque titulo={t.tarifasTitulo} texto={t.tarifasTexto} tono="mango">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <label htmlFor="tarifa-defecto" className="text-base font-bold">
                {t.defecto}
              </label>
              <p className="text-sm text-texto-2">{t.defectoAyuda}</p>
            </div>
            <div className="flex items-center gap-3">
              {defectoCentavos === 0 && <span className="rounded-lg bg-teal-fondo px-2.5 py-0.5 text-xs font-semibold text-teal-oscuro">{t.previaGratis}</span>}
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
                    className={`${visibles.includes(d) ? "flex" : "hidden"} items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                      propia ? "border-teal-oscuro bg-teal-fondo" : "border-transparent bg-gris-100/50"
                    }`}
                  >
                    <label htmlFor={`tarifa-${i}`} className="min-w-0 truncate text-sm font-semibold">
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

      <MensajeError>{estado.error}</MensajeError>
      <BarraFormulario>
        <p role="status" className={`mr-auto text-sm ${sucio ? "font-medium text-teal-oscuro" : "text-texto-2"}`}>
          {sucio ? t.cambiosSinGuardar : t.sinCambios}
        </p>
        <BotonPunch type="submit" disabled={pendiente || !sucio}>
          <Icon nombre="check" className="size-5 shrink-0" />
          {pendiente ? t.guardando : t.guardar}
        </BotonPunch>
      </BarraFormulario>
    </form>
  );
}
