"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirmar } from "@/components/ui/Confirmar";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { hoyEnElSalvador, nombreVisible } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { borrarPromocion, encenderPromocion } from "../actions/promociones";
import { resumenDePromocion, textoDeEstado } from "../descripcion";
import type { Promocion } from "../repositorio";

const t = textos.promociones;

// "2026-11-05" como el día de El Salvador (a mediodía UTC cae el mismo día en cualquier zona)
const verFecha = (dia: string | null) => (dia ? formatearFecha(new Date(`${dia}T12:00:00Z`)) : null);

const COLOR = { vigente: "bg-limon", programada: "bg-mango", vencida: "bg-superficie", apagada: "bg-superficie" } as const;

export function ListaPromociones({ promociones }: { promociones: Promocion[] }) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const hoy = hoyEnElSalvador(new Date());

  function encender(p: Promocion) {
    setError(undefined);
    empezar(async () => {
      const r = await encenderPromocion(p.id, !p.activa);
      if (r.error) return setError(r.error);
      avisar(p.activa ? t.apagadaHecho : t.encendidaHecho, { tipo: "exito" });
      router.refresh();
    });
  }

  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar(p: Promocion) {
    setError(undefined);
    const si = await confirmar({ titulo: t.borrarTitulo(p.nombre), texto: t.borrarTexto, confirmar: t.borrarSi, peligro: true });
    if (!si) return;
    empezar(async () => {
      const r = await borrarPromocion(p.id);
      if (r.error) return setError(r.error);
      avisar(t.borradaHecho, { tipo: "exito" });
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="tus-promociones" className="flex flex-col gap-3">
      <h2 id="tus-promociones" className="text-lg font-bold">
        {t.tusPromociones}
      </h2>
      <MensajeError>{error}</MensajeError>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {promociones.map((p) => {
          const { estado, texto } = textoDeEstado(p, hoy);
          const normal = p.productos.reduce((suma, x) => suma + x.precio * x.cantidad, 0);
          const ahorro = p.precioPack === null ? null : normal - p.precioPack;
          const desde = verFecha(p.desde);
          const hasta = verFecha(p.hasta);
          return (
            <li key={p.id}>
              <Card className={`flex h-full flex-col gap-3 ${estado === "vigente" || estado === "programada" ? "" : "opacity-80"}`}>
                <div className="flex flex-col items-start gap-2">
                  <span className={`rounded-full border-2 border-teal-oscuro px-3 py-1 text-sm font-bold ${COLOR[estado]}`}>{texto}</span>
                  <h3 className="font-bold leading-tight">{p.nombre}</h3>
                  <p className="text-sm">
                    {resumenDePromocion(p)}
                    {p.tipo === "pack" && ahorro !== null && ahorro > 0 && ` · ${t.porSeparado(formatearDolares(normal), formatearDolares(ahorro))}`}
                  </p>
                </div>
                <p className="text-sm text-texto-2">
                  {t.contiene(p.productos.map((x) => t.cantidadDe(x.cantidad, nombreVisible(x.nombre, x.variante))).join(", "))}
                </p>
                {(desde || hasta) && <p className="text-sm text-texto-2">{t.fechas(desde, hasta)}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <Button type="button" variante="secundario" disabled={pendiente} onClick={() => encender(p)} className="text-sm">
                    {p.activa ? t.apagar : t.encender}
                  </Button>
                  <BotonIcono icono="borrar" etiqueta={t.borrarEtiqueta(p.nombre)} variante="suave" tamano="chico" disabled={pendiente} onClick={() => borrar(p)} />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
