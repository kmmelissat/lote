"use client";

import { useAvisarErrores } from "@/components/ui/Toast";
import { useActionState, useId, useRef, useState, type FormEvent } from "react";
import {
  type Actividad,
  type Cuenta,
  costoUnitario,
  leerDolares,
  MARGEN_POR_DEFECTO,
  precioSugerido,
} from "@/domain/index";
import { MensajeError } from "@/components/ui/MensajeError";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoProducto, type EstadoNuevo } from "../actions/nuevo";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { CartelLotito } from "./CartelLotito";
import { BloqueForm } from "./BloqueForm";
import { useFichaLotito } from "./useFichaLotito";
import { DetallesProducto } from "./DetallesProducto";
import {
  atajosDeFormulario,
  Campo,
  CampoDinero,
  Cantidad,
  Etiqueta,
  estiloCampo,
} from "./campos";
import { LugarDeCompra } from "./LugarDeCompra";
import { SelectorCategoria } from "./SelectorCategoria";
import { VistaPreviaProducto } from "./VistaPreviaProducto";
import { EditorVariantes } from "./EditorVariantes";
import { combinaciones, estadoDesdeVariantes, estadoVacio, filaDe, type DatosFila, type EstadoEditor } from "../editorVariantes";
import { ZonaFotos } from "./ZonaFotos";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OpcionRadio } from "@/components/ui/OpcionRadio";

const t = textos.productos.form;
const l = t.lotito;

const campoCosto = ["compra", "envio", "importacion", "mano_obra", "otro"] as const;
/** Los costos que se piden además del principal: quien produce suma su mano de obra y no importa; quien revende, al revés. */
const COSTOS_EXTRA: Record<Actividad, readonly (typeof campoCosto)[number][]> = {
  compro_vendo: ["envio", "importacion", "otro"],
  produzco: ["mano_obra", "envio", "otro"],
  ambos: ["mano_obra", "envio", "importacion", "otro"],
};

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
  actividad = "compro_vendo",
  cuentas = [],
}: {
  negocioId: string;
  /** Las cuentas del negocio, para elegir de cuál salió el dinero de la compra */
  /** (solo al crear; al editar no hay compra) */
  cuentas?: readonly Cuenta[];
  /** Valores con los que arranca el formulario: repetir un producto, o el producto que se edita */
  inicial?: Record<string, string>;
  /** Marcas que ya usó, para completar mientras escribe */
  sugerencias: { marcas: string[] };
  modo?: Modo;
  /** Qué hace el negocio: cambia cómo se llaman y cuáles son los costos */
  actividad?: Actividad;
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
  const [cantidad, setCantidad] = useState(v.cantidad ?? "1");
  // Las variantes: al editar, armadas desde las que existen; al crear, vacías con la base del precio y la cantidad
  const [editor, setEditor] = useState<EstadoEditor>(() =>
    variantesIniciales
      ? estadoDesdeVariantes(variantesIniciales.filas, variantesIniciales.nombres, { precio: "", cantidad: "1", compra: "" })
      : estadoVacio({ precio: v.precio ?? "", cantidad: v.cantidad ?? "1", compra: v.compra ?? "" }),
  );
  // Al pasar a variantes, lo que ya escribiste (precio, cantidad y costo) se reparte: cada combinación arranca con eso y lo cambiás donde difiera
  const pasarAVariantes = () => {
    const compra = new FormData(formulario.current ?? undefined).get("compra");
    setEditor((ed) => ({
      ...ed,
      base: {
        precio: precio.trim() || ed.base.precio,
        cantidad: cantidad.trim() || ed.base.cantidad,
        compra: typeof compra === "string" && compra.trim() ? compra : ed.base.compra,
      },
    }));
    setTipo("variantes");
  };
  const {
    ficha: { nombre, categoria, marca, descripcion, condicion, detalles },
    setCondicion,
    setDetalles,
    deLotito,
    estadoLotito,
    extrasLotito,
    hayLotito,
    brillo,
    cambiarFotos,
    editar,
    deshacerLotito,
    estaAbierto,
    alternar,
  } = useFichaLotito({
    fotoInicial: editando ? (modo.fotos[0] ?? null) : null,
    v,
    variantesIniciales,
    editor,
    setEditor,
    setTipo,
    setRutas,
  });

  // Una foto que se quita de la galería (arriba) también sale de las variantes que la tenían
  function cambiarFotosYVariantes(nuevas: string[]) {
    const quitadas = rutas.filter((r) => !nuevas.includes(r));
    if (quitadas.length)
      setEditor((ed) => ({
        ...ed,
        filas: Object.fromEntries(Object.entries(ed.filas).map(([k, f]) => [k, { ...f, fotos: f.fotos.filter((r) => !quitadas.includes(r)) }])),
      }));
    cambiarFotos(nuevas);
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
  const ganancia = precioCentavos === null || costo === null ? null : precioCentavos - costo;
  const margenReal = ganancia !== null && precioCentavos ? Math.round((ganancia / precioCentavos) * 100) : null;
  const sugerido = costo === null ? null : precioSugerido(costo, Number(margen.replace(",", ".")));
  const unidades = Number.isInteger(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1;
  const resumen = resumenVariantes(editor);
  const e2 = textos.productos.editar;
  const b = t.bloques;

  // Un producto que ya trae un costo de otro tipo lo sigue mostrando: si no, al guardar se perdería
  const costosExtra = campoCosto.filter((k) => k !== "compra" && (COSTOS_EXTRA[actividad].includes(k) || v[k]?.trim()));
  const errorCostos = Boolean(e.envio || e.importacion || e.mano_obra || e.otro);

  const vista = {
    foto: rutas[0] ?? (conVariantes ? resumen.foto : null),
    nombre,
    precio: conVariantes ? resumen.precio : precioCentavos === null ? "" : formatearDolares(precioCentavos),
    unidades: conVariantes ? resumen.unidades : unidades,
    variantes: conVariantes ? resumen.cuantas : 0,
    categoria,
  };

  const guardarTexto = pendiente ? (editando ? e2.guardando : t.guardando) : editando ? e2.guardar : t.guardar;

  return (
    <form
      id="form-producto"
      ref={formulario}
      action={accion}
      onChange={recalcular}
      onKeyDown={atajosDeFormulario}
      className="flex min-h-[calc(100dvh-12rem)] flex-col gap-6 "
    >
      <input type="hidden" name="tipo" value={tipo} />
      {/* En pantalla ancha: a la izquierda la tarjeta del producto (se arma sola) y a la derecha los pasos con los campos repartidos
          en columnas. En la angosta: una sola columna, y la tarjeta se abre con "Ver cómo queda". Guardar va en la barra de abajo. */}
      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="hidden lg:sticky lg:top-4 lg:block">
          <VistaPreviaProducto soloFicha {...vista} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-6 [&>*+*]:border-t [&>*+*]:border-borde [&>*+*]:pt-6">
            <BloqueForm numero={1} titulo={b.foto.titulo} ayuda={b.foto.ayuda} tono="limon" listo={rutas.length > 0}>
              <ZonaFotos negocioId={negocioId} rutas={rutas} onCambio={cambiarFotosYVariantes} conLotito />
              <input type="hidden" name="fotos" value={JSON.stringify(rutas)} />
              <CartelLotito
                estado={estadoLotito}
                accion={
                  hayLotito && estadoLotito === "listo" ? (
                    <button type="button" onClick={deshacerLotito} className="font-bold text-teal underline">
                      {l.deshacer}
                    </button>
                  ) : undefined
                }
              />
            </BloqueForm>

            <BloqueForm numero={2} titulo={b.nombrePrecio.titulo} ayuda={b.nombrePrecio.ayuda} tono="mango" listo={nombre.trim() !== "" && (conVariantes || precioCentavos !== null)}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta={conVariantes ? e2.nombreVariantes : t.nombre}
                  name="nombre"
                  requerido
                  placeholder={t.nombrePlaceholder}
                  value={nombre}
                  onChange={(ev) => editar("nombre")(ev.target.value)}
                  lotito={deLotito.has("nombre")}
                  trabajando={brillo("nombre")}
                  error={e.nombre}
                />
                <SelectorCategoria
                  etiqueta={t.categoria}
                  valor={categoria}
                  onCambio={editar("categoria")}
                  error={e.categoria}
                  lotito={deLotito.has("categoria")}
                  trabajando={brillo("categoria")}
                />
              </div>
              {conVariantes ? (
                <p className="text-sm text-texto-2">{t.tarjetas.precioVariantes}</p>
              ) : (
                <>
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
                    {/* Ya no se edita aquí (las ofertas van por Ofertas), pero un producto que lo traía no lo pierde al guardar */}
                    {v.precio_anterior ? <input type="hidden" name="precio_anterior" defaultValue={v.precio_anterior} /> : null}
                    <CampoDinero etiqueta={actividad === "produzco" ? t.tarjetas.costoMateriales : t.tarjetas.costoCompra} name="compra" defaultValue={v.compra} error={e.compra} />
                    <Cantidad valor={cantidad} onCambio={setCantidad} error={e.cantidad} />
                  </div>
                  <div aria-live="polite" className="rounded-2xl bg-superficie px-4 py-3">
                    {ganancia === null ? (
                      <p className="text-sm text-texto-2">{t.resumenSinCosto}</p>
                    ) : (
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm text-texto-2">{t.gananciaUnidad}</span>
                        <strong className="text-xl tabular-nums text-teal">{formatearDolares(ganancia)}</strong>
                        {margenReal !== null && <span className="text-sm text-texto-2">· {t.margenReal} {margenReal} %</span>}
                      </p>
                    )}
                  </div>
                </>
              )}
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
            </BloqueForm>
          </Card>

          <Card className="flex flex-col gap-6 [&>*+*]:border-t [&>*+*]:border-borde [&>*+*]:pt-6">
            <BloqueForm
              numero={3}
              titulo={b.masInfo.titulo}
              ayuda={b.masInfo.ayuda}
              tono="limon"
              opcional
              lotito={deLotito.has("marca") || extrasLotito.detalles || extrasLotito.condicion}
              resumen={[marca.trim(), condicion === "usado" ? t.usado : t.nuevo].filter(Boolean).join(" · ")}
              abierto={estaAbierto("masInfo")}
              onAlternar={() => alternar("masInfo")}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-sm font-bold">{t.condicion}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["nuevo", "usado"] as const).map((c) => (
                      <OpcionRadio key={c} name="condicion" value={c} titulo={t[c]} checked={condicion === c} onChange={() => setCondicion(c)} />
                    ))}
                  </div>
                </fieldset>
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
                </div>
              )}
              <DetallesProducto filas={detalles} onCambio={setDetalles} />
            </BloqueForm>

            <BloqueForm
              numero={4}
              titulo={b.variantes.titulo}
              ayuda={b.variantes.ayuda}
              tono="celeste"
              opcional
              lotito={extrasLotito.variantes && conVariantes}
              resumen={conVariantes ? t.variantesChip(resumen.cuantas) : b.variantes.sin}
              abierto={estaAbierto("variantes", true, Boolean(e.variantes))}
              onAlternar={() => alternar("variantes", true, Boolean(e.variantes))}
            >
              {conVariantes ? (
                <>
                  {extrasLotito.variantes && <p className="text-sm font-medium">{l.variantesVistas}</p>}
                  <EditorVariantes
                    deLotito={extrasLotito.variantes}
                    negocioId={negocioId}
                    fotosProducto={rutas}
                    estado={editor}
                    onCambio={setEditor}
                    error={e.variantes}
                    idLibre={editando && !variantesIniciales ? modo.id : null}
                  />
                  {variantesIniciales ? (
                    <p className="text-sm text-texto-2">{t.tipo.bloqueado}</p>
                  ) : (
                    <Button type="button" variante="suave" tamano="chico" icono="x" className="self-start" onClick={() => setTipo("simple")}>
                      {t.tarjetas.quitarVariantes}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-texto-2">{t.tarjetas.variantesTexto}</p>
                  <Button type="button" variante="suave" icono="mas" className="self-start" onClick={pasarAVariantes}>
                    {t.tarjetas.agregarVariantes}
                  </Button>
                </>
              )}
            </BloqueForm>

            <BloqueForm
              numero={5}
              titulo={b.costos.titulo}
              ayuda={b.costos.ayuda}
              tono="rosa"
              opcional
              resumen={conVariantes ? b.costos.compartidos : b.costos.resumen}
              abierto={estaAbierto("costos", false, errorCostos)}
              onAlternar={() => alternar("costos", false, errorCostos)}
            >
              {conVariantes && <p className="text-sm text-texto-2">{e2.grupo.compartidos}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {costosExtra.map((k) => (
                  <CampoDinero key={k} etiqueta={t[k]} name={k} defaultValue={v[k]} error={e[k]} />
                ))}
              </div>
              {sugerido !== null && !conVariantes && (
                <div className="flex flex-wrap items-end gap-4">
                  {/* Sin name: el margen es solo para calcular, no se guarda */}
                  <div className="w-32">
                    <Campo etiqueta={t.margen} inputMode="decimal" value={margen} onChange={(ev) => setMargen(ev.target.value)} />
                  </div>
                  <p className="min-h-12 flex-1 content-center" aria-live="polite">
                    {t.precioSugerido}: <strong>{formatearDolares(sugerido)}</strong>
                  </p>
                  <Button type="button" variante="suave" icono="check" onClick={() => setPrecio(dolaresTexto(sugerido))}>
                    {t.usarPrecio}
                  </Button>
                </div>
              )}
            </BloqueForm>

            {/* Fuera del bloque de costos, que viene cerrado: así se ve sin tener que abrirlo */}
            {!editando && (
              <div className="border-t border-borde pt-4">
                <LugarDeCompra cuentas={cuentas} />
              </div>
            )}
          </Card>

          <MensajeError>{e.general}</MensajeError>
        </div>
      </div>

      {/* En el código el principal va primero (es el que dispara Enter); `order` lo deja a la derecha */}
      <BarraFormulario className="max-md:grid max-md:grid-cols-2 max-md:gap-2">
        <Button type="submit" variante="mango" icono="check" disabled={pendiente} className="order-3">
          {editando || pendiente ? (
            guardarTexto
          ) : (
            <>
              <span className="md:hidden">{t.guardarCorto}</span>
              <span className="max-md:hidden">{guardarTexto}</span>
            </>
          )}
        </Button>
        {editando ? (
          <ButtonLink href={`/productos/${modo.codigo}`} variante="secundario" icono="x" className="order-2">
            {e2.cancelar}
          </ButtonLink>
        ) : (
          <Button type="submit" name="otro" value="1" variante="secundario" icono="mas" disabled={pendiente} className="order-2">
            <span className="md:hidden">{t.guardarOtroCorto}</span>
            <span className="max-md:hidden">{t.guardarOtro}</span>
          </Button>
        )}
      </BarraFormulario>
    </form>
  );
}

