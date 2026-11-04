"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AtajosDeFechas } from "@/components/ui/AtajosDeFechas";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { useToast } from "@/components/ui/Toast";
import { hoyEnElSalvador, leerDolares, nombreBase } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevaPromocion } from "../actions/promociones";
import { analizarLlevasPagas, analizarPack, nombreSugerido, pendientesDePromocion } from "../analisis";
import { anuncioDePromocion } from "../descripcion";
import { agruparOpciones, nombreDeOpcion, type GrupoDeProductos, type OpcionProductoPromocion } from "../grupos";
import type { TipoPromocion } from "../repositorio";
import { EnTuPack, MAXIMO_POR_PACK, ProductoElegido, SelectorProductos, type Elegidos } from "./SelectorProductos";
import { PENDIENTE, VistaPreviaPromocion } from "./VistaPreviaPromocion";

const t = textos.promociones;

/**
 * Crear un pack o un "llevá y pagá". A la izquierda se arma (productos, precio o regla, fechas); a la derecha (o debajo,
 * en pantallas angostas) se ve cómo queda en la vitrina, cuánto ahorra el cliente, cuánto le queda a la tienda, qué
 * avisos hay y qué falta. En pantallas angostas el botón de crear queda pegado abajo.
 */
export function FormPromocion({ tipo, productos }: { tipo: TipoPromocion; productos: OpcionProductoPromocion[] }) {
  const router = useRouter();
  const { avisar } = useToast();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string>();
  const [nombre, setNombre] = useState("");
  const [elegidos, setElegidos] = useState<Elegidos>({});
  // Lo elegido para un pack no sirve para un "llevá y pagá" (que es de un solo producto), y al revés
  const [tipoAnterior, setTipoAnterior] = useState(tipo);
  if (tipo !== tipoAnterior) {
    setTipoAnterior(tipo);
    setElegidos({});
  }
  const [precioPack, setPrecioPack] = useState("");
  const [lleva, setLleva] = useState(2);
  const [paga, setPaga] = useState(1);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const hoy = hoyEnElSalvador(new Date());
  const grupos = useMemo(() => agruparOpciones(productos), [productos]);
  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const seleccionados = Object.keys(elegidos).flatMap((id) => {
    const p = porId.get(id);
    return p ? [p] : [];
  });
  const grupoElegido: GrupoDeProductos | undefined = tipo === "llevas_pagas" ? grupos.find((g) => g.miembros.some((m) => elegidos[m.id] > 0)) : undefined;

  const precioLeido = leerDolares(precioPack);
  const analisisPack = tipo === "pack" ? analizarPack(seleccionados.map((p) => ({ precio: p.precio, costo: p.costo, cantidad: elegidos[p.id] })), precioLeido) : null;
  const analisisLlevas = tipo === "llevas_pagas" && seleccionados.length ? analizarLlevasPagas(seleccionados, lleva, paga) : null;
  const precioEjemplo = seleccionados.length ? Math.round(seleccionados.reduce((s, p) => s + p.precio, 0) / seleccionados.length) : null;

  // Un pack con varios productos se llama como ellos; si son variantes de uno solo, con su variante
  const basesDelPack = [...new Set(seleccionados.map((p) => nombreBase(p.nombre, p.variante)))];
  const sugerido = nombreSugerido(
    tipo,
    tipo === "pack" ? (basesDelPack.length > 1 ? basesDelPack : seleccionados.map(nombreDeOpcion)) : grupoElegido ? [grupoElegido.nombre] : [],
    lleva,
    paga,
  );
  const nombreFinal = nombre.trim() || sugerido;

  const pendientes = pendientesDePromocion({ tipo, productos: seleccionados.length, estadoPrecio: analisisPack?.estado ?? "ok" });

  const nombreBaseDe = (codigo: number) => {
    const p = productos.find((o) => o.codigo === codigo);
    return p ? nombreBase(p.nombre, p.variante) : undefined;
  };
  const anuncio =
    seleccionados.length && !(tipo === "pack" && analisisPack?.estado === "sin_precio")
      ? anuncioDePromocion(
          { tipo, precioPack: precioLeido, lleva, paga, productos: seleccionados.map((p) => ({ codigo: p.codigo, cantidad: tipo === "pack" ? elegidos[p.id] : 1 })) },
          nombreBaseDe,
        )
      : null;

  const avisos = avisosDe(tipo, seleccionados, elegidos, grupoElegido);

  function cambiar(id: string, diferencia: number) {
    setElegidos((actual) => {
      const nueva = Math.min(MAXIMO_POR_PACK, (actual[id] ?? 0) + diferencia);
      const { [id]: _quitado, ...resto } = actual;
      void _quitado;
      return nueva > 0 ? { ...resto, [id]: nueva } : resto;
    });
  }

  function crear() {
    setError(undefined);
    empezar(async () => {
      const r = await nuevaPromocion({
        tipo,
        nombre: nombreFinal,
        productos: seleccionados.map((p) => ({ productoId: p.id, cantidad: tipo === "pack" ? elegidos[p.id] : 1 })),
        precioPack,
        lleva,
        paga,
        desde,
        hasta,
      });
      if (r.error) return setError(r.error);
      avisar(t.creada, { tipo: "exito" });
      router.push("/productos/promociones");
    });
  }

  const boton = (
    <Button type="submit" variante="mango" disabled={pendiente || pendientes.length > 0} className="w-full">
      {pendiente ? t.creando : t.crear}
    </Button>
  );

  return (
    <form
      id="form-promocion"
      className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-5 xl:pb-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!pendientes.length) crear();
      }}
    >
      <Card role="region" aria-label={t.nueva} className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="productos-promocion" className="flex flex-col gap-3">
          <div>
            <h2 id="productos-promocion" className="font-bold">
              {t.productos}
            </h2>
            <p className="text-sm text-texto-2">{tipo === "pack" ? t.productosPack : t.productosLlevasPagas}</p>
          </div>
          {tipo === "pack" && <EnTuPack productos={seleccionados} elegidos={elegidos} cambiar={cambiar} />}
          {tipo === "llevas_pagas" && grupoElegido ? (
            <ProductoElegido
              grupo={grupoElegido}
              elegidos={elegidos}
              quitar={(id) => cambiar(id, -1)}
              cambiarProducto={() => setElegidos({})}
            />
          ) : (
            <SelectorProductos
              grupos={grupos}
              modo={tipo}
              elegidos={elegidos}
              cambiar={cambiar}
              elegirGrupo={(g) => setElegidos(Object.fromEntries(g.miembros.map((m) => [m.id, 1])))}
            />
          )}
        </section>

        {tipo === "pack" ? (
          <div className="flex flex-col gap-2">
            <Field etiqueta={t.precioPack} inputMode="decimal" placeholder="$0.00" value={precioPack} onChange={(e) => setPrecioPack(e.target.value)} />
            {analisisPack && analisisPack.normal > 0 && <p className="text-sm text-texto-2">{t.precioPackAyuda(formatearDolares(analisisPack.normal))}</p>}
            {analisisPack?.estado === "no_abarata" && <p className="text-sm font-medium text-error">{t.errorPackNoAbarata}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.lleva}</span>
              <Select
                value={String(lleva)}
                onChange={(e) => {
                  const nuevo = Number(e.target.value);
                  setLleva(nuevo);
                  setPaga((p) => Math.min(p, nuevo - 1));
                }}
              >
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {t.unidades(n)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.paga}</span>
              <Select value={String(paga)} onChange={(e) => setPaga(Number(e.target.value))}>
                {Array.from({ length: lleva - 1 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t.unidades(n)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{t.duracion}</legend>
          <AtajosDeFechas
            sinFecha
            alElegir={(d, h) => {
              setDesde(d);
              setHasta(h);
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectorFecha
              etiqueta={t.desde}
              valor={desde}
              alCambiar={(d) => {
                setDesde(d);
                if (hasta && d && hasta < d) setHasta("");
              }}
              min={hoy}
              opcional
            />
            <SelectorFecha etiqueta={t.hasta} valor={hasta} alCambiar={setHasta} min={desde || hoy} opcional />
          </div>
          <p className="text-sm text-texto-2">{t.fechasAyuda}</p>
        </fieldset>

        <Field etiqueta={t.nombre} value={nombre} maxLength={60} placeholder={sugerido} onChange={(e) => setNombre(e.target.value)} />
      </Card>

      <aside className="min-w-0 xl:sticky xl:top-4">
        <VistaPreviaPromocion
          tipo={tipo}
          nombre={nombreFinal}
          nombreAutomatico={!nombre.trim()}
          fotos={seleccionados.map((p) => p.foto)}
          anuncio={anuncio}
          pack={analisisPack}
          precioPack={precioLeido}
          llevas={analisisLlevas}
          lleva={lleva}
          paga={paga}
          precioEjemplo={precioEjemplo}
          avisos={avisos}
          pendientes={pendientes}
        >
          <div className="hidden flex-col gap-3 xl:flex">
            <MensajeError>{error}</MensajeError>
            {boton}
          </div>
        </VistaPreviaPromocion>
      </aside>

      <BarraFormulario className="xl:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <MensajeError>{error}</MensajeError>
          <p className="line-clamp-2 text-sm">
            {pendientes.length ? (
              <span className="text-texto-2">{t.faltaCorto(PENDIENTE[pendientes[0]])}</span>
            ) : (
              <>
                <span className="font-bold">{anuncio?.titulo ?? nombreFinal}</span>
                {analisisPack?.ahorro ? <span className="text-texto-2"> · {t.ahorras(formatearDolares(analisisPack.ahorro))}</span> : null}
              </>
            )}
          </p>
        </div>
        <div className="shrink-0">{boton}</div>
      </BarraFormulario>
    </form>
  );
}

/** Lo que conviene saber antes de crearla: productos agotados, con poco stock o que ya están en otra promoción. */
function avisosDe(tipo: TipoPromocion, seleccionados: OpcionProductoPromocion[], elegidos: Elegidos, grupo: GrupoDeProductos | undefined): string[] {
  const avisos: string[] = [];
  if (tipo === "llevas_pagas") {
    // Un producto con variantes cuenta como uno: se avisa una vez
    const nombre = grupo?.nombre ?? "";
    if (seleccionados.length && seleccionados.every((p) => p.disponibles === 0)) avisos.push(t.avisoAgotado(nombre));
    const yaEn = seleccionados.find((p) => p.enPromocion);
    if (yaEn?.enPromocion) avisos.push(t.avisoYaEnPromocion(nombre, yaEn.enPromocion));
    return avisos;
  }
  for (const p of seleccionados) {
    const nombre = nombreDeOpcion(p);
    if (p.disponibles === 0) avisos.push(t.avisoAgotado(nombre));
    else if (elegidos[p.id] > p.disponibles) avisos.push(t.avisoPocoStock(nombre, p.disponibles, elegidos[p.id]));
    if (p.enPromocion) avisos.push(t.avisoYaEnPromocion(nombre, p.enPromocion));
  }
  return avisos;
}
