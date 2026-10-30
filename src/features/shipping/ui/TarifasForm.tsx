"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { BarraGuardar } from "@/components/ui/BarraGuardar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Gorila } from "@/components/ui/Gorila";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { TARJETA } from "@/components/ui/tarjeta";
import { Textarea } from "@/components/ui/Textarea";
import { leerDolares, type Centavos } from "@/domain";
import { DEPARTAMENTOS, leerZonas, resumenZonas, type ZonasEntrega } from "@/lib/departamentos";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Tarifas } from "../repositorio";
import { guardarTarifasDeEnvio, type EstadoTarifas } from "../actions/tarifas";
import { marcadasDe, ZonasEntregaInput, type Marcadas } from "./ZonasEntregaInput";

const t = textos.ajustes.envios;

function Grupo({
  icono,
  tono,
  titulo,
  texto,
  children,
}: {
  icono: NombreIcono;
  tono: string;
  titulo: string;
  texto: string;
  children: ReactNode;
}) {
  return (
    <section className={`${TARJETA} flex flex-col gap-4 bg-superficie shadow-dura-chica`}>
      <header className="flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro ${tono}`}>
          <Icon nombre={icono} className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">{titulo}</h2>
          <p className="text-sm text-texto-2">{texto}</p>
        </div>
      </header>
      {children}
    </section>
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

function Previa({
  retiro,
  todo,
  zonas,
  defecto,
  porDepto,
}: {
  retiro: string;
  todo: boolean;
  zonas: ZonasEntrega;
  defecto: string;
  porDepto: Record<string, string>;
}) {
  const id = useId();
  const hayRetiro = retiro.trim().length > 0;
  const defectoCentavos = montoDe(defecto, 0);
  const cubre = todo || (zonas !== null && Object.keys(zonas).length > 0);
  const departamentos = todo ? DEPARTAMENTOS : DEPARTAMENTOS.filter((d) => zonas && d in zonas);
  const filas = departamentos.map((d) => {
    const texto = porDepto[d] ?? "";
    return { d, monto: montoDe(texto, defectoCentavos), propia: texto.trim() !== "" };
  });
  const validos = filas.map((f) => f.monto).filter((n): n is Centavos => n !== null);
  const desde = validos.length ? Math.min(...validos) : defectoCentavos;
  const propias = filas.filter((f) => f.propia);
  const cobertura = todo ? t.previaTodoElPais : zonas && Object.keys(zonas).length ? t.previaZonas(resumenZonas(zonas)) : t.previaSinZonas;

  return (
    <aside aria-labelledby={id} className={`${TARJETA} relative flex flex-col gap-4 bg-crema shadow-dura lg:sticky lg:top-4 lg:self-start`}>
      <Gorila className="absolute -top-8 right-5 size-14 text-rosa" />
      <div className="pr-16">
        <h2 id={id} className="text-lg font-bold">
          {t.previa}
        </h2>
        <p className="text-sm text-texto-2">{t.previaTexto}</p>
      </div>

      <div className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${hayRetiro ? "border-teal-oscuro bg-white" : "border-dashed border-teal-oscuro/40 bg-white/70"}`}>
        <span className="flex items-center gap-2 font-bold">
          <Icon nombre="tienda" className="size-5 text-teal" />
          {t.previaRetiro}
        </span>
        {hayRetiro ? (
          <>
            <p className="text-sm font-extrabold">{t.previaGratis}</p>
            <p className="text-sm whitespace-pre-line text-texto-2">{retiro.trim()}</p>
          </>
        ) : (
          <p className="text-sm text-texto-2">{t.retiroApagado}</p>
        )}
      </div>

      <div className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${cubre ? "border-teal-oscuro bg-white" : "border-dashed border-teal-oscuro/40 bg-white/70"}`}>
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-bold">
            <Icon nombre="camion" className="size-5 text-teal" />
            {t.previaEnvio}
          </span>
          <span className="font-extrabold tabular-nums">{desde === 0 ? t.previaGratis : t.previaDesde(etiquetaDe(desde))}</span>
        </span>
        <p className="text-sm text-texto-2">{cobertura}</p>
        {cubre && propias.length > 0 && (
          <ul className="flex flex-col gap-1 border-t border-teal-oscuro/15 pt-2 text-sm">
            <li className="font-bold">{t.previaPropias}</li>
            {propias.map((f) => (
              <li key={f.d} className="flex justify-between gap-3">
                <span>{f.d}</span>
                <span className="font-extrabold tabular-nums">{etiquetaDe(f.monto)}</span>
              </li>
            ))}
            {todo && (
              <li className="flex justify-between gap-3 text-texto-2">
                <span>{t.previaResto}</span>
                <span className="font-bold tabular-nums">{etiquetaDe(defectoCentavos)}</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function TarifasForm({ tarifas }: { tarifas: Tarifas }) {
  const [estado, accion, pendiente] = useActionState<EstadoTarifas, FormData>(guardarTarifasDeEnvio, {});
  const [retiro, setRetiro] = useState(tarifas.retiro ?? "");
  const [todo, setTodo] = useState(tarifas.zonas === null);
  const [marcadas, setMarcadas] = useState<Marcadas>(() => marcadasDe(tarifas.zonas));
  const [defecto, setDefecto] = useState(dolaresTexto(tarifas.defecto));
  const [porDepto, setPorDepto] = useState<Record<string, string>>(() =>
    Object.fromEntries(DEPARTAMENTOS.map((d) => [d, d in tarifas.porDepartamento ? dolaresTexto(tarifas.porDepartamento[d]) : ""])),
  );

  const zonas: ZonasEntrega = todo ? null : leerZonas(marcadas);
  const hayRetiro = retiro.trim().length > 0;
  const defectoEtiqueta = etiquetaDe(montoDe(defecto, 0));
  const visibles = todo ? DEPARTAMENTOS : DEPARTAMENTOS.filter((d) => d in marcadas);

  return (
    <form action={accion} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <Grupo icono="tienda" tono="bg-rosa" titulo={t.retiroTitulo} texto={t.retiroTexto}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="retiro" className="text-sm font-medium">
              {t.retiro}
            </label>
            <Textarea
              id="retiro"
              name="retiro"
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
            {hayRetiro ? t.retiroActivo : t.retiroApagado}
          </p>
        </Grupo>

        <Grupo icono="camion" tono="bg-limon" titulo={t.zonas.titulo} texto={t.zonas.texto}>
          <ZonasEntregaInput todo={todo} onTodo={setTodo} marcadas={marcadas} onMarcadas={setMarcadas} />
        </Grupo>

        <Grupo icono="moneda" tono="bg-mango" titulo={t.tarifasTitulo} texto={t.tarifasTexto}>
          <div className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-limon p-4">
            <Field etiqueta={t.defecto} name="defecto" inputMode="decimal" value={defecto} onChange={(e) => setDefecto(e.target.value)} />
            <p className="text-sm text-texto-2">{t.defectoAyuda}</p>
          </div>

          {visibles.length > 0 && <p className="text-sm font-bold">{todo ? t.distinto : t.porDepartamento}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEPARTAMENTOS.map((d, i) => {
              const visible = visibles.includes(d);
              const valor = porDepto[d] ?? "";
              return (
                <div key={d} className={visible ? "flex flex-col gap-1" : "hidden"}>
                  <Field
                    etiqueta={t.departamento(d)}
                    name={`departamento_${i}`}
                    inputMode="decimal"
                    placeholder={dolaresTexto(montoDe(defecto, 0) ?? 0)}
                    value={valor}
                    onChange={(e) => setPorDepto((prev) => ({ ...prev, [d]: e.target.value }))}
                  />
                  {valor.trim() === "" && <p className="text-xs text-texto-2">{t.usaDefecto(defectoEtiqueta)}</p>}
                </div>
              );
            })}
          </div>
        </Grupo>
      </div>

      <Previa retiro={retiro} todo={todo} zonas={zonas} defecto={defecto} porDepto={porDepto} />

      <div className="lg:col-start-1">
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
      </div>
    </form>
  );
}
