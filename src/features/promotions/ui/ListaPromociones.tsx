"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Interruptor } from "@/components/ui/Interruptor";
import { MensajeError } from "@/components/ui/MensajeError";
import { TarjetaPromocion } from "@/components/ui/TarjetaPromocion";
import { useToast } from "@/components/ui/Toast";
import { hoyEnElSalvador, nombreVisible } from "@/domain";
import { formatearDia, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { borrarPromocion, encenderPromocion } from "../actions/promociones";
import { textoDeEstado } from "../descripcion";
import type { Promocion } from "../repositorio";

const t = textos.promociones;

// "2026-11-05" como el día de El Salvador (a mediodía UTC cae el mismo día en cualquier zona)
const verFecha = (dia: string | null) => (dia ? formatearDia(dia) : null);

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
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
        {promociones.map((p) => {
          const { estado, texto } = textoDeEstado(p, hoy);
          const normal = p.productos.reduce((suma, x) => suma + x.precio * x.cantidad, 0);
          const ahorro = p.precioPack === null ? 0 : normal - p.precioPack;
          const desde = verFecha(p.desde);
          const hasta = verFecha(p.hasta);
          return (
            <li key={p.id}>
              <TarjetaPromocion
                tipo={p.tipo}
                sello={p.tipo === "pack" ? t.pack : t.sello(p.lleva ?? 0, p.paga ?? 0)}
                estado={estado}
                textoEstado={texto}
                titulo={p.nombre}
                precio={
                  p.tipo === "pack" && p.precioPack !== null
                    ? {
                        ahora: formatearDolares(p.precioPack),
                        antes: ahorro > 0 ? formatearDolares(normal) : null,
                        ahorro: ahorro > 0 ? t.ahorras(formatearDolares(ahorro)) : null,
                      }
                    : undefined
                }
                cubre={t.contiene(p.productos.map((x) => t.cantidadDe(x.cantidad, nombreVisible(x.nombre, x.variante))).join(", "))}
                fechas={desde || hasta ? t.fechas(desde, hasta) : null}
                pie={
                  <>
                    <div className="min-w-0 flex-1">
                      <Interruptor
                        titulo={p.activa ? t.encendida : t.apagada}
                        etiqueta={t.interruptor(p.nombre)}
                        activo={p.activa}
                        disabled={pendiente}
                        onCambio={() => encender(p)}
                      />
                    </div>
                    <BotonIcono icono="borrar" etiqueta={t.borrarEtiqueta(p.nombre)} variante="suave" tamano="chico" disabled={pendiente} onClick={() => borrar(p)} />
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
