"use client";

import { useState } from "react";
import { Interruptor } from "@/components/ui/Interruptor";
import { DEPARTAMENTOS, MUNICIPIOS, type Departamento, type ZonasEntrega } from "@/lib/departamentos";
import { textos } from "@/lib/textos";

const t = textos.ajustes.envios.zonas;

type Marcadas = Partial<Record<Departamento, string[]>>;

const ficha = (activa: boolean) =>
  `inline-flex min-h-9 cursor-pointer items-center rounded-full border-2 px-3 text-sm font-bold transition-colors ${
    activa ? "border-teal-oscuro bg-limon" : "border-teal-oscuro/25 bg-white hover:border-teal-oscuro"
  } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal`;

/**
 * Dónde entrega la tienda: todo el país, o departamentos con sus municipios. Viaja al servidor como un
 * JSON en un campo oculto; un departamento con todos (o ningún) municipio marcado es el departamento entero.
 */
export function ZonasEntregaInput({ inicial }: { inicial: ZonasEntrega }) {
  const [todo, setTodo] = useState(inicial === null);
  // Por dentro, "el departamento entero" es la lista con todos sus municipios: así se marcan y desmarcan uno a uno
  const [marcadas, setMarcadas] = useState<Marcadas>(() =>
    Object.fromEntries(Object.entries(inicial ?? {}).map(([d, m]) => [d, m.length ? m : [...MUNICIPIOS[d as Departamento]]])),
  );

  const alternarDepartamento = (d: Departamento) =>
    setMarcadas(({ [d]: actual, ...resto }) => (actual ? resto : { ...resto, [d]: [...MUNICIPIOS[d]] }));

  const alternarMunicipio = (d: Departamento, m: string) =>
    setMarcadas((prev) => {
      const lista = prev[d] ?? [];
      const nueva = lista.includes(m) ? lista.filter((x) => x !== m) : [...lista, m];
      if (nueva.length) return { ...prev, [d]: nueva };
      const resto = { ...prev };
      delete resto[d];
      return resto;
    });

  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-superficie p-4">
      <legend className="sr-only">{t.titulo}</legend>
      <div>
        <h2 className="font-bold">{t.titulo}</h2>
        <p className="text-sm text-texto-2">{t.texto}</p>
      </div>
      <Interruptor name="todo_el_pais" titulo={t.todoElPais} ayuda={t.todoElPaisAyuda} activo={todo} onCambio={setTodo} />
      <input type="hidden" name="zonas" value={JSON.stringify(marcadas)} />

      {!todo && (
        <ul className="flex flex-col gap-2">
          {DEPARTAMENTOS.map((d) => {
            const lista = marcadas[d];
            return (
              <li key={d} className={`rounded-xl border-2 p-3 ${lista ? "border-teal-oscuro bg-crema" : "border-teal-oscuro/15"}`}>
                <label className="flex min-h-9 cursor-pointer items-center gap-3 font-bold">
                  <input type="checkbox" checked={!!lista} onChange={() => alternarDepartamento(d)} className="size-5 accent-teal" />
                  {d}
                  {lista?.length === MUNICIPIOS[d].length && <span className="text-sm font-medium text-texto-2">· {t.departamentoEntero}</span>}
                </label>
                {lista && (
                  <div role="group" aria-label={t.municipios(d)} className="mt-2 flex flex-wrap gap-2 pl-8">
                    {MUNICIPIOS[d].map((m) => (
                      <label key={m} className={ficha(lista.includes(m))}>
                        <input type="checkbox" checked={lista.includes(m)} onChange={() => alternarMunicipio(d, m)} className="sr-only" />
                        {m.slice(d.length).trim() || m}
                      </label>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
