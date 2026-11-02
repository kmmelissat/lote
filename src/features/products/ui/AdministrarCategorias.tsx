"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { Ventana } from "@/components/ui/Ventana";
import { RUBROS, rubroPorNombre } from "@/features/catalog/rubros";
import { textos } from "@/lib/textos";
import { borrarCategoriaAccion, cambiarRubroAccion, crearCategoriaAccion, listarCategoriasAccion, renombrarCategoriaAccion } from "../actions/categorias";
import type { CategoriaConConteo } from "../repositorio";
import { Campo } from "./campos";

const t = textos.productos.form.categorias;
const p = textos.productos.categoriasPanel;

const OPCIONES_RUBRO = RUBROS.map((r) => ({ valor: r.id, etiqueta: r.nombre }));

type Acciones = {
  /** Después de cualquier cambio: la lista al día, para que el selector del producto la use */
  recargar: () => Promise<void>;
  /** Una categoría se renombró o se borró (nuevo es null): si era la elegida en el producto, hay que cambiarla */
  alCambiarNombre: (de: string, nuevo: string | null) => void;
};

function Fila({ c, elegida, recargar, alCambiarNombre, elegir }: { c: CategoriaConConteo; elegida: boolean; elegir: () => void } & Acciones) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(c.nombre);
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const { avisar } = useToast();
  const confirmar = useConfirmar();

  function guardar() {
    setError(undefined);
    empezar(async () => {
      const r = await renombrarCategoriaAccion(c.nombre, nombre);
      if (r.error) return setError(r.error);
      alCambiarNombre(c.nombre, nombre.trim().replace(/\s+/g, " "));
      setEditando(false);
      await recargar();
      avisar(p.renombrada, { tipo: "exito" });
    });
  }

  function cambiarRubro(rubro: string) {
    empezar(async () => {
      const r = await cambiarRubroAccion(c.nombre, rubro);
      if (!r.error) await recargar();
      avisar(r.error ?? p.rubroCambiado, { tipo: r.error ? "error" : "exito" });
    });
  }

  // El modal de confirmación se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar() {
    const si = await confirmar({
      titulo: p.confirmarTitulo(c.nombre),
      texto: c.productos > 0 ? p.confirmarConProductos(c.productos) : p.confirmarSinProductos,
      confirmar: p.borrar,
      peligro: true,
    });
    if (!si) return;
    empezar(async () => {
      const r = await borrarCategoriaAccion(c.nombre);
      if (!r.error) {
        alCambiarNombre(c.nombre, null);
        await recargar();
      }
      avisar(r.error ?? p.borrada, { tipo: r.error ? "error" : "exito" });
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-borde p-3">
      {editando ? (
        <div className="flex flex-col gap-2">
          <Campo etiqueta={p.nuevoNombre} value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} error={error} autoFocus />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variante="mango" icono="check" tamano="chico" disabled={pendiente || !nombre.trim()} onClick={guardar}>
              {p.guardar}
            </Button>
            <Button
              type="button"
              variante="suave"
              icono="x"
              tamano="chico"
              disabled={pendiente}
              onClick={() => {
                setEditando(false);
                setNombre(c.nombre);
                setError(undefined);
              }}
            >
              {p.cancelar}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.nombre}</p>
              <p className="text-xs text-texto-2">{p.productos(c.productos)}</p>
            </div>
            {elegida ? (
              <span className="rounded-full bg-teal-fondo px-3 py-1 text-xs font-bold text-teal-oscuro">{t.elegida}</span>
            ) : (
              <Button type="button" variante="suave" tamano="chico" onClick={elegir}>
                {t.elegir}
              </Button>
            )}
          </div>
          <ListaDesplegable variante="compacto" valor={c.rubro} alCambiar={cambiarRubro} opciones={OPCIONES_RUBRO} placeholder={p.rubro} disabled={pendiente} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variante="suave" icono="editar" tamano="chico" disabled={pendiente} onClick={() => setEditando(true)}>
              {p.renombrar}
            </Button>
            <Button type="button" variante="suave" icono="borrar" tamano="chico" disabled={pendiente} onClick={borrar} className="text-error">
              {p.borrar}
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

/**
 * La ventana de las categorías, dentro del formulario de un producto: crear, renombrar, cambiar el rubro y borrar sin salir de
 * donde se está (ir a Ajustes en medio de un producto hace perder lo que ya se escribió). El enlace a Ajustes queda como alternativa.
 * Sin <form>: vive dentro del formulario del producto y Enter crea la categoría, no guarda el producto.
 */
export function AdministrarCategorias({
  ventana,
  version,
  seleccionada,
  alElegir,
  alCambiarLista,
  alCambiarNombre,
  sugerencia = "",
}: {
  ventana: RefObject<HTMLDialogElement | null>;
  /** Sube cada vez que se abre: es la señal para traer la lista al día */
  version: number;
  seleccionada: string;
  alElegir: (nombre: string) => void;
  alCambiarLista: (nombres: string[]) => void;
  alCambiarNombre: (de: string, nuevo: string | null) => void;
  /** Un nombre para dejar escrito al abrir (la categoría que Lotito vio) */
  sugerencia?: string;
}) {
  const router = useRouter();
  const { avisar } = useToast();
  const [filas, setFilas] = useState<CategoriaConConteo[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("otros");
  const [rubroElegido, setRubroElegido] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();

  async function recargar() {
    const f = await listarCategoriasAccion();
    setFilas(f);
    alCambiarLista(f.map((c) => c.nombre));
    router.refresh();
  }

  // Cada vez que se abre, el formulario de arriba arranca limpio (o con la categoría que vio Lotito). Se ajusta al dibujar, no en un efecto.
  const [versionVista, setVersionVista] = useState(0);
  if (version !== versionVista) {
    setVersionVista(version);
    setNombre(sugerencia);
    setRubro(rubroPorNombre(sugerencia) ?? "otros");
    setRubroElegido(false);
    setError(undefined);
  }

  // Y trae la lista al día
  useEffect(() => {
    if (version === 0) return;
    void listarCategoriasAccion().then((f) => {
      setFilas(f);
      alCambiarLista(f.map((c) => c.nombre));
    });
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  function escribir(texto: string) {
    setNombre(texto);
    // El rubro se adivina por el nombre mientras no lo haya elegido la persona
    if (!rubroElegido) setRubro(rubroPorNombre(texto) ?? "otros");
  }

  function crear() {
    setError(undefined);
    empezar(async () => {
      const limpio = nombre.trim().replace(/\s+/g, " ");
      const r = await crearCategoriaAccion(limpio, rubro);
      if (r.error) return setError(r.error);
      alElegir(limpio);
      setNombre("");
      setRubro("otros");
      setRubroElegido(false);
      await recargar();
      avisar(t.creada(limpio), { tipo: "exito" });
    });
  }

  return (
    <Ventana ref={ventana} titulo={t.administrarTitulo} ayuda={t.administrarAyuda}>
      <section aria-label={t.nuevaTitulo} className="flex flex-col gap-3 rounded-2xl bg-fondo p-3">
        <h3 className="font-bold">{t.nuevaTitulo}</h3>
        <Campo
          etiqueta={t.nombreNueva}
          value={nombre}
          maxLength={40}
          placeholder={t.nombrePlaceholder}
          onChange={(e) => escribir(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (nombre.trim() && !pendiente) crear();
            }
          }}
          autoComplete="off"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.rubro}</span>
          <ListaDesplegable
            variante="campo"
            valor={rubro}
            alCambiar={(v) => {
              setRubro(v);
              setRubroElegido(true);
            }}
            opciones={OPCIONES_RUBRO}
            placeholder={t.rubro}
          />
          <p className="text-xs text-texto-2">{t.rubroAyuda}</p>
        </div>
        <MensajeError>{error}</MensajeError>
        <Button type="button" variante="mango" icono="mas" className="self-start" disabled={pendiente || !nombre.trim()} onClick={crear}>
          {pendiente ? t.creando : t.crear}
        </Button>
      </section>

      {filas === null ? (
        <p className="text-sm text-texto-2">{t.cargando}</p>
      ) : filas.length === 0 ? (
        <p className="text-sm text-texto-2">{p.vacioTexto}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((c) => (
            <Fila key={c.nombre} c={c} elegida={c.nombre === seleccionada} elegir={() => { alElegir(c.nombre); ventana.current?.close(); }} recargar={recargar} alCambiarNombre={alCambiarNombre} />
          ))}
        </ul>
      )}

      <Link href="/ajustes/categorias" className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-teal underline">
        <Icon nombre="ajustes" className="size-4" />
        {t.abrirEnAjustes}
      </Link>
    </Ventana>
  );
}
