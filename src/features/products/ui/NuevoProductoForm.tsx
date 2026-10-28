"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { costoUnitario, leerDolares, MARGEN_POR_DEFECTO, precioSugerido } from "@/domain/index";
import { Monito } from "@/components/ui/Monito";
import { MensajeError } from "@/components/ui/MensajeError";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoProducto, sugerirFicha, type EstadoNuevo, type FichaSugerida } from "../actions/nuevo";
import { atajosDeFormulario, BarraGuardar, Campo, CampoDinero, Cantidad, Etiqueta, estiloCampo, Seccion } from "./campos";
import { estadoNuevo, filasDe, grupoNuevo, VariantesInput, type EstadoVariantes } from "./VariantesInput";
import { VistaPreviaProducto } from "./VistaPreviaProducto";
import { ZonaFotos } from "./ZonaFotos";

const t = textos.productos.form;
const l = t.lotito;

const dolaresTexto = (centavos: number) => (centavos / 100).toFixed(2);
const campoCosto = ["compra", "envio", "importacion", "otro"] as const;
type CampoLotito = Exclude<keyof FichaSugerida, "opciones">;
const ORDEN_LOTITO: CampoLotito[] = ["nombre", "categoria", "marca", "descripcion"];
/** Lo que tarda Lotito en "escribir" cada campo, para que se sienta que va llenando uno por uno */
const PAUSA_MS = 380;

type EstadoLotito = "quieto" | "leyendo" | "listo" | "borrosa" | "sin_ia";

function costoDe(valores: Record<string, string> | undefined): number | null {
  const rubros = Object.fromEntries(
    campoCosto.flatMap((k) => {
      const monto = leerDolares(valores?.[k] ?? "");
      return monto === null ? [] : [[k, monto]];
    }),
  );
  return costoUnitario(rubros);
}

/** Lotito en pose y con una frase corta: lo que está haciendo con la foto. */
function CartelLotito({ estado }: { estado: EstadoLotito }) {
  const [frase, setFrase] = useState(0);
  useEffect(() => {
    if (estado !== "leyendo") return;
    const id = setInterval(() => setFrase((f) => (f + 1) % 2), 1600);
    return () => clearInterval(id);
  }, [estado]);
  if (estado === "quieto") return null;
  const contenido = {
    leyendo: { pose: "asoma" as const, texto: frase === 0 ? l.mirando : l.buscando, tono: "bg-limon" },
    listo: { pose: "thumbsup" as const, texto: l.listo, tono: "bg-teal-fondo" },
    borrosa: { pose: "asoma" as const, texto: l.borrosa, tono: "bg-rosa-palido" },
    sin_ia: { pose: "asoma" as const, texto: l.sinIA, tono: "bg-crema" },
  }[estado];
  return (
    <p
      role="status"
      className={`flex animate-entra items-center gap-3 rounded-2xl border-2 border-teal-oscuro px-4 py-3 font-medium ${contenido.tono}`}
    >
      <Monito nombre={contenido.pose} className={`w-12 shrink-0 text-teal ${estado === "leyendo" ? "animate-pulse" : ""}`} />
      {contenido.texto}
    </p>
  );
}

type Modo =
  | { tipo: "crear" }
  | {
      tipo: "editar";
      codigo: number;
      /** Un producto que es una variante: su nombre es el base y tiene su propia etiqueta */
      conVariante: boolean;
      fotos: string[];
      accion: (anterior: EstadoNuevo, datos: FormData) => Promise<EstadoNuevo>;
    };

/** El formulario de producto: es el mismo para crear y para editar, así que no hay dos pantallas distintas. */
export function NuevoProductoForm({
  negocioId,
  inicial,
  sugerencias,
  modo = { tipo: "crear" },
}: {
  negocioId: string;
  /** Valores con los que arranca el formulario: repetir un producto, o el producto que se edita */
  inicial?: Record<string, string>;
  /** Categorías y marcas que ya usó, para completar mientras escribe */
  sugerencias: { categorias: string[]; marcas: string[] };
  modo?: Modo;
}) {
  const editando = modo.tipo === "editar";
  const [estado, accion, pendiente] = useActionState<EstadoNuevo, FormData>(editando ? modo.accion : nuevoProducto, {});
  const e = estado.errores ?? {};
  const v = estado.valores ?? inicial ?? {};
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);

  const [costoInicial] = useState(() => costoDe(v));
  const [costo, setCosto] = useState<number | null>(costoInicial);
  const [precio, setPrecio] = useState(v.precio ?? "");
  const [margen, setMargen] = useState(String(MARGEN_POR_DEFECTO));
  const [rutas, setRutas] = useState<string[]>(editando ? modo.fotos : []);
  const [etiquetaVar, setEtiquetaVar] = useState(v.variante ?? "");
  const [nombre, setNombre] = useState(v.nombre ?? "");
  const [cantidad, setCantidad] = useState(v.cantidad ?? "1");
  const [categoria, setCategoria] = useState(v.categoria ?? "");
  const [marca, setMarca] = useState(v.marca ?? "");
  const [descripcion, setDescripcion] = useState(v.descripcion ?? "");
  const [condicion, setCondicion] = useState<"nuevo" | "usado">(v.condicion === "usado" ? "usado" : "nuevo");
  const [estadoVar, setEstadoVar] = useState<EstadoVariantes | null>(null);
  const variantes = estadoVar ? filasDe(estadoVar) : null;
  // Lo que Lotito vio en la foto como posibles variantes, a la espera de que la persona diga sí o no
  const [ofertaVar, setOfertaVar] = useState<{ nombre: string; valores: string[] } | null>(null);
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [costosAbiertos, setCostosAbiertos] = useState(costoInicial !== null);

  // Lotito: lo que llenó, qué está haciendo y cuál foto ya leyó
  const [deLotito, setDeLotito] = useState<Set<CampoLotito>>(new Set());
  const [estadoLotito, setEstadoLotito] = useState<EstadoLotito>("quieto");
  const [escribiendo, setEscribiendo] = useState<Set<CampoLotito>>(new Set());
  const [, empezarLectura] = useTransition();
  // Al editar, la foto que ya tiene no se vuelve a leer: Lotito solo mira las que se agregan
  const leida = useRef<string | null>(editando ? (modo.fotos[0] ?? null) : null);
  const temporizadores = useRef<number[]>([]);
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  const setters: Record<CampoLotito, (s: string) => void> = {
    nombre: setNombre,
    categoria: setCategoria,
    marca: setMarca,
    descripcion: setDescripcion,
  };
  const actuales: Record<CampoLotito, string> = { nombre, categoria, marca, descripcion };

  // Lotito no pisa lo que escribió la persona: solo llena campos vacíos o los que él mismo había llenado.
  function aplicar(f: FichaSugerida) {
    const llenar = ORDEN_LOTITO.filter((c) => f[c] && (!actuales[c].trim() || deLotito.has(c)));
    if (llenar.some((c) => c !== "nombre")) setDetallesAbiertos(true);
    setEscribiendo(new Set(llenar));
    llenar.forEach((campo, i) => {
      temporizadores.current.push(
        window.setTimeout(() => {
          setters[campo](f[campo] as string);
          setDeLotito((d) => new Set(d).add(campo));
          setEscribiendo((s) => {
            const n = new Set(s);
            n.delete(campo);
            return n;
          });
          if (i === llenar.length - 1) setEstadoLotito("listo");
        }, PAUSA_MS * (i + 1)),
      );
    });
    if (!llenar.length) setEstadoLotito("listo");
    const oferta = f.opciones[0];
    if (oferta && !estadoVar && !editando) setOfertaVar(oferta);
  }

  // Apenas hay una foto nueva arranca solo: un solo gesto, sin botón de "analizar".
  function leerFoto(ruta: string) {
    leida.current = ruta;
    setEstadoLotito("leyendo");
    setEscribiendo(new Set(ORDEN_LOTITO.filter((c) => !actuales[c].trim())));
    empezarLectura(async () => {
      const r = await sugerirFicha(ruta);
      if ("ficha" in r) aplicar(r.ficha);
      else {
        setEscribiendo(new Set());
        setEstadoLotito(r.error === "sin_ia" ? "sin_ia" : "borrosa");
      }
    });
  }

  function cambiarFotos(nuevas: string[]) {
    setRutas(nuevas);
    if (nuevas[0] && nuevas[0] !== leida.current) leerFoto(nuevas[0]);
  }

  const editar = (campo: CampoLotito) => (valor: string) => {
    setters[campo](valor);
    if (deLotito.has(campo)) setDeLotito((d) => {
      const n = new Set(d);
      n.delete(campo);
      return n;
    });
  };

  function deshacerLotito() {
    temporizadores.current.forEach(clearTimeout);
    deLotito.forEach((c) => setters[c](""));
    setDeLotito(new Set());
    setEscribiendo(new Set());
    setEstadoLotito("quieto");
  }

  // Ganancia en vivo: precio − costo por unidad, con las mismas funciones que usa el servidor.
  function recalcular(ev: FormEvent<HTMLFormElement>) {
    const f = new FormData(ev.currentTarget);
    const rubros = Object.fromEntries(
      campoCosto.map((k) => [k, leerDolares(String(f.get(k) ?? "")) ?? undefined]).filter(([, m]) => m !== undefined),
    );
    setCosto(costoUnitario(rubros));
  }

  const precioCentavos = leerDolares(precio);
  const ganancia = precioCentavos === null || costo === null ? null : precioCentavos - costo;
  const margenReal = ganancia !== null && precioCentavos ? Math.round((ganancia / precioCentavos) * 100) : null;
  const sugerido = costo === null ? null : precioSugerido(costo, Number(margen.replace(",", ".")));
  const unidades = Number.isInteger(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1;

  const chip = (valor: "nuevo" | "usado") => (
    <label key={valor} className="cursor-pointer">
      <input
        type="radio"
        name="condicion"
        value={valor}
        checked={condicion === valor}
        onChange={() => setCondicion(valor)}
        className="peer sr-only"
      />
      <span className="flex h-11 items-center rounded-full border-2 border-teal-oscuro px-6 font-bold transition-colors peer-checked:bg-mango peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
        {t[valor]}
      </span>
    </label>
  );

  const brillo = (c: CampoLotito) => escribiendo.has(c);

  return (
    <form
      ref={formulario}
      action={accion}
      onChange={recalcular}
      onKeyDown={atajosDeFormulario}
      className="flex min-h-[calc(100dvh-12rem)] flex-col gap-6"
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <ZonaFotos negocioId={negocioId} rutas={rutas} onCambio={cambiarFotos} />
        <input type="hidden" name="fotos" value={JSON.stringify(rutas)} />
        <CartelLotito estado={estadoLotito} />
        {ofertaVar && !estadoVar && (
          <div className="flex animate-entra flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3">
            <p className="font-medium">{textos.productos.form.variantes.lotitoVe(ofertaVar.nombre, ofertaVar.valores)}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const base = estadoNuevo();
                  setEstadoVar({ ...base, grupos: [base.grupos[0], grupoNuevo(ofertaVar.nombre, ofertaVar.valores)] });
                  setOfertaVar(null);
                }}
                className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro bg-mango px-5 text-sm font-bold"
              >
                {textos.productos.form.variantes.lotitoSi}
              </button>
              <button
                type="button"
                onClick={() => setOfertaVar(null)}
                className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro bg-white px-5 text-sm font-bold"
              >
                {textos.productos.form.variantes.lotitoNo}
              </button>
            </div>
          </div>
        )}
        {deLotito.size > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <p className="text-texto-2">{l.revisar}</p>
            <button type="button" onClick={deshacerLotito} className="font-bold text-teal underline">
              {l.deshacer}
            </button>
          </div>
        )}

        {editando && modo.conVariante && (
          <Campo
            etiqueta={textos.productos.editar.variante}
            name="variante"
            requerido
            value={etiquetaVar}
            onChange={(ev) => setEtiquetaVar(ev.target.value)}
            error={e.variante}
          />
        )}
        <Campo
          etiqueta={editando && modo.conVariante ? textos.productos.editar.nombreVariantes : t.nombre}
          name="nombre"
          requerido
          placeholder={t.nombrePlaceholder}
          value={nombre}
          onChange={(ev) => editar("nombre")(ev.target.value)}
          lotito={deLotito.has("nombre")}
          trabajando={brillo("nombre")}
          error={e.nombre}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoDinero
            etiqueta={t.precio}
            name="precio"
            requerido
            placeholder={t.precioPlaceholder}
            value={precio}
            onChange={(ev) => setPrecio(ev.target.value)}
            error={e.precio}
          />
          {estadoVar === null && <Cantidad valor={cantidad} onCambio={setCantidad} error={e.cantidad} />}
        </div>

        {!editando && <VariantesInput valor={estadoVar} onCambio={setEstadoVar} error={e.variantes} />}

        <Seccion titulo={t.costosSeccion} ayuda={t.costosAyuda} abierta={costosAbiertos} onAlternar={() => setCostosAbiertos((a) => !a)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campoCosto.map((k) => (
              <CampoDinero key={k} etiqueta={t[k]} name={k} defaultValue={v[k]} error={e[k]} />
            ))}
          </div>
          <div aria-live="polite" className="rounded-2xl border-2 border-teal-oscuro bg-crema p-4">
            {ganancia === null ? (
              <p className="text-texto-2">{t.resumenSinCosto}</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                {[
                  [t.costoUnidad, formatearDolares(costo!)],
                  [t.precio, formatearDolares(precioCentavos!)],
                  [t.gananciaUnidad, formatearDolares(ganancia)],
                  [t.margenReal, margenReal === null ? "–" : `${margenReal} %`],
                ].map(([etiqueta, valor], i) => (
                  <div key={etiqueta} className="flex flex-col">
                    <dt className="text-xs text-texto-2">{etiqueta}</dt>
                    <dd className={`font-bold tabular-nums ${i === 2 ? "text-xl text-teal" : "text-lg"}`}>{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {sugerido !== null && (
            <div className="flex flex-wrap items-end gap-4">
              {/* Sin name: el margen es solo para calcular, no se guarda */}
              <div className="w-32">
                <Campo etiqueta={t.margen} inputMode="decimal" value={margen} onChange={(ev) => setMargen(ev.target.value)} />
              </div>
              <p className="min-h-12 flex-1 content-center" aria-live="polite">
                {t.precioSugerido}: <strong>{formatearDolares(sugerido)}</strong>
              </p>
              <button
                type="button"
                onClick={() => setPrecio(dolaresTexto(sugerido))}
                className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
              >
                {t.usarPrecio}
              </button>
            </div>
          )}
        </Seccion>

        <Seccion titulo={t.masDetalles} ayuda={t.masDetallesAyuda} abierta={detallesAbiertos} onAlternar={() => setDetallesAbiertos((a) => !a)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              etiqueta={t.categoria}
              name="categoria"
              list={`${id}-categorias`}
              placeholder={t.categoriaPlaceholder}
              value={categoria}
              onChange={(ev) => editar("categoria")(ev.target.value)}
              lotito={deLotito.has("categoria")}
              trabajando={brillo("categoria")}
            />
            <Campo
              etiqueta={t.marca}
              name="marca"
              list={`${id}-marcas`}
              placeholder={t.marcaPlaceholder}
              value={marca}
              onChange={(ev) => editar("marca")(ev.target.value)}
              lotito={deLotito.has("marca")}
              trabajando={brillo("marca")}
            />
          </div>
          <datalist id={`${id}-categorias`}>
            {sugerencias.categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id={`${id}-marcas`}>
            {sugerencias.marcas.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor={`${id}-descripcion`} lotito={deLotito.has("descripcion")}>
              {t.descripcionCampo}
            </Etiqueta>
            <textarea
              id={`${id}-descripcion`}
              name="descripcion"
              rows={3}
              value={descripcion}
              onChange={(ev) => editar("descripcion")(ev.target.value)}
              className={`${estiloCampo} h-auto py-3 ${brillo("descripcion") ? "animate-pulse bg-limon/40" : ""} ${deLotito.has("descripcion") ? "border-teal-oscuro bg-limon/20" : ""}`}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-bold">{t.condicion}</legend>
            <div className="flex gap-3">{(["nuevo", "usado"] as const).map(chip)}</div>
          </fieldset>
        </Seccion>

        <MensajeError>{e.general}</MensajeError>

      </div>

      <VistaPreviaProducto
        foto={rutas[0] ?? null}
        nombre={nombre}
        precio={precioCentavos === null ? "" : formatearDolares(precioCentavos)}
        unidades={unidades}
        variantes={variantes?.length ?? 0}
        categoria={categoria}
        condicion={condicion}
      />
      </div>

      {/* La barra de guardar flota abajo de la pantalla siempre; en el celular queda sobre el menú */}
      <BarraGuardar>
        <button
          type="submit"
          disabled={pendiente}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango px-8 font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 sm:flex-none"
        >
          {pendiente ? (editando ? textos.productos.editar.guardando : t.guardando) : editando ? textos.productos.editar.guardar : t.guardar}
        </button>
        {editando ? (
          <Link
            href={`/productos/${modo.codigo}`}
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-6 font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica"
          >
            {textos.productos.editar.cancelar}
          </Link>
        ) : (
          <button
            type="submit"
            name="otro"
            value="1"
            disabled={pendiente}
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-6 font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica disabled:opacity-60"
          >
            {t.guardarOtro}
          </button>
        )}
        <span className="hidden text-xs text-texto-2 lg:block">{t.atajo}</span>
      </BarraGuardar>
    </form>
  );
}
