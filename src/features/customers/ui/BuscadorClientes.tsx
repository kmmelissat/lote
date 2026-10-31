"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { textos } from "@/lib/textos";
import { esOrdenCliente, ORDENES_CLIENTES, type OrdenCliente } from "../filtro";

const t = textos.clientes;

type Estado = { texto: string; soloConSaldo: boolean; orden: OrdenCliente };

function direccion({ texto, soloConSaldo, orden }: Estado) {
  const q = new URLSearchParams();
  if (texto.trim()) q.set("q", texto);
  if (soloConSaldo) q.set("saldo", "1");
  if (orden !== "deben") q.set("orden", orden);
  const cadena = q.toString();
  return cadena ? `/clientes?${cadena}` : "/clientes";
}

/** La búsqueda filtra al escribir (sin recargar a lo bruto) y queda en la dirección. */
export function BuscadorClientes({ texto, soloConSaldo, orden }: Estado) {
  const router = useRouter();
  const [valor, setValor] = useState(texto);
  // Si el texto de la dirección cambia desde afuera (atrás, limpiar filtros), el campo lo sigue
  const [textoVisto, setTextoVisto] = useState(texto);
  if (texto !== textoVisto) {
    setTextoVisto(texto);
    setValor(texto);
  }
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  return (
    <CampoBusqueda
      className="min-w-48 md:max-w-md"
      role="searchbox"
      aria-label={t.buscar}
      placeholder={t.placeholder}
      value={valor}
      maxLength={80}
      onChange={(e) => {
        const q = e.target.value.slice(0, 80);
        setValor(q);
        window.clearTimeout(espera.current);
        espera.current = setTimeout(() => router.replace(direccion({ texto: q, soloConSaldo, orden }), { scroll: false }), 200);
      }}
    />
  );
}

/** El orden de la lista: va a la derecha de los chips de filtro y tiene su misma forma. */
export function OrdenarClientes({ texto, soloConSaldo, orden }: Estado) {
  const router = useRouter();
  return (
    <div className="w-full sm:w-60">
      <ListaDesplegable
        variante="pildora"
        valor={orden}
        alCambiar={(v) => router.replace(direccion({ texto, soloConSaldo, orden: esOrdenCliente(v) ? v : "deben" }), { scroll: false })}
        opciones={ORDENES_CLIENTES.map((o) => ({ valor: o, etiqueta: t.ordenes[o] }))}
        placeholder={t.orden}
      />
    </div>
  );
}
