"use client";

import { useAvisarErrores } from "@/components/ui/Toast";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  costoUnitario,
  leerDolares,
  MARGEN_POR_DEFECTO,
  precioSugerido,
} from "@/domain/index";
import { MensajeError } from "@/components/ui/MensajeError";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import {
  nuevoProducto,
  sugerirFicha,
  type EstadoNuevo,
  type FichaSugerida,
} from "../actions/nuevo";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { CartelLotito, type EstadoLotito } from "./CartelLotito";
import { DetallesProducto } from "./DetallesProducto";
import { leerDetalles, type Detalle } from "../infoExtra";
import {
  atajosDeFormulario,
  Campo,
  CampoDinero,
  Cantidad,
  Etiqueta,
  estiloCampo,
  Seccion,
} from "./campos";
import { SelectorCategoria } from "./SelectorCategoria";
import { VistaPreviaProducto } from "./VistaPreviaProducto";
import { EditorVariantes } from "./EditorVariantes";
import { combinaciones, estadoDesdeVariantes, estadoVacio, filaDe, opcionNueva, type DatosFila, type EstadoEditor } from "../editorVariantes";
import { ZonaFotos } from "./ZonaFotos";
import { Button } from "@/components/ui/Button";

const t = textos.productos.form;
const l = t.lotito;

const campoCosto = ["compra", "envio", "importacion", "otro"] as const;
type CampoLotito = Extract<keyof FichaSugerida, "nombre" | "categoria" | "marca" | "descripcion">;
const ORDEN_LOTITO: CampoLotito[] = [
  "nombre",
  "categoria",
  "marca",
  "descripcion",
];
/** Lo que tarda Lotito en "escribir" cada campo, para que se sienta que va llenando uno por uno */
const PAUSA_MS = 380;

/** Lo que muestra la vista previa con variantes: el precio más bajo, cuántas unidades en total y la primera foto propia. */
function resumenVariantes(e: EstadoEditor) {
  const filas = combinaciones(e).map((c) => filaDe(e, c));
  const precios = filas.map((f) => leerDolares(f.precio)).filter((p): p is number => p !== null);
  return {
    precio: precios.length ? formatearDolares(Math.min(...precios)) : "",
    unidades: filas.reduce((n, f) => n + (Number(f.cantidad) || 0), 0),
    cuantas: filas.length,
    foto: filas.find((f) => f.fotos[0])?.fotos[0] ?? null,
  };
}

function costoDe(valores: Record<string, string> | undefined): number | null {
  const rubros = Object.fromEntries(
    campoCosto.flatMap((k) => {
      const monto = leerDolares(valores?.[k] ?? "");
      return monto === null ? [] : [[k, monto]];
    }),
  );
  return costoUnitario(rubros);
}

type Modo =
  | { tipo: "crear" }
  | {
      tipo: "editar";
      codigo: number;
      /** Un producto que es una variante: su nombre es el base y tiene su propia etiqueta */
      conVariante: boolean;
      fotos: string[];
      /** El id del producto: si es suelto y se pasa a "con variantes", queda como la primera combinación */
      id: string;
      /** Con variantes: cada una con sus datos, y los nombres de las opciones del cruce. null si es un producto suelto */
      variantes: { filas: (DatosFila & { etiqueta: string })[]; nombres: string[] } | null;
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
  const variantesIniciales = editando ? modo.variantes : null;
  const [estado, accion, pendiente] = useActionState<EstadoNuevo, FormData>(
    editando ? modo.accion : nuevoProducto,
    {},
  );
  useAvisarErrores(estado);
  const e = estado.errores ?? {};
  const v = estado.valores ?? inicial ?? {};
  // Simple o con variantes: dos pestañas. Un producto que ya tiene variantes se queda en la de variantes.
  const [tipo, setTipo] = useState<"simple" | "variantes">(variantesIniciales || v.tipo === "variantes" ? "variantes" : "simple");
  const conVariantes = tipo === "variantes";
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);

  const [costoInicial] = useState(() => costoDe(v));
  const [costo, setCosto] = useState<number | null>(costoInicial);
  const [precio, setPrecio] = useState(v.precio ?? "");
  const [margen, setMargen] = useState(String(MARGEN_POR_DEFECTO));
  const [rutas, setRutas] = useState<string[]>(editando ? modo.fotos : []);
  const [nombre, setNombre] = useState(v.nombre ?? "");
  const [cantidad, setCantidad] = useState(v.cantidad ?? "1");
  const [categoria, setCategoria] = useState(v.categoria ?? "");
  const categorias = sugerencias.categorias;
  // La categoría que Lotito vio en la foto y no está en la lista: se avisa y se manda a Ajustes, no se inventa
  const [categoriaSugerida, setCategoriaSugerida] = useState<string | null>(
    null,
  );
  const [marca, setMarca] = useState(v.marca ?? "");
  const [descripcion, setDescripcion] = useState(v.descripcion ?? "");
  const [condicion, setCondicion] = useState<"nuevo" | "usado">(
    v.condicion === "usado" ? "usado" : "nuevo",
  );
  // Lo que le da confianza a quien compra: detalles en lista y, si es usado, cómo está
  const [detalles, setDetalles] = useState<Detalle[]>(() =>
    leerDetalles(v.detalles),
  );
  // Las variantes: al editar, armadas desde las que existen; al crear, vacías con la base del precio y la cantidad
  const [editor, setEditor] = useState<EstadoEditor>(() =>
    variantesIniciales
      ? estadoDesdeVariantes(variantesIniciales.filas, variantesIniciales.nombres, { precio: "", cantidad: "1", compra: "" })
      : estadoVacio({ precio: v.precio ?? "", cantidad: v.cantidad ?? "1", compra: v.compra ?? "" }),
  );
  // Lo que Lotito llenó además de los campos de texto, para poder deshacerlo
  const [extrasLotito, setExtrasLotito] = useState({ variantes: false, detalles: false, condicion: false });

  // Lotito: lo que llenó, qué está haciendo y cuál foto ya leyó
  const [deLotito, setDeLotito] = useState<Set<CampoLotito>>(new Set());
  const [estadoLotito, setEstadoLotito] = useState<EstadoLotito>("quieto");
  const [escribiendo, setEscribiendo] = useState<Set<CampoLotito>>(new Set());
  const [, empezarLectura] = useTransition();
  // Al editar, la foto que ya tiene no se vuelve a leer: Lotito solo mira las que se agregan
  const leida = useRef<string | null>(
    editando ? (modo.fotos[0] ?? null) : null,
  );
  const temporizadores = useRef<number[]>([]);
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  const setters: Record<CampoLotito, (s: string) => void> = {
    nombre: setNombre,
    categoria: setCategoria,
    marca: setMarca,
    descripcion: setDescripcion,
  };
  const actuales: Record<CampoLotito, string> = {
    nombre,
    categoria,
    marca,
    descripcion,
  };

  // Lotito no pisa lo que escribió la persona: solo llena campos vacíos o los que él mismo había llenado.
  function aplicar(visto: FichaSugerida) {
    const vista = visto.categoria?.trim() ?? "";
    const existente = categorias.find(
      (c) => c.toLowerCase() === vista.toLowerCase(),
    );
    if (vista && !existente && !categoria.trim()) setCategoriaSugerida(vista);
    const f = { ...visto, categoria: existente ?? null };
    const llenar = ORDEN_LOTITO.filter(
      (c) => f[c] && (!actuales[c].trim() || deLotito.has(c)),
    );
    setEscribiendo(new Set(llenar));
    llenar.forEach((campo, i) => {
      temporizadores.current.push(
        window.setTimeout(
          () => {
            setters[campo](f[campo] as string);
            setDeLotito((d) => new Set(d).add(campo));
            setEscribiendo((s) => {
              const n = new Set(s);
              n.delete(campo);
              return n;
            });
            if (i === llenar.length - 1) setEstadoLotito("listo");
          },
          PAUSA_MS * (i + 1),
        ),
      );
    });
    if (!llenar.length) setEstadoLotito("listo");

    // Lo demás que vio: condición, detalles y, si hay varias versiones, las variantes. Nunca pisa lo que ya puso la persona.
    const extras = { variantes: false, detalles: false, condicion: false };
    if (visto.condicion && (condicion === "nuevo" || extrasLotito.condicion)) {
      setCondicion(visto.condicion);
      extras.condicion = visto.condicion === "usado";
    }
    if (visto.detalles.length && (!detalles.length || extrasLotito.detalles)) {
      setDetalles(visto.detalles);
      extras.detalles = true;
    }
    // Las arma si todavía no hay valores escritos (esté en la pestaña que esté) o si las había puesto él mismo
    const sinValores = editor.opciones.every((o) => !o.valores.length);
    if (visto.opciones.length && !variantesIniciales && (sinValores || extrasLotito.variantes)) {
      setEditor((ed) => ({ ...ed, opciones: visto.opciones.map((o) => opcionNueva(o.nombre, o.valores)) }));
      setTipo("variantes");
      extras.variantes = true;
    }
    setExtrasLotito(extras);
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
    if (deLotito.has(campo))
      setDeLotito((d) => {
        const n = new Set(d);
        n.delete(campo);
        return n;
      });
  };

  function deshacerLotito() {
    temporizadores.current.forEach(clearTimeout);
    deLotito.forEach((c) => setters[c](""));
    setDeLotito(new Set());
    if (extrasLotito.condicion) setCondicion("nuevo");
    if (extrasLotito.detalles) setDetalles([]);
    if (extrasLotito.variantes) {
      setTipo("simple");
      setEditor((ed) => ({ ...ed, opciones: estadoVacio().opciones }));
    }
    setExtrasLotito({ variantes: false, detalles: false, condicion: false });
    setEscribiendo(new Set());
    setEstadoLotito("quieto");
  }

  // Ganancia en vivo: precio − costo por unidad, con las mismas funciones que usa el servidor.
  function recalcular(ev: FormEvent<HTMLFormElement>) {
    const f = new FormData(ev.currentTarget);
    const rubros = Object.fromEntries(
      campoCosto
        .map((k) => [k, leerDolares(String(f.get(k) ?? "")) ?? undefined])
        .filter(([, m]) => m !== undefined),
    );
    setCosto(costoUnitario(rubros));
  }

  const precioCentavos = leerDolares(precio);
  const ganancia =
    precioCentavos === null || costo === null ? null : precioCentavos - costo;
  const margenReal =
    ganancia !== null && precioCentavos
      ? Math.round((ganancia / precioCentavos) * 100)
      : null;
  const sugerido =
    costo === null
      ? null
      : precioSugerido(costo, Number(margen.replace(",", ".")));
  const unidades =
    Number.isInteger(Number(cantidad)) && Number(cantidad) > 0
      ? Number(cantidad)
      : 1;

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
      <span className="flex h-11 items-center rounded-full border-2 border-teal-oscuro px-6 font-bold transition-colors peer-checked:bg-teal-oscuro peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
        {t[valor]}
      </span>
    </label>
  );

  const brillo = (c: CampoLotito) => escribiendo.has(c);
  const resumen = resumenVariantes(editor);

  return (
    <form
      id="form-producto"
      ref={formulario}
      action={accion}
      onChange={recalcular}
      onKeyDown={atajosDeFormulario}
      className="flex min-h-[calc(100dvh-12rem)] flex-col gap-6"
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Simple o con variantes: lo primero que se decide, y lo que cambia el resto del formulario */}
          <input type="hidden" name="tipo" value={tipo} />
          <div role="tablist" aria-label={t.tipo.titulo} className="grid grid-cols-2 gap-2 rounded-[20px] border-2 border-teal-oscuro bg-white p-1.5">
            {(["simple", "variantes"] as const).map((opcion) => {
              const bloqueada = opcion === "simple" && !!variantesIniciales;
              return (
                <button
                  key={opcion}
                  type="button"
                  role="tab"
                  aria-selected={tipo === opcion}
                  disabled={bloqueada}
                  title={bloqueada ? t.tipo.bloqueado : undefined}
                  onClick={() => setTipo(opcion)}
                  className="flex flex-col items-start rounded-2xl px-4 py-2.5 text-left transition-colors aria-selected:bg-teal-oscuro aria-selected:text-white enabled:hover:bg-crema disabled:opacity-40"
                >
                  <span className="font-bold">{t.tipo[opcion]}</span>
                  <span className="text-xs opacity-70">{t.tipo[opcion === "simple" ? "simpleAyuda" : "variantesAyuda"]}</span>
                </button>
              );
            })}
          </div>

          <ZonaFotos negocioId={negocioId} rutas={rutas} onCambio={cambiarFotos} conLotito />
          <input type="hidden" name="fotos" value={JSON.stringify(rutas)} />
          {conVariantes && <p className="-mt-3 text-sm text-texto-2">{t.tipo.fotosVariantes}</p>}
          <CartelLotito estado={estadoLotito} />
          {extrasLotito.variantes && <p className="text-sm font-medium">{l.variantesVistas}</p>}
          {(deLotito.size > 0 || extrasLotito.variantes || extrasLotito.detalles || extrasLotito.condicion) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <p className="text-texto-2">{l.revisar}</p>
              <button
                type="button"
                onClick={deshacerLotito}
                className="font-bold text-teal underline"
              >
                {l.deshacer}
              </button>
            </div>
          )}

          <Campo
            etiqueta={
              conVariantes ? textos.productos.editar.nombreVariantes : t.nombre
            }
            name="nombre"
            requerido
            placeholder={t.nombrePlaceholder}
            value={nombre}
            onChange={(ev) => editar("nombre")(ev.target.value)}
            lotito={deLotito.has("nombre")}
            trabajando={brillo("nombre")}
            error={e.nombre}
          />

          {/* Debajo del nombre: descripción y categoría; después lo que se vende (precio, precio de antes y cantidad, o
              las variantes); y al final condición, marca y detalles. Los costos quedan plegados abajo. */}
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

          {/* Categoría y, en un producto simple, la cantidad al lado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <SelectorCategoria
                etiqueta={t.categoria}
                valor={categoria}
                onCambio={editar("categoria")}
                opciones={categorias}
                error={e.categoria}
                lotito={deLotito.has("categoria")}
                trabajando={brillo("categoria")}
                sugerida={categoriaSugerida}
              />
            {!conVariantes && <Cantidad valor={cantidad} onCambio={setCantidad} error={e.cantidad} />}
          </div>

          {conVariantes ? (
            <EditorVariantes
              negocioId={negocioId}
              estado={editor}
              onCambio={setEditor}
              error={e.variantes}
              idLibre={editando && !variantesIniciales ? modo.id : null}
            />
          ) : (
            <div className="flex flex-col gap-1">
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
                <CampoDinero etiqueta={t.precioAnterior.etiqueta} name="precio_anterior" defaultValue={v.precio_anterior} error={e.precio_anterior} />
              </div>
              <p className="text-sm text-texto-2">{t.precioAnterior.ayuda}</p>
            </div>
          )}

          {/* Condición, marca y detalles, juntos: lo que da confianza a quien compra */}
          <div className="flex flex-col gap-4 rounded-[20px] border-2 border-teal-oscuro/15 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-sm font-bold">{t.condicion}</legend>
                <div className="flex gap-3">{(["nuevo", "usado"] as const).map(chip)}</div>
              </fieldset>
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
            <datalist id={`${id}-marcas`}>
              {sugerencias.marcas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>

            {condicion === "usado" && (
              <div className="flex flex-col gap-1.5">
                <Etiqueta htmlFor={`${id}-estado`}>{t.estadoDetalle.etiqueta}</Etiqueta>
                <input
                  id={`${id}-estado`}
                  name="estado_detalle"
                  maxLength={200}
                  defaultValue={v.estado_detalle}
                  placeholder={t.estadoDetalle.placeholder}
                  className={estiloCampo}
                />
                <p className="text-sm text-texto-2">{t.estadoDetalle.ayuda}</p>
              </div>
            )}

            <DetallesProducto filas={detalles} onCambio={setDetalles} />
          </div>

          <Seccion titulo={t.costosSeccion} ayuda={t.costosAyuda}>
            {conVariantes && (
              <p className="text-sm text-texto-2">
                {textos.productos.editar.grupo.compartidos}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Con variantes, el costo de compra va en cada fila de la tabla */}
              {campoCosto
                .filter((k) => !conVariantes || k !== "compra")
                .map((k) => (
                  <CampoDinero
                    key={k}
                    etiqueta={t[k]}
                    name={k}
                    defaultValue={v[k]}
                    error={e[k]}
                  />
                ))}
            </div>
            {!conVariantes && (
              <div
                aria-live="polite"
                className="rounded-2xl border-2 border-teal-oscuro bg-crema p-4"
              >
                {ganancia === null ? (
                  <p className="text-texto-2">{t.resumenSinCosto}</p>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    {[
                      [t.costoUnidad, formatearDolares(costo!)],
                      [t.precio, formatearDolares(precioCentavos!)],
                      [t.gananciaUnidad, formatearDolares(ganancia)],
                      [
                        t.margenReal,
                        margenReal === null ? "–" : `${margenReal} %`,
                      ],
                    ].map(([etiqueta, valor], i) => (
                      <div key={etiqueta} className="flex flex-col">
                        <dt className="text-xs text-texto-2">{etiqueta}</dt>
                        <dd
                          className={`font-bold tabular-nums ${i === 2 ? "text-xl text-teal" : "text-lg"}`}
                        >
                          {valor}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
            {sugerido !== null && !conVariantes && (
              <div className="flex flex-wrap items-end gap-4">
                {/* Sin name: el margen es solo para calcular, no se guarda */}
                <div className="w-32">
                  <Campo
                    etiqueta={t.margen}
                    inputMode="decimal"
                    value={margen}
                    onChange={(ev) => setMargen(ev.target.value)}
                  />
                </div>
                <p
                  className="min-h-12 flex-1 content-center"
                  aria-live="polite"
                >
                  {t.precioSugerido}:{" "}
                  <strong>{formatearDolares(sugerido)}</strong>
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


          <MensajeError>{e.general}</MensajeError>
        </div>

        <VistaPreviaProducto
          foto={rutas[0] ?? (conVariantes ? resumen.foto : null)}
          nombre={nombre}
          precio={conVariantes ? resumen.precio : precioCentavos === null ? "" : formatearDolares(precioCentavos)}
          unidades={conVariantes ? resumen.unidades : unidades}
          variantes={conVariantes ? resumen.cuantas : 0}
          categoria={categoria}
          condicion={condicion}
        />
      </div>
      {/* En el código el principal va primero (es el que dispara Enter); `order` lo deja a la derecha */}
      <BarraFormulario>
        <Button type="submit" variante="mango" disabled={pendiente} className="order-3">
          {pendiente
            ? editando
              ? textos.productos.editar.guardando
              : t.guardando
            : editando
              ? textos.productos.editar.guardar
              : t.guardar}
        </Button>
        {editando ? (
          <Link
            href={`/productos/${modo.codigo}`}
            className="order-2 inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-6 font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica"
          >
            {textos.productos.editar.cancelar}
          </Link>
        ) : (
          <button
            type="submit"
           
            name="otro"
            value="1"
            disabled={pendiente}
            className="order-2 inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-6 font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica disabled:opacity-60"
          >
            {t.guardarOtro}
          </button>
        )}
        <span className="order-1 hidden whitespace-nowrap text-xs text-texto-2 lg:block">{t.atajo}</span>
      </BarraFormulario>
    </form>
  );
}
