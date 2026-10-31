"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirmar } from "@/components/ui/Confirmar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { useToast } from "@/components/ui/Toast";
import { RUBROS } from "@/features/catalog/rubros";
import { textos } from "@/lib/textos";
import { borrarCategoriaAccion, cambiarRubroAccion, crearCategoriaAccion, renombrarCategoriaAccion } from "../actions/categorias";
import type { CategoriaConConteo } from "../repositorio";

const t = textos.productos.categoriasPanel;

const OPCIONES_RUBRO = RUBROS.map((r) => ({ valor: r.id, etiqueta: r.nombre }));

function Fila({ c }: { c: CategoriaConConteo }) {
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
      setEditando(false);
      avisar(t.renombrada, { tipo: "exito" });
    });
  }
  function cambiarRubro(rubro: string) {
    empezar(async () => {
      const r = await cambiarRubroAccion(c.nombre, rubro);
      avisar(r.error ?? t.rubroCambiado, { tipo: r.error ? "error" : "exito" });
    });
  }
  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar() {
    const si = await confirmar({
      titulo: t.confirmarTitulo(c.nombre),
      texto: c.productos > 0 ? t.confirmarConProductos(c.productos) : t.confirmarSinProductos,
      confirmar: t.borrar,
      peligro: true,
    });
    if (!si) return;
    empezar(async () => {
      const r = await borrarCategoriaAccion(c.nombre);
      avisar(r.error ?? t.borrada, { tipo: r.error ? "error" : "exito" });
    });
  }

  return (
    <li>
      <Card className="flex flex-col gap-3">
        {editando ? (
          <div className="flex flex-col gap-3">
            <Field etiqueta={t.nuevoNombre} value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} error={error} autoFocus />
            <div className="flex flex-wrap gap-2">
              <Button variante="mango" icono="check" tamano="chico" disabled={pendiente} onClick={guardar}>
                {t.guardar}
              </Button>
              <Button
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
                {t.cancelar}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-teal-oscuro">
                <Icon nombre="caja" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{c.nombre}</p>
                <p className="text-sm text-texto-2">{t.productos(c.productos)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-texto-2">{t.rubro}</span>
              <ListaDesplegable
                variante="compacto"
                valor={c.rubro}
                alCambiar={cambiarRubro}
                opciones={OPCIONES_RUBRO}
                placeholder={t.rubro}
                disabled={pendiente}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variante="suave" icono="editar" tamano="chico" disabled={pendiente} onClick={() => setEditando(true)}>
                {t.renombrar}
              </Button>
              <Button variante="suave" icono="borrar" tamano="chico" disabled={pendiente} onClick={borrar} className="text-error">
                {t.borrar}
              </Button>
            </div>
          </>
        )}
      </Card>
    </li>
  );
}

function NuevaCategoria() {
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("");
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const { avisar } = useToast();

  function crear() {
    setError(undefined);
    empezar(async () => {
      const r = await crearCategoriaAccion(nombre, rubro);
      if (r.error) return setError(r.error);
      setNombre("");
      setRubro("");
      avisar(t.creada, { tipo: "exito" });
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-bold">{t.nueva}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field
          etiqueta={t.nombre}
          placeholder={t.nombrePlaceholder}
          value={nombre}
          maxLength={40}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nombre.trim() && rubro) {
              e.preventDefault();
              crear();
            }
          }}
          error={error}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.rubro}</span>
          <ListaDesplegable variante="panel" valor={rubro} alCambiar={setRubro} opciones={OPCIONES_RUBRO} placeholder={t.rubroPlaceholder} />
          <p className="text-sm text-texto-2">{t.rubroAyuda}</p>
        </div>
        <Button variante="mango" icono="mas" disabled={pendiente || !nombre.trim() || !rubro} onClick={crear}>
          {t.crear}
        </Button>
      </div>
    </Card>
  );
}

/** Las categorías del negocio: se crean acá (con su rubro), se renombran y se borran. Los productos solo eligen de esta lista. */
export function PanelCategorias({ categorias }: { categorias: CategoriaConConteo[] }) {
  return (
    <div className="flex flex-col gap-4">
      <NuevaCategoria />
      {categorias.length === 0 ? (
        <EmptyState titulo={t.vacioTitulo} texto={t.vacioTexto} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categorias.map((c) => (
            <Fila key={c.nombre} c={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
