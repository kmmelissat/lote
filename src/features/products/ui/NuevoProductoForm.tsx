"use client";

import { useActionState, useId, useState, useTransition, type FormEvent } from "react";
import { costoUnitario, leerDolares, MARGEN_POR_DEFECTO, precioSugerido } from "@/domain/index";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sugerido } from "@/components/ui/Sugerido";
import { MensajeError } from "@/components/ui/MensajeError";
import { FotoInput } from "./FotoInput";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoProducto, sugerirFicha, type EstadoNuevo, type FichaSugerida } from "../actions/nuevo";

const t = textos.productos.form;

const dolaresTexto = (centavos: number) => (centavos / 100).toFixed(2);

const campoCosto = ["compra", "envio", "importacion", "otro"] as const;

function costoDe(valores: Record<string, string> | undefined): number | null {
  const rubros = Object.fromEntries(
    campoCosto.flatMap((k) => {
      const monto = leerDolares(valores?.[k] ?? "");
      return monto === null ? [] : [[k, monto]];
    }),
  );
  return costoUnitario(rubros);
}

export function NuevoProductoForm({
  negocioId,
  inicial,
}: {
  negocioId: string;
  /** Valores con los que arranca el formulario, por ejemplo al repetir un producto */
  inicial?: Record<string, string>;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoNuevo, FormData>(nuevoProducto, {});
  // Si el formulario arranca con datos (otra igual), costo y ganancia se calculan desde el inicio.
  const [costoInicial] = useState(() => costoDe(inicial));
  const [ganancia, setGanancia] = useState<number | null>(() => {
    const precioInicial = leerDolares(inicial?.precio ?? "");
    return precioInicial === null || costoInicial === null ? null : precioInicial - costoInicial;
  });
  const [costo, setCosto] = useState<number | null>(costoInicial);
  const [precio, setPrecio] = useState(inicial?.precio ?? "");
  const [margen, setMargen] = useState(String(MARGEN_POR_DEFECTO));
  const [rutas, setRutas] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [sugeridos, setSugeridos] = useState<Set<keyof FichaSugerida>>(new Set());
  const [errorFoto, setErrorFoto] = useState("");
  const [leyendo, empezarLectura] = useTransition();
  const descripcionId = useId();
  const e = estado.errores ?? {};
  const v = estado.valores ?? inicial ?? {};

  // Lo que escribió la persona no se pisa: solo se llenan los campos vacíos o los que ya eran sugeridos.
  function aplicar(f: FichaSugerida) {
    const nuevos = new Set(sugeridos);
    const poner = (campo: keyof FichaSugerida, actual: string, valor: string | null, set: (s: string) => void) => {
      if (valor && (!actual.trim() || sugeridos.has(campo))) {
        set(valor);
        nuevos.add(campo);
      }
    };
    poner("nombre", nombre, f.nombre, setNombre);
    poner("descripcion", descripcion, f.descripcion, setDescripcion);
    poner("categoria", categoria, f.categoria, setCategoria);
    setSugeridos(nuevos);
  }

  function completarConFoto() {
    setErrorFoto("");
    empezarLectura(async () => {
      const r = await sugerirFicha(rutas[0]);
      if ("ficha" in r) aplicar(r.ficha);
      else setErrorFoto(r.error === "sin_ia" ? t.errorFotoSinIA : t.errorFoto);
    });
  }

  // Si la persona corrige un campo, deja de ser "sugerido".
  const editar = (campo: keyof FichaSugerida, set: (s: string) => void) => (valor: string) => {
    set(valor);
    if (sugeridos.has(campo)) {
      const nuevos = new Set(sugeridos);
      nuevos.delete(campo);
      setSugeridos(nuevos);
    }
  };

  // Ganancia en vivo: precio − costo por unidad, con las mismas funciones que usa el servidor.
  function recalcular(ev: FormEvent<HTMLFormElement>) {
    const f = new FormData(ev.currentTarget);
    const monto = (k: string) => leerDolares(String(f.get(k) ?? ""));
    const precio = monto("precio");
    const rubros = Object.fromEntries(
      campoCosto.map((k) => [k, monto(k) ?? undefined]).filter(([, m]) => m !== undefined),
    );
    const costoPorUnidad = costoUnitario(rubros);
    setCosto(costoPorUnidad);
    setGanancia(precio === null || costoPorUnidad === null ? null : precio - costoPorUnidad);
  }

  // La sugerencia aparece apenas hay costo; el margen lo cambia la persona.
  const sugerido = costo === null ? null : precioSugerido(costo, Number(margen.replace(",", ".")));

  return (
    <form action={accion} onChange={recalcular} className="flex max-w-xl flex-col gap-4">
      <FotoInput negocioId={negocioId} name="fotos" onCambio={setRutas} />
      {rutas.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button type="button" variante="secundario" className="self-start" disabled={leyendo} onClick={completarConFoto}>
            {leyendo ? t.leyendoFoto : t.completarConFoto}
          </Button>
          <p className="text-sm text-texto-2">{t.ayudaFoto}</p>
          <MensajeError>{errorFoto}</MensajeError>
        </div>
      )}
      <Field
        etiqueta={t.nombre}
        name="nombre"
        required
        value={nombre}
        onChange={(ev) => editar("nombre", setNombre)(ev.target.value)}
        sugerido={sugeridos.has("nombre")}
        error={e.nombre}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          etiqueta={t.precio}
          name="precio"
          inputMode="decimal"
          required
          value={precio}
          onChange={(ev) => setPrecio(ev.target.value)}
          error={e.precio}
        />
        <Field
          etiqueta={t.cantidad}
          name="cantidad"
          inputMode="numeric"
          defaultValue={v.cantidad ?? "1"}
          error={e.cantidad}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4">
        <legend className="px-1 text-sm font-medium">{t.costosTitulo}</legend>
        <div className="grid grid-cols-2 gap-4">
          {campoCosto.map((k) => (
            <Field key={k} etiqueta={t[k]} name={k} inputMode="decimal" defaultValue={v[k]} error={e[k]} />
          ))}
        </div>
        <p className="text-sm text-texto-2" aria-live="polite">
          {ganancia === null
            ? t.sinCostoAun
            : `${t.gananciaEnVivo}: ${formatearDolares(ganancia)}`}
        </p>
        {sugerido !== null && (
          <div className="flex flex-wrap items-end gap-4 border-t border-borde pt-3">
            {/* Sin name: el margen es solo para calcular, no se guarda */}
            <div className="w-32">
              <Field etiqueta={t.margen} inputMode="decimal" value={margen} onChange={(ev) => setMargen(ev.target.value)} />
            </div>
            <p className="min-h-12 flex-1 content-center" aria-live="polite">
              {t.precioSugerido}: <strong>{formatearDolares(sugerido)}</strong>
            </p>
            <Button type="button" variante="secundario" onClick={() => setPrecio(dolaresTexto(sugerido))}>
              {t.usarPrecio}
            </Button>
          </div>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field
          etiqueta={t.categoria}
          name="categoria"
          value={categoria}
          onChange={(ev) => editar("categoria", setCategoria)(ev.target.value)}
          sugerido={sugeridos.has("categoria")}
        />
        <Field etiqueta={t.marca} name="marca" defaultValue={v.marca} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={descripcionId} className="text-sm font-medium">
          {t.descripcionCampo}
          {sugeridos.has("descripcion") && <Sugerido />}
        </label>
        <textarea
          id={descripcionId}
          name="descripcion"
          rows={3}
          value={descripcion}
          onChange={(ev) => editar("descripcion", setDescripcion)(ev.target.value)}
          className="rounded-xl border border-borde-control bg-superficie px-4 py-3 text-base"
        />
      </div>

      <fieldset className="flex gap-6">
        <legend className="mb-1.5 text-sm font-medium">{t.condicion}</legend>
        {(["nuevo", "usado"] as const).map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="condicion"
              value={c}
              defaultChecked={(v.condicion ?? "nuevo") === c}
              className="size-5 accent-teal"
            />
            {t[c]}
          </label>
        ))}
      </fieldset>

      <MensajeError>{e.general}</MensajeError>
      <Button type="submit" disabled={pendiente}>
        {pendiente ? t.guardando : t.guardar}
      </Button>
    </form>
  );
}
